import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.object({
  conversation: z.string().min(1),
  userResponse: z.string().min(1).max(2000),
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
        JSON.stringify({ error: "Invalid input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { conversation, userResponse } = validation.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are LingoBuddy responding to a user practicing English listening comprehension.

Previous conversation context:
${conversation}

The user just responded: "${userResponse}"

Your job:
1. Acknowledge their response warmly
2. If you notice any grammar/vocabulary issues, naturally model correct usage in your reply (don't point out errors)
3. Continue the conversation naturally based on their response
4. Keep it concise (2-3 sentences)
5. Frame any language improvements conversationally: "That's a good point! I might say..." or "Interesting! Another way to express that is..."

NEVER use words like: error, mistake, wrong, incorrect, should fix
Be encouraging and keep the conversation flowing naturally.`;

    console.log("Calling AI to respond to user input...");
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
          { role: "user", content: userResponse },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits needed. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || "Thanks for sharing! Let's continue...";

    console.log("Successfully generated AI response");
    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in listen-buddy-respond:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate response. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
