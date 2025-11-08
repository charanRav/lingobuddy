import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  topic: z.string().trim().min(3).max(200)
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
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
      p_feature: 'read'
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
    
    const { topic } = validation.data;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are LingoBuddy's reading content generator.

Create engaging, natural reading material on the topic: "${topic}"

Guidelines:
- Write 3-4 well-structured paragraphs
- Use intermediate to advanced English vocabulary
- Include varied sentence structures for practice
- Make it interesting, informative, and naturally flowing
- Each paragraph should be 3-5 sentences
- Use vocabulary that's challenging but accessible
- Write in a clear, engaging style like you're explaining to a friend

CRITICAL FORMAT: Respond with ONLY valid JSON. No markdown, no code blocks, just pure JSON:
{
  "content": "Your full reading content here as natural paragraphs with proper spacing between paragraphs.",
  "difficult_words": ["word1", "word2", "word3"],
  "definitions": {
    "word1": "brief definition",
    "word2": "brief definition",
    "word3": "brief definition"
  }
}

RULES:
- For "content": Write flowing paragraphs separated by double newlines (\n\n)
- For "difficult_words": List 8-10 challenging words (8+ letters) from the content
- For "definitions": Keep each definition 1-3 words maximum
- Examples of good definitions: "relating to space", "very large", "to examine"
- DO NOT include any markdown formatting, code blocks, or extra text outside the JSON`;

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
          { role: "user", content: `Generate advanced English reading content about: ${topic}` }
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
    const content = data.choices[0].message.content;

    // Try to parse JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(content);
    } catch (e) {
      console.log('AI did not return JSON, falling back to manual extraction');
      // Fallback: extract difficult words manually
      const words = content.match(/\b[\w']+\b/g) || [];
      const difficultWords = words.filter((word: string) => word.length > 8);
      const uniqueDifficultWords = [...new Set(difficultWords.map((w: string) => w.toLowerCase()))];
      
      return new Response(JSON.stringify({ 
        content,
        difficultWords: uniqueDifficultWords,
        definitions: {}
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Increment usage count
    await supabaseClient.rpc('increment_usage', {
      p_user_id: user.id,
      p_feature: 'read'
    });

    return new Response(JSON.stringify({ 
      content: parsedResponse.content,
      difficultWords: parsedResponse.difficult_words || [],
      definitions: parsedResponse.definitions || {}
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in read-buddy-generate:', error);
    return new Response(JSON.stringify({ error: "An error occurred. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
