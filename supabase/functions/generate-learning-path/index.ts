import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { goal, role, experience_level } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are an AI learning path generator. Create structured learning paths for professionals. Always respond using the provided tool.",
          },
          {
            role: "user",
            content: `Generate a personalized learning path for someone with the following profile:
- Goal: ${goal}
- Current Role: ${role || "Not specified"}
- Experience Level: ${experience_level || "beginner"}

Create a focused, actionable learning path with 4-6 steps. For each step, include a detailed "content" field (3-5 paragraphs in markdown) that teaches the concept thoroughly — this is what the learner will read.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_learning_path",
              description: "Create a structured learning path",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Path title" },
                  description: { type: "string", description: "Brief path description" },
                  category: { type: "string", enum: ["ai-fundamentals", "product", "development", "governance", "data", "learning"] },
                  difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
                  estimated_hours: { type: "number" },
                  steps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string", description: "Brief one-line summary" },
                        content: { type: "string", description: "Detailed markdown content (3-5 paragraphs) teaching this step's concept" },
                      },
                      required: ["title", "description", "content"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["title", "description", "category", "difficulty", "estimated_hours", "steps"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_learning_path" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const pathData = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(pathData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-learning-path error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
