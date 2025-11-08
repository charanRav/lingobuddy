import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.object({
  message: z.string().trim().min(1).max(2000)
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check daily usage limit
    const { data: usageData, error: usageError } = await supabaseClient.rpc('get_daily_usage', {
      p_user_id: user.id,
      p_feature: 'talk'
    });

    if (usageError) {
      console.error("Usage check error:", usageError);
    }

    const totalUsage = usageData || 0;
    if (totalUsage >= 50) {
      return new Response(
        JSON.stringify({ error: "Daily limit of 50 conversations reached. Limit resets at midnight." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    
    // Validate input
    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { message } = validation.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are LingoBuddy, a friendly English conversation partner who helps users improve through clear, kind feedback.

CORRECTION APPROACH - Be helpful and specific:

1. Respond warmly to their message
2. ALWAYS catch errors: spelling, grammar, word choice, pronunciation issues (if evident from text)
3. Add a correction tip with "💡" for ANY mistakes - be direct but encouraging

Format:
[Natural conversational response]

💡 [Specific correction - ALWAYS include if there are errors]

Error Types to Identify:
- Spelling: "becuase" → "because"
- Grammar: "I goes" → "I go" or "I went" 
- Tense: "I go yesterday" → "I went yesterday"
- Articles: "I bought new car" → "I bought a new car"
- Prepositions: "I'm good in English" → "I'm good at English"
- Word choice: "I'm boring" (when they mean "I'm bored")

Examples:

User: "I very like pizza and I eat it tomorrow"
You: "Pizza is delicious! What toppings do you enjoy?

💡 Say 'I like pizza very much' (word order), and 'I will eat it tomorrow' (future tense)"

User: "Yesterday I goed to beach with my freinds"
You: "Beach days are the best! Did you swim or just relax?

💡 Corrections: 'I went' (not 'goed'), 'the beach' (add 'the'), 'friends' (not 'freinds')"

User: "How are you?"
You: "I'm doing great, thank you! How about you?"

Keep responses conversational (2-3 sentences) but ALWAYS provide corrections when needed.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const fullMessage = data.choices[0]?.message?.content || "I didn't catch that. Could you try again?";
    
    // Extract correction if present
    let aiMessage = fullMessage;
    let correction = "";
    
    const tipMatch = fullMessage.match(/💡\s*(.+?)(?:\n|$)/);
    if (tipMatch) {
      correction = tipMatch[1].trim();
      aiMessage = fullMessage.replace(/💡\s*.+?(?:\n|$)/, '').trim();
    }

    // Increment usage count
    await supabaseClient.rpc('increment_usage', {
      p_user_id: user.id,
      p_feature: 'talk'
    });

    return new Response(
      JSON.stringify({ message: aiMessage, correction }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in talk-buddy-chat:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
