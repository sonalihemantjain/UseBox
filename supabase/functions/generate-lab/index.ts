import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, difficulty } = await req.json();
    if (!topic) {
      return new Response(JSON.stringify({ error: "Topic is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
            content: "You are a hands-on lab designer for AI and technology topics. Create practical, task-based labs that guide learners through real-world exercises. Each task should have 3-6 concrete steps with detailed content in markdown. Always respond using the provided tool.",
          },
          {
            role: "user",
            content: `Design a hands-on lab for the topic: "${topic}"
Difficulty level: ${difficulty || "intermediate"}

Create 3-5 tasks, each with 3-6 practical steps. Each step should have detailed markdown content (2-4 paragraphs) explaining what to do and how. The lab should be hands-on and practical, not theoretical.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_lab",
              description: "Create a structured hands-on lab",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Lab title" },
                  description: { type: "string", description: "Brief lab description" },
                  difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
                  tasks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        steps: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              title: { type: "string" },
                              content: { type: "string", description: "Detailed markdown content for this step" },
                            },
                            required: ["title", "content"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["title", "description", "steps"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["title", "description", "difficulty", "tasks"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_lab" } },
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

    const labData = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(labData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-lab error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
