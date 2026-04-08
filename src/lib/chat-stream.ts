export type ChatMessage = { role: "user" | "assistant"; content: string };

export type SourceReference = {
  id: string;
  title: string;
  description: string;
};

export type LabDetection = {
  isLab: boolean;
  labTopic: string;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export async function streamChat({
  messages,
  role,
  model,
  onDelta,
  onDone,
  onError,
  onSources,
  onLabDetected,
}: {
  messages: ChatMessage[];
  role?: string | null;
  model?: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
  onSources?: (sources: SourceReference[]) => void;
  onLabDetected?: (lab: LabDetection) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, role: role || undefined, model }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    onError(data.error || `Request failed (${resp.status})`);
    return;
  }

  if (!resp.body) {
    onError("No response body");
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let streamDone = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") continue;

      try {
        const parsed = JSON.parse(jsonStr);
        
        // Check for sources metadata event
        if (parsed.sources && onSources) {
          onSources(parsed.sources);
          continue;
        }

        // Check for lab detection event
        if (parsed.isLab !== undefined && onLabDetected) {
          onLabDetected({ isLab: parsed.isLab, labTopic: parsed.labTopic || "" });
          continue;
        }
        
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  // Final flush
  if (buffer.trim()) {
    for (let raw of buffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.sources && onSources) {
          onSources(parsed.sources);
          continue;
        }
        if (parsed.isLab !== undefined && onLabDetected) {
          onLabDetected({ isLab: parsed.isLab, labTopic: parsed.labTopic || "" });
          continue;
        }
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}
