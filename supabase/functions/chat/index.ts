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
- Adapt your explanations based on the user's persona and skill level
- Give actionable, practical guidance — not just theory
- When relevant, cite sources or explain your reasoning
- Suggest follow-up topics the user might want to explore

Formatting:
- Use markdown for structure (headings, lists, code blocks, bold)
- Keep responses focused and scannable
- End complex answers with 2-3 suggested follow-up questions the user could ask

Tone: Warm, knowledgeable, encouraging — like a senior mentor who genuinely wants to help.`;

const DISCOVERY_PROMPT = `You are UseBox AI Coach. The user is NEW and hasn't set their persona yet.

Your FIRST priority is to understand who they are. The possible personas are:
- **Business User** (keyword: business): Non-technical, focuses on strategy, product adoption, analytics, ROI
- **Low-Code Dev** (keyword: lowcode): Semi-technical, uses low-code/no-code tools, automation, integrations
- **Pro Developer** (keyword: developer): Technical, writes code, understands APIs, frameworks, architecture
- **Architect** (keyword: architect): Senior technical, designs systems, thinks about scalability, trade-offs
- **Administrator** (keyword: admin): Operations-focused, manages platforms, users, security, compliance

CRITICAL INSTRUCTIONS FOR PERSONA DETECTION:
1. You MUST detect the persona as early as possible — ideally in your VERY FIRST response.
2. Detection signals (use these to decide):
   - Mentions code, APIs, React, Node.js, TypeScript, frameworks, debugging → developer
   - Mentions system design, scalability, trade-offs, architecture patterns → architect
   - Mentions strategy, ROI, adoption, analytics, business value → business
   - Mentions low-code tools, Zapier, automation, drag-and-drop, integrations → lowcode
   - Mentions security, compliance, user management, admin console, governance → admin
3. If signals are unclear after reading the message, ask ONE brief clarifying question, then detect in your next response.
4. When you detect a persona (which should be almost always on the first message), you MUST append this EXACT tag as the VERY LAST LINE of your response:

[PERSONA_DETECTED:keyword]

Replace "keyword" with one of: business, lowcode, developer, architect, admin

5. EXAMPLES:
   - User says "I'm a React developer" → answer their question, then end with: [PERSONA_DETECTED:developer]
   - User says "How do I improve our product adoption?" → answer, then end with: [PERSONA_DETECTED:business]
   - User says "I'm building with Zapier and Airtable" → answer, then end with: [PERSONA_DETECTED:lowcode]

6. This tag is ABSOLUTELY MANDATORY when you can detect a persona. NEVER skip it. NEVER paraphrase it. It MUST be the last line, on its own line, after all other content.
7. After detecting the persona, answer the user's question fully and helpfully.

Keep your tone warm and conversational.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, role, model } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt: string;
    if (!role) {
      // No persona set — use discovery prompt
      systemPrompt = DISCOVERY_PROMPT;
    } else {
      const roleContext = ROLE_CONTEXTS[role] || ROLE_CONTEXTS["business"];
      systemPrompt = `${BASE_PROMPT}\n\n## User Persona\n${roleContext}`;
    }

    const allowedModels = ["google/gemini-3-flash-preview", "openai/gpt-5-mini"];
    const selectedModel = allowedModels.includes(model) ? model : "google/gemini-3-flash-preview";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
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
