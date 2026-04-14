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

const CHAT_URL = `${import.meta.env.VITE_API_URL}/api/chat`;

export async function streamChat({
  messages,
  role,
  userId,
  model,
  models,
  platform, // Platform name for future business logic
  onDelta,
  onDone,
  onError,
  onSources,
  onLabDetected,
}: {
  messages: ChatMessage[];
  role?: string | null;
  userId?: string | null;
  model?: string;
  models?: string[];
  platform?: string; // Platform name parameter
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
  onSources?: (sources: SourceReference[], showSources: boolean) => void;
  onLabDetected?: (lab: LabDetection) => void;
}) {
  const requestBody = { 
    messages, 
    role: role || undefined, 
    userId: userId || undefined, 
    model: model || undefined,
    models: models || undefined,
    platform: platform || undefined
  };

  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
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
        
        // Check for sources metadata event with is_source flag
        if (parsed.sources && onSources) {
          const showSources = parsed.is_source === true;
          onSources(parsed.sources, showSources);
          continue;
        }

        // Check for lab detection event
        if (parsed.isLab !== undefined && onLabDetected) {
          onLabDetected({ isLab: parsed.isLab, labTopic: parsed.labTopic || "", labId: parsed.labId });
          continue;
        }

        // Check for model-specific events (dual mode)
        if (parsed.modelStart) {
          continue;
        }
        if (parsed.modelEnd) {
          continue;
        }
        
        // Handle content delta (works for both single and dual mode)
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
          const showSources = parsed.is_source === true;
          onSources(parsed.sources, showSources);
          continue;
        }
        if (parsed.isLab !== undefined && onLabDetected) {
          onLabDetected({ isLab: parsed.isLab, labTopic: parsed.labTopic || "", labId: parsed.labId });
          continue;
        }
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}


export async function streamChatDual({
  messages,
  role,
  userId,
  models,
  onDeltaA,
  onDeltaB,
  onDone,
  onError,
  onSources,
  onLabDetected,
}: {
  messages: ChatMessage[];
  role?: string | null;
  userId?: string | null;
  models: [string, string];
  onDeltaA: (text: string) => void;
  onDeltaB: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
  onSources?: (sources: SourceReference[], showSources: boolean) => void;
  onLabDetected?: (lab: LabDetection) => void;
}) {
  console.log('🔵 streamChatDual called with:', { role, userId, models });

  if (!userId) {
    console.warn('⚠️ streamChatDual: userId is not provided! Labs will not be saved.');
  }

  const requestBody = { 
    messages, 
    role: role || undefined, 
    userId: userId || undefined, 
    models
  };
  
  console.log('📤 Sending dual request body:', requestBody);

  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
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
  let currentModel: string | null = null;

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
        
        // Check for sources metadata event with is_source flag
        if (parsed.sources && onSources) {
          const showSources = parsed.is_source === true;
          onSources(parsed.sources, showSources);
          continue;
        }

        // Check for lab detection event
        if (parsed.isLab !== undefined && onLabDetected) {
          onLabDetected({ isLab: parsed.isLab, labTopic: parsed.labTopic || "", labId: parsed.labId });
          continue;
        }

        // Check for model start/end events
        if (parsed.modelStart) {
          currentModel = parsed.modelStart;
          console.log(`🎬 Model ${currentModel} started`);
          continue;
        }
        if (parsed.modelEnd) {
          console.log(`🏁 Model ${currentModel} ended`);
          currentModel = null;
          continue;
        }
        
        // Handle content delta based on current model
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content && currentModel) {
          if (currentModel === models[0]) {
            onDeltaA(content);
          } else if (currentModel === models[1]) {
            onDeltaB(content);
          }
        }
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  onDone();
}
