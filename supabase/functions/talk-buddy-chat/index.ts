import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

    const systemPrompt = `You are LingoBuddy, a friendly English conversation partner. 

CORE PRINCIPLE: Never explicitly point out errors. Instead, naturally model correct usage in your responses.

How to help:
1. Acknowledge their message warmly
2. If you notice grammar/vocabulary issues, naturally use the correct form in your response
3. Frame suggestions conversationally: "That's interesting! I'd say...", "Great point! Another way to put it is..."
4. NEVER use words like: error, mistake, wrong, incorrect, should, must

Example:
User: "I goes to market yesterday"
You: "Oh nice! I went to the market yesterday too. What did you buy?"

Keep responses short (2-3 sentences), natural, and encouraging. Focus on conversation, not teaching.`;

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
