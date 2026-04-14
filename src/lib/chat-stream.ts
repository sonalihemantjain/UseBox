export type ChatMessage = { role: "user" | "assistant"; content: string };

export type SourceReference = {
  id: string;
  title: string;
  description: string;
};

export type SourceResponse = {
  sources: SourceReference[];
  is_source: boolean;
};

export type LabDetection = {
  isLab: boolean;
  labTopic: string;
  labId?: string;
};

const CHAT_PLATFORMS_URL = `${import.meta.env.VITE_API_URL}/api/chat/platforms`;

export async function streamChatPlatforms({
  messages,
  role,
  userId,
  functionalArea,
  industry,
  platforms,
  signal,
  onPlatformDelta,
  onPlatformDone,
  onDone,
  onError,
  onSources,
  onLabDetected,
}: {
  messages: ChatMessage[];
  role?: string | null;
  userId?: string | null;
  functionalArea?: string | null;
  industry?: string | null;
  platforms: string[];
  signal?: AbortSignal;
  onPlatformDelta: (platform: string, text: string) => void;
  onPlatformDone?: (platform: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
  onSources?: (platform: string, sources: SourceReference[], showSources: boolean) => void;
  onLabDetected?: (platform: string, lab: LabDetection) => void;
}) {
  const requestBody = {
    messages,
    role: role || undefined,
    userId: userId || undefined,
    functionalArea: functionalArea || undefined,
    industry: industry || undefined,
    platforms,
  };

  let resp: Response;
  try {
    resp = await fetch(CHAT_PLATFORMS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal,
    });
  } catch (e) {
    // Abort is expected during re-renders/unmounts
    if (e instanceof DOMException && e.name === "AbortError") return;
    onError(e instanceof Error ? e.message : "Failed to fetch");
    return;
  }

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    onError(data.error || data.detail || `Request failed (${resp.status})`);
    return;
  }

  if (!resp.body) {
    onError("No response body");
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

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

        if (parsed.platformStart) continue;
        if (parsed.platformEnd) {
          if (onPlatformDone) onPlatformDone(parsed.platformEnd);
          continue;
        }

        const platform = parsed.platform as string | undefined;
        if (!platform) continue;

        if (parsed.sources && onSources) {
          const showSources = parsed.is_source === true;
          onSources(platform, parsed.sources as SourceReference[], showSources);
          continue;
        }

        if (parsed.isLab !== undefined && onLabDetected) {
          onLabDetected(platform, {
            isLab: parsed.isLab,
            labTopic: parsed.labTopic || "",
            labId: parsed.labId,
          });
          continue;
        }

        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onPlatformDelta(platform, content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  onDone();
}
