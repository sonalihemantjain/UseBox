import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import { streamChatPlatforms, type ChatMessage, type SourceReference } from "@/lib/chat-stream";
import { useUserContextFilters } from "@/hooks/useUserContextFilters";
import { useLabs } from "@/hooks/useLabs";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// Strip the AI's "📚 Sources" markdown section since we render SourceLinks separately
function stripMetaTags(content: string): string {
  return content
    .replace(/\n---\n📚[\s\S]*$/m, "")
    .replace(/\n📚 \*\*Sources[:\s]*\*\*[\s\S]*$/m, "")
    .replace(/\[IS_LAB:(true|false)\]/gi, "")
    .trim();
}

interface PlatformResponseProps {
  messages: ChatMessage[];
  platforms: string[];
  role?: string | null;
  initialActivePlatformName?: string | null;
  autoStart?: boolean;
  allowPick?: boolean;
  onPick: (content: string, platform: string, sources?: SourceReference[]) => void;
  onError: (err: string) => void;
  finalContent?: string;
}

function toPlatformLabel(name: string): string {
  const normalized = (name || "").trim().toLowerCase();
  if (normalized === "openai") return "OpenAI";
  if (normalized === "google") return "Google";
  if (normalized === "microsoft") return "Microsoft";
  if (normalized === "anthropic") return "Anthropic";
  return name
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function PlatformResponse({
  messages,
  platforms,
  role,
  initialActivePlatformName,
  autoStart = false,
  allowPick = true,
  onPick,
  onError,
  finalContent,
}: PlatformResponseProps) {
  const { functionalArea, industry } = useUserContextFilters();
  const navigate = useNavigate();
  const { user, isReady } = useAuth();
  const { generateLab } = useLabs({ autoFetch: false });
  const labCreatedRef = useRef(false);

  const [responses, setResponses] = useState<Record<string, string>>({});
  const [doneStates, setDoneStates] = useState<Record<string, boolean>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [sourcesMap, setSourcesMap] = useState<Record<string, SourceReference[]>>({});
  const [activeTab, setActiveTab] = useState<string>("");
  const buffers = useRef<Record<string, string>>({});
  const startedRef = useRef<Set<string>>(new Set());

  const platformKey = useMemo(
    () => (platforms || []).map((p) => p.trim()).filter(Boolean).sort().join("|"),
    [platforms]
  );

  const platformNames = useMemo(
    () => (platforms || []).map((p) => p.trim()).filter(Boolean),
    [platforms]
  );
  const platformIds = useMemo(() => platformNames, [platformNames]);
  const idByName = useMemo(() => new Map(platformNames.map((p) => [p, p])), [platformNames]);

  const messageKey = useMemo(() => {
    // Stable “signature” for this compare run
    return messages.map((m) => `${m.role}:${m.content}`).join("\n");
  }, [messages]);

  const requestKey = useMemo(() => {
    // Keyed to message history + user + persona + current active tab.
    // We intentionally stream only the active tab (lazy-load per platform).
    return `${role || ""}::${messageKey}::${user?.id || ""}::${activeTab || ""}`;
  }, [role, messageKey, user?.id, activeTab]);

  useEffect(() => {
    if (platformNames.length === 0) return;
    if (!autoStart) return;
    const preferredId = initialActivePlatformName
      ? (idByName.get(initialActivePlatformName) || initialActivePlatformName)
      : null;
    const fallback = platformNames[0];
    const nextTab = preferredId && platformIds.includes(preferredId) ? preferredId : fallback;
    if (!activeTab || !platformIds.includes(activeTab) || activeTab !== nextTab) {
      setActiveTab(nextTab);
    }
  }, [autoStart, platformKey, activeTab, platformIds, platformNames, initialActivePlatformName, idByName]);

  useEffect(() => {
    // Don't start streaming if we already have the final content
    if (finalContent || !isReady || platformNames.length === 0) {
      return;
    }

    const abort = new AbortController();

    // Reset state for a new compare run (new message history / persona).
    buffers.current = {};
    startedRef.current = new Set();
    setResponses({});
    setDoneStates({});
    setPicked(null);
    setSourcesMap({});

    // Validation: Check if userId is available
    if (!user?.id) {
      console.error('❌ User ID is not available!');
      toast.error('User ID is not set. Please log in again.', {
        description: 'Labs cannot be created without a valid user session.',
        duration: 5000,
      });
      onError('User ID is not available. Please log in again.');
      return;
    }

    const handleLabDetected = async (lab: { isLab: boolean; labTopic: string; labId?: string }) => {
      if (lab.isLab && lab.labTopic && !labCreatedRef.current) {
        labCreatedRef.current = true;
        
        if (lab.labId) {
          toast.success("🧪 A practical lab is being prepared for you!", {
            description: "This may take 10-30 seconds. You'll be notified when it's ready.",
            duration: 5000,
          });
          
          const checkLabReady = async (attempts = 0): Promise<void> => {
            if (attempts >= 30) {
              toast.error("Lab generation is taking longer than expected. Please check your Labs page in a moment.");
              return;
            }
            
            try {
              const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
              const response = await fetch(`${apiUrl}/api/labs/${lab.labId}`);
              
              if (response.ok) {
                toast.success("✅ Lab is ready!", {
                  action: { label: "Open Lab", onClick: () => navigate("/lab") },
                  duration: 10000,
                });
              } else if (response.status === 404) {
                setTimeout(() => checkLabReady(attempts + 1), 2000);
              } else {
                throw new Error("Failed to check lab status");
              }
            } catch (error) {
              console.error("Error checking lab status:", error);
              setTimeout(() => checkLabReady(attempts + 1), 2000);
            }
          };
          
          setTimeout(() => checkLabReady(), 3000);
        } else {
          toast.info("🧪 Creating a lab for this topic...");
          const labId = await generateLab(lab.labTopic);
          if (labId) {
            toast.success("Lab created! Check your Labs page.", {
              action: { label: "Open Lab", onClick: () => navigate("/lab") },
            });
          }
        }
      }
    };

    // Auto-start only when requested (e.g., locked platform).
    if (!autoStart) {
      return () => abort.abort();
    }

    const first = activeTab || platformNames[0];
    if (first) {
      buffers.current[first] = "";
      startedRef.current.add(first);
      streamChatPlatforms({
        messages,
        role,
        userId: user.id,
        functionalArea,
        industry,
        platforms: [first],
        signal: abort.signal,
        onPlatformDelta: (platformName, t) => {
          const platformId = idByName.get(platformName) || platformName;
          buffers.current[platformId] = (buffers.current[platformId] || "") + t;
          setResponses((prev) => ({ ...prev, [platformId]: buffers.current[platformId] }));
        },
        onPlatformDone: (platformName) => {
          const platformId = idByName.get(platformName) || platformName;
          setDoneStates((prev) => ({ ...prev, [platformId]: true }));
          
          // Auto-pick if this was an auto-started direct response (locked platform)
          if (!allowPick) {
            const finalContent = buffers.current[platformId] || "";
            const sources = sourcesMap[platformId] || [];
            onPick(finalContent, platformName, sources);
          }
        },
        onDone: () => {
          // No-op: done is tracked per platform via onPlatformDone.
        },
        onError,
        onSources: (platformName, sources, _show) => {
          const platformId = idByName.get(platformName) || platformName;
          setSourcesMap((prev) => ({ ...prev, [platformId]: sources }));
        },
        onLabDetected: (_platformName, lab) => {
          handleLabDetected(lab);
        },
      });
    }

    return () => {
      abort.abort();
    };
  // Keep effect keyed to compare request identity to avoid abort/restart loops.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, requestKey, functionalArea, industry, platformKey, autoStart]);

  // When user clicks a different platform tab, fetch that platform only (once).
  useEffect(() => {
    if (finalContent || !isReady || !user?.id) return;
    if (!activeTab) return;
    if (startedRef.current.has(activeTab)) return;
    if (!platformIds.includes(activeTab)) return;

    const abort = new AbortController();
    buffers.current[activeTab] = buffers.current[activeTab] || "";
    startedRef.current.add(activeTab);

    streamChatPlatforms({
      messages,
      role,
      userId: user.id,
      functionalArea,
      industry,
      platforms: [activeTab],
      signal: abort.signal,
      onPlatformDelta: (platformName, t) => {
        const platformId = idByName.get(platformName) || platformName;
        buffers.current[platformId] = (buffers.current[platformId] || "") + t;
        setResponses((prev) => ({ ...prev, [platformId]: buffers.current[platformId] }));
      },
      onPlatformDone: (platformName) => {
        const platformId = idByName.get(platformName) || platformName;
        setDoneStates((prev) => ({ ...prev, [platformId]: true }));
      },
      onDone: () => {},
      onError,
      onSources: (platformName, sources, _show) => {
        const platformId = idByName.get(platformName) || platformName;
        setSourcesMap((prev) => ({ ...prev, [platformId]: sources }));
      },
      onLabDetected: (_platformName, lab) => {
        // Labs are currently derived from the user prompt; treat as global for this message.
        // Avoid duplicate generation checks across platforms.
        handleLabDetected(lab);
      },
    });

    return () => abort.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handlePick = (platformId: string) => {
    setPicked(platformId);
    const content = responses[platformId];
    const sources = sourcesMap[platformId] || [];
    onPick(content, platformId, sources);
  };

  const allDone = platformIds.every((id) => doneStates[id]);

  if (platformNames.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No platforms available for comparison.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
        Explore platform responses
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start bg-transparent p-0 h-auto gap-2 flex-wrap">
          {platformNames.map((platformName) => (
            <TabsTrigger
              key={platformName}
              value={platformName}
              className="relative rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-none data-[state=active]:border-primary/40 data-[state=active]:bg-primary/10 data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              {toPlatformLabel(platformName)}
              {picked === platformName ? (
                <Check className="h-3 w-3 ml-1.5 text-primary" />
              ) : (
                <ChevronRight 
                  className={`h-3 w-3 ml-1 transition-colors ${
                    !doneStates[platformName] 
                      ? "text-primary animate-pulse" 
                      : "text-muted-foreground group-data-[state=active]:text-primary"
                  }`} 
                />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {!activeTab && (
          <TabsContent value="__empty__" className="mt-3">
            <div className="rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
              Select a platform above to generate its response.
            </div>
          </TabsContent>
        )}

        {platformNames.map((platformName) => (
          <TabsContent key={platformName} value={platformName} className="mt-3">
            <div className="relative rounded-lg border border-border bg-background p-4">
              <div className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-muted [&_pre]:rounded-lg [&_pre]:p-3 [&_a]:text-primary [&_li]:text-muted-foreground [&_p]:text-foreground min-h-[60px] max-h-[340px] overflow-y-auto">
                {finalContent && activeTab === platformName ? (
                  <ReactMarkdown>{stripMetaTags(finalContent)}</ReactMarkdown>
                ) : responses[platformName] ? (
                  <ReactMarkdown>{stripMetaTags(responses[platformName])}</ReactMarkdown>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {allowPick && activeTab && doneStates[activeTab] && responses[activeTab] && (
        <Button className="mt-3 w-full" onClick={() => handlePick(activeTab)}>
          Continue chat with {toPlatformLabel(activeTab)} →
        </Button>
      )}

      {/* Sources hidden temporarily */}
    </motion.div>
  );
}
