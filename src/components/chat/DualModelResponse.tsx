import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { streamChat, type ChatMessage, type SourceReference } from "@/lib/chat-stream";
import { useModelSelection } from "@/hooks/useModelSelection";
import { SourceLinks } from "./SourceLinks";
import { useLabs } from "@/hooks/useLabs";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const MODEL_LABELS: Record<string, string> = {
  "google/gemini-3-flash-preview": "Gemini Flash",
  "google/gemini-2.5-pro": "Gemini 2.5 Pro",
  "google/gemini-2.5-flash": "Gemini 2.5 Flash",
  "openai/gpt-5-mini": "GPT-5 Mini",
  "openai/gpt-5": "GPT-5",
  "openai/gpt-5-nano": "GPT-5 Nano",
};

// Strip the AI's "📚 Sources" markdown section since we render SourceLinks separately
function stripMetaTags(content: string): string {
  return content
    .replace(/\n---\n📚[\s\S]*$/m, "")
    .replace(/\n📚 \*\*Sources[:\s]*\*\*[\s\S]*$/m, "")
    .replace(/\[IS_LAB:(true|false)\]/gi, "")
    .trim();
}

interface DualModelResponseProps {
  messages: ChatMessage[];
  role?: string | null;
  onPick: (content: string, model: string, sources?: SourceReference[]) => void;
  onError: (err: string) => void;
}

export function DualModelResponse({ messages, role, onPick, onError }: DualModelResponseProps) {
  const { selectedModels } = useModelSelection();
  const navigate = useNavigate();
  const { user, isReady } = useAuth();
  const { generateLab } = useLabs();
  const labCreatedRef = useRef(false);
  const MODEL_A = selectedModels[0];
  const MODEL_B = selectedModels[1];

  const [responseA, setResponseA] = useState("");
  const [responseB, setResponseB] = useState("");
  const [doneA, setDoneA] = useState(false);
  const [doneB, setDoneB] = useState(false);
  const [picked, setPicked] = useState<"A" | "B" | null>(null);
  const [sourcesA, setSourcesA] = useState<SourceReference[]>([]);
  const [sourcesB, setSourcesB] = useState<SourceReference[]>([]);
  const bufA = useRef("");
  const bufB = useRef("");

  useEffect(() => {
    // Don't start streaming until user is ready
    if (!isReady) {
      console.log('⏳ Waiting for auth to be ready...');
      return;
    }

    bufA.current = "";
    bufB.current = "";

    // Debug logging
    console.log('🟢 DualModelResponse useEffect - user:', user);
    console.log('🟢 user?.id:', user?.id);
    console.log('🟢 typeof user?.id:', typeof user?.id);
    console.log('🟢 isReady:', isReady);

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

    console.log('✅ User ID validated:', user.id);

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

    streamChat({
      messages,
      role,
      userId: user.id,
      model: MODEL_A,
      onDelta: (t) => { bufA.current += t; setResponseA(bufA.current); },
      onDone: () => setDoneA(true),
      onError,
      onSources: (sources) => setSourcesA(sources),
      onLabDetected: handleLabDetected,
    });

    streamChat({
      messages,
      role,
      userId: user.id,
      model: MODEL_B,
      onDelta: (t) => { bufB.current += t; setResponseB(bufB.current); },
      onDone: () => setDoneB(true),
      onError,
      onSources: (sources) => setSourcesB(sources),
      onLabDetected: handleLabDetected,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, user?.id]);

  const handlePick = (side: "A" | "B") => {
    setPicked(side);
    const content = side === "A" ? responseA : responseB;
    const model = side === "A" ? MODEL_A : MODEL_B;
    const sources = side === "A" ? sourcesA : sourcesB;
    onPick(content, model, sources);
  };

  // Merge sources from both models (deduplicate by id)
  const allSources = [...sourcesA, ...sourcesB].filter(
    (s, i, arr) => arr.findIndex((x) => x.id === s.id) === i
  );

  const bothDone = doneA && doneB;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Compare responses — pick the best one
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Model A */}
        <div
          className={`relative rounded-xl border p-4 transition-all ${
            picked === "A"
              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
              : picked === "B"
              ? "border-border/50 opacity-50"
              : "border-border bg-card hover:border-primary/30"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
              {MODEL_LABELS[MODEL_A]}
            </span>
            {!doneA && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            {picked === "A" && <Check className="h-4 w-4 text-primary" />}
          </div>
          <div className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-secondary [&_pre]:rounded-lg [&_pre]:p-3 [&_a]:text-primary [&_li]:text-muted-foreground [&_p]:text-card-foreground min-h-[60px] max-h-[400px] overflow-y-auto">
            {responseA ? <ReactMarkdown>{stripMetaTags(responseA)}</ReactMarkdown> : (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…
              </div>
            )}
          </div>
          {bothDone && !picked && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3 w-full border-primary/30 hover:bg-primary/10 hover:text-primary"
              onClick={() => handlePick("A")}
            >
              <Check className="h-3.5 w-3.5 mr-1.5" /> Pick this response
            </Button>
          )}
        </div>

        {/* Model B */}
        <div
          className={`relative rounded-xl border p-4 transition-all ${
            picked === "B"
              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
              : picked === "A"
              ? "border-border/50 opacity-50"
              : "border-border bg-card hover:border-primary/30"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
              {MODEL_LABELS[MODEL_B]}
            </span>
            {!doneB && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            {picked === "B" && <Check className="h-4 w-4 text-primary" />}
          </div>
          <div className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-secondary [&_pre]:rounded-lg [&_pre]:p-3 [&_a]:text-primary [&_li]:text-muted-foreground [&_p]:text-card-foreground min-h-[60px] max-h-[400px] overflow-y-auto">
            {responseB ? <ReactMarkdown>{stripMetaTags(responseB)}</ReactMarkdown> : (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…
              </div>
            )}
          </div>
          {bothDone && !picked && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3 w-full border-primary/30 hover:bg-primary/10 hover:text-primary"
              onClick={() => handlePick("B")}
            >
              <Check className="h-3.5 w-3.5 mr-1.5" /> Pick this response
            </Button>
          )}
        </div>
      </div>

      {/* Source links below both responses */}
      {allSources.length > 0 && (
        <div className="mt-3">
          <SourceLinks sources={allSources} />
        </div>
      )}
    </motion.div>
  );
}
