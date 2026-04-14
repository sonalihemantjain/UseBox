import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import { streamChatPlatforms, type ChatMessage, type SourceReference } from "@/lib/chat-stream";
import { usePlatformSelection } from "@/hooks/usePlatformSelection";
import { useUserContextFilters } from "@/hooks/useUserContextFilters";
import { SourceLinks } from "./SourceLinks";
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
  role?: string | null;
  onPick: (content: string, platform: string, sources?: SourceReference[]) => void;
  onError: (err: string) => void;
}

export function PlatformResponse({ messages, role, onPick, onError }: PlatformResponseProps) {
  const { selectedPlatforms } = usePlatformSelection();
  const { functionalArea, industry } = useUserContextFilters();
  const navigate = useNavigate();
  const { user, isReady } = useAuth();
  const { generateLab } = useLabs({ autoFetch: false });
  const labCreatedRef = useRef(false);

  const [responses, setResponses] = useState<Record<string, string>>({});
  const [doneStates, setDoneStates] = useState<Record<string, boolean>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [sourcesMap, setSourcesMap] = useState<Record<string, SourceReference[]>>({});
  const [showSources, setShowSources] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("");
  const buffers = useRef<Record<string, string>>({});

  const platformKey = useMemo(
    () => selectedPlatforms.map((p) => p.id).sort().join("|"),
    [selectedPlatforms]
  );

  const platformIds = useMemo(() => selectedPlatforms.map((p) => p.id), [selectedPlatforms]);
  const platformNames = useMemo(() => selectedPlatforms.map((p) => p.name), [selectedPlatforms]);
  const idByName = useMemo(() => new Map(selectedPlatforms.map((p) => [p.name, p.id])), [selectedPlatforms]);

  const messageKey = useMemo(() => {
    // Stable “signature” for this compare run
    return messages.map((m) => `${m.role}:${m.content}`).join("\n");
  }, [messages]);

  const requestKey = useMemo(() => {
    return `${platformKey}::${role || ""}::${messageKey}::${user?.id || ""}`;
  }, [platformKey, role, messageKey, user?.id]);

  useEffect(() => {
    if (selectedPlatforms.length === 0) return;
    const first = selectedPlatforms[0].id;
    if (!activeTab || !platformIds.includes(activeTab)) {
      setActiveTab(first);
    }
  }, [platformKey, activeTab, platformIds, selectedPlatforms]);

  useEffect(() => {
    // Don't start streaming until user is ready
    if (!isReady || selectedPlatforms.length === 0) {
      return;
    }

    const abort = new AbortController();

    // Reset state
    buffers.current = {};
    setResponses({});
    setDoneStates({});
    setPicked(null);
    setSourcesMap({});
    setShowSources(false);

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

    // Single streaming call for all platforms
    selectedPlatforms.forEach((p) => {
      buffers.current[p.id] = "";
    });

    streamChatPlatforms({
      messages,
      role,
      userId: user.id,
      functionalArea,
      industry,
      platforms: platformNames,
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
      onDone: () => {
        // If backend doesn't send explicit platformEnd for some reason, mark all as done.
        setDoneStates((prev) => {
          const next = { ...prev };
          platformIds.forEach((id) => { next[id] = true; });
          return next;
        });
      },
      onError,
      onSources: (platformName, sources, show) => {
        const platformId = idByName.get(platformName) || platformName;
        setSourcesMap((prev) => ({ ...prev, [platformId]: sources }));
        setShowSources(show);
      },
      onLabDetected: (_platformName, lab) => {
        // Labs are currently derived from the user prompt; treat as global for this message.
        handleLabDetected(lab);
      },
    });

    return () => {
      abort.abort();
    };
  // Keep effect keyed to compare request identity to avoid abort/restart loops.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, requestKey, functionalArea, industry]);

  const handlePick = (platformId: string) => {
    setPicked(platformId);
    const content = responses[platformId];
    const platform = selectedPlatforms.find((p) => p.id === platformId);
    const sources = sourcesMap[platformId] || [];
    onPick(content, platform?.name || platformId, sources);
  };

  // Merge sources from all platforms (deduplicate by id)
  const allSources = Object.values(sourcesMap)
    .flat()
    .filter((s, i, arr) => arr.findIndex((x) => x.id === s.id) === i);

  const allDone = selectedPlatforms.every((p) => doneStates[p.id]);

  if (selectedPlatforms.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Please select at least one platform in Settings to see responses.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Platform responses — pick the best one
        </span>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start">
          {selectedPlatforms.map((platform) => (
            <TabsTrigger key={platform.id} value={platform.id} className="relative">
              {platform.display_name}
              {picked === platform.id && (
                <Check className="h-3 w-3 ml-1.5 text-primary" />
              )}
              {!doneStates[platform.id] && (
                <Loader2 className="h-3 w-3 ml-1.5 animate-spin text-muted-foreground" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {selectedPlatforms.map((platform) => (
          <TabsContent key={platform.id} value={platform.id} className="mt-3">
            <div
              className={`relative rounded-xl border p-4 transition-all ${
                picked === platform.id
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : picked && picked !== platform.id
                  ? "border-border/50 opacity-50"
                  : "border-border bg-card"
              }`}
            >
              <div className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-secondary [&_pre]:rounded-lg [&_pre]:p-3 [&_a]:text-primary [&_li]:text-muted-foreground [&_p]:text-card-foreground min-h-[60px] max-h-[400px] overflow-y-auto">
                {responses[platform.id] ? (
                  <ReactMarkdown>{stripMetaTags(responses[platform.id])}</ReactMarkdown>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…
                  </div>
                )}
              </div>
              {allDone && !picked && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 w-full border-primary/30 hover:bg-primary/10 hover:text-primary"
                  onClick={() => handlePick(platform.id)}
                >
                  <Check className="h-3.5 w-3.5 mr-1.5" /> Pick this response
                </Button>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Source links below all responses - only show if is_source is true */}
      {showSources && allSources.length > 0 && (
        <div className="mt-3">
          <SourceLinks sources={allSources} />
        </div>
      )}
    </motion.div>
  );
}
