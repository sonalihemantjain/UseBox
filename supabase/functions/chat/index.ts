import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ROLE_CONTEXTS: Record<string, string> = {
  business: "The user is a Business User — they prefer high-level explanations, business value framing, ROI-oriented advice, and minimal technical jargon. Use analogies and real-world examples.",
  lowcode: "The user is a Low-Code Developer — they understand basic technical concepts and work with low-code/no-code tools. Explain with visual metaphors, reference drag-and-drop builders, and provide step-by-step workflows.",
  developer: "The user is a Pro Developer — they want precise technical details, code examples, API references, and architectural patterns. Be concise and technically rigorous.",
  architect: "The user is an Architect — they think in systems, integrations, scalability, and trade-offs. Discuss design patterns, infrastructure considerations, and long-term maintainability.",
  admin: "The user is an Administrator — they focus on configuration, security, compliance, user management, and operations. Provide admin-oriented guidance with governance best practices.",
};

const BASE_PROMPT = `You are UseBox AI Coach — a friendly, expert AI coaching assistant for an AI-powered knowledge platform.

Your role:
- Provide clear, step-by-step coaching on product adoption, learning, and best practices
- Adapt your explanations based on the user's role and skill level
- Give actionable, practical guidance — not just theory
- When relevant, cite sources or explain your reasoning
- Suggest follow-up topics the user might want to explore

Formatting:
- Use markdown for structure (headings, lists, code blocks, bold)
- Keep responses focused and scannable
- End complex answers with 2-3 suggested follow-up questions the user could ask

Tone: Warm, knowledgeable, encouraging — like a senior mentor who genuinely wants to help.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, role } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const roleContext = ROLE_CONTEXTS[role] || ROLE_CONTEXTS["business"];
    const systemPrompt = `${BASE_PROMPT}\n\n## User Context\n${roleContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
