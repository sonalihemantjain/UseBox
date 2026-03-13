import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const DISCOVERY_PROMPT = `You are UseBox AI Coach. The user is NEW and you need to identify their persona through a friendly conversation.

Your goal is to ask exactly 3 short questions, ONE AT A TIME, to understand who this user is. After the 3rd answer, detect their persona AND immediately start helping them.

## The 5 personas:
- **Business User** (keyword: business): Non-technical, focuses on strategy, product adoption, analytics, ROI
- **Low-Code Dev** (keyword: lowcode): Semi-technical, uses low-code/no-code tools, automation, integrations
- **Pro Developer** (keyword: developer): Technical, writes code, understands APIs, frameworks, architecture
- **Architect** (keyword: architect): Senior technical, designs systems, thinks about scalability, trade-offs
- **Administrator** (keyword: admin): Operations-focused, manages platforms, users, security, compliance

## Flow:

**Question 1** (if conversation has 0-1 user messages): Ask about their ROLE or what they do day-to-day. Example: "Welcome! 👋 I'd love to personalize your experience. To start — what's your primary role? Are you more on the business/strategy side, or do you work hands-on with technology?"

**Question 2** (if conversation has 2-3 user messages): Ask about the TOOLS or ACTIVITIES they use most. Example: "Got it! And what does a typical workday look like for you — do you write code, configure platforms, build automations, or focus on strategy and analytics?"

**Question 3** (if conversation has 4-5 user messages): Ask about their GOAL on this platform. Example: "Last question! What are you hoping to get out of UseBox — learning technical skills, understanding best practices, managing a team's adoption, or something else?"

**After Question 3 is answered** (conversation has 6+ user messages): Based on ALL their answers, detect the persona. Give a ONE SENTENCE summary of what you detected. Then IMMEDIATELY provide a helpful, substantive response related to what the user mentioned in their answers — give them real value right away. Do NOT ask "how can I help you?" or similar open-ended questions. Instead, proactively offer tips, resources, or a mini-guide based on their stated goals.

## CRITICAL RULES:
1. Ask ONLY ONE question per response
2. Keep questions short, warm, and conversational
3. Acknowledge each answer briefly before asking the next question
4. Do NOT detect persona until after the 3rd answer
5. After the 3rd answer, you MUST append this EXACT tag as the ABSOLUTE LAST LINE of your response, on its own line, with NO text after it:

[PERSONA_DETECTED:keyword]

Replace "keyword" with one of: business, lowcode, developer, architect, admin

6. This tag is MANDATORY. You MUST include it. NEVER forget it. NEVER skip it. It must be the VERY LAST LINE.
7. Do NOT wrap the tag in markdown, code blocks, or any formatting. Just the raw tag on its own line.
8. After detection, do NOT ask open-ended questions like "how can I help?" — instead give immediate, actionable value.

Tone: Warm, friendly, like a helpful onboarding guide.`;

const RAG_INSTRUCTION = `
## Knowledge Base Sources
The following knowledge articles from the UseBox platform are relevant to the user's question. Use them to provide accurate, grounded answers. When you use information from these sources, you MUST cite them.

CITATION FORMAT - You MUST follow this exactly:
- At the END of your response, add a "---" separator followed by a "📚 Sources" section
- List each source as: [Source Title](ARTICLE_ID)
- Example:
---
📚 **Sources:**
- [Introduction to RAG](abc-123-def)
- [AI Best Practices](xyz-789-ghi)

IMPORTANT: Always use the exact article IDs provided. Only cite sources you actually used.

## Relevant Articles:
`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, role, model } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt: string;
    let sourcesMetadata: any[] = [];

    if (!role) {
      systemPrompt = DISCOVERY_PROMPT;
    } else {
      const roleContext = ROLE_CONTEXTS[role] || ROLE_CONTEXTS["business"];
      systemPrompt = `${BASE_PROMPT}\n\n## User Persona\n${roleContext}`;

      // RAG: Search knowledge base for relevant content
      const lastUserMessage = [...messages].reverse().find((m: any) => m.role === "user");
      if (lastUserMessage) {
        try {
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          const supabase = createClient(supabaseUrl, supabaseKey);

          const { data: results } = await supabase.rpc("search_knowledge", {
            search_query: lastUserMessage.content,
            max_results: 3,
          });

          if (results && results.length > 0) {
            let ragContext = RAG_INSTRUCTION;
            for (const article of results) {
              ragContext += `\n### "${article.title}" (ID: ${article.id})\n`;
              ragContext += `Category: ${article.category} | Tags: ${(article.tags || []).join(", ")}\n`;
              // Truncate content to ~1500 chars per article
              const truncated = article.content.length > 1500
                ? article.content.substring(0, 1500) + "..."
                : article.content;
              ragContext += `Content:\n${truncated}\n`;

              sourcesMetadata.push({
                id: article.id,
                title: article.title,
                description: article.description || "",
              });
            }
            systemPrompt += "\n" + ragContext;
          }
        } catch (e) {
          console.error("RAG search error:", e);
          // Continue without RAG if search fails
        }
      }
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

    // If we have sources, prepend them as a custom SSE event before the AI stream
    if (sourcesMetadata.length > 0) {
      const sourceLine = `data: ${JSON.stringify({ sources: sourcesMetadata })}\n\n`;
      const encoder = new TextEncoder();
      const sourceChunk = encoder.encode(sourceLine);

      const stream = new ReadableStream({
        async start(controller) {
          // Send sources metadata first
          controller.enqueue(sourceChunk);

          // Then pipe the AI response
          const reader = response.body!.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
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
