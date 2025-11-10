import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  topic: z.string().trim().min(3).max(200),
  mode: z.string().optional()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get JWT from Authorization header (already verified by Supabase since verify_jwt = true)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract and decode JWT to get user ID
    const jwt = authHeader.replace('Bearer ', '');
    const parts = jwt.split('.');
    if (parts.length !== 3) {
      return new Response(
        JSON.stringify({ error: "Invalid token format" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const payload = JSON.parse(atob(parts[1]));
    const userId = payload.sub;
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Invalid token payload" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client for database operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Check daily usage limit
    const { data: usageData, error: usageError } = await supabaseClient.rpc('get_daily_usage', {
      p_user_id: userId,
      p_feature: 'listen'
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
    
    const { topic, mode } = validation.data;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are LingoBuddy's conversation generator. Create natural, engaging English conversations.

${mode === 'voice' ? 'Generate a spoken conversation that flows naturally when read aloud.' : 'Create a conversation that\'s clear and easy to follow.'}

Important:
- Keep language accessible for English learners
- Make it interesting and relatable
- Include different viewpoints for depth
- Each turn should be 2-3 sentences maximum
- Generate 6-8 conversation exchanges
- Sound natural, like real people talking

Topic: ${topic}

Format each line as:
Person A: [their message]
Person B: [their message]`;

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
          { role: "user", content: `Generate an engaging conversation or debate about: ${topic}` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const conversation = data.choices[0].message.content;

    // Increment usage count
    await supabaseClient.rpc('increment_usage', {
      p_user_id: userId,
      p_feature: 'listen'
    });

    return new Response(JSON.stringify({ conversation }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in listen-buddy-generate:', error);
    return new Response(JSON.stringify({ error: "An error occurred. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
