import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-buddy-personality",
};

const requestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1).max(4000)
  })).min(1).max(50),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      console.error("Validation error:", validation.error);
      return new Response(
        JSON.stringify({ error: "Invalid input format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { messages } = validation.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const personality = req.headers.get("x-buddy-personality") || "friendly";
    
    let systemPrompt = "You are LingoBuddy, a warm and supportive English learning companion.\n\n";
    
    if (personality === "formal") {
      systemPrompt += "Maintain a professional tone. ";
    } else if (personality === "fun") {
      systemPrompt += "Be playful and enthusiastic! ";
    } else {
      systemPrompt += "Be warm and encouraging. ";
    }
    
    systemPrompt += `
CORRECTION APPROACH - Be helpful and clear:

1. Respond naturally to their message with warmth
2. ALWAYS identify errors: spelling, grammar, word choice, sentence structure
3. Add a correction tip with "💡" if you spot ANY mistakes - be specific and educational

Format your response:
[Conversational response that acknowledges their message]

💡 [Specific correction with explanation - ALWAYS include if there are errors]

Error Types to Catch:
- Spelling mistakes: "becuase" → "because"
- Grammar: "I goes" → "I go" or "I went"
- Tense confusion: "I go yesterday" → "I went yesterday"
- Articles: "I like cat" → "I like cats" or "I like the cat"
- Word order: "I very like it" → "I like it very much"
- Vocabulary: Using wrong words or awkward phrasing

Examples:

User: "I goes to market yesterday and buyed some apple"
You: "That sounds like a productive trip! What else did you find at the market?

💡 Grammar tips: 'I went' (past tense), 'bought' (not 'buyed'), and 'some apples' (plural)"

User: "I am very exiting about the new movie"
You: "Oh, which movie are you looking forward to? I love discovering new films!

💡 Word choice: Use 'excited' when YOU feel excitement. 'Exciting' describes something that CAUSES excitement (like 'The movie is exciting')"

User: "Can you help me?"
You: "Of course! I'm here to help. What would you like to practice today?"

Be encouraging but honest. If they make mistakes, help them learn! Keep tips clear and actionable.`;

    console.log("Making request to AI gateway...");
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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Streaming response from AI gateway");
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("chat-buddy error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
