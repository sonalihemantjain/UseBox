import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { streamChat, type ChatMessage } from "@/lib/chat-stream";

const MODEL_A = "google/gemini-3-flash-preview";
const MODEL_B = "openai/gpt-5-mini";

const MODEL_LABELS: Record<string, string> = {
  [MODEL_A]: "Gemini Flash",
  [MODEL_B]: "GPT-5 Mini",
};

interface DualModelResponseProps {
  messages: ChatMessage[];
  role?: string | null;
  onPick: (content: string, model: string) => void;
  onError: (err: string) => void;
}

export function DualModelResponse({ messages, role, onPick, onError }: DualModelResponseProps) {
  const [responseA, setResponseA] = useState("");
  const [responseB, setResponseB] = useState("");
  const [doneA, setDoneA] = useState(false);
  const [doneB, setDoneB] = useState(false);
  const [picked, setPicked] = useState<"A" | "B" | null>(null);
  const bufA = useRef("");
  const bufB = useRef("");

  useEffect(() => {
    bufA.current = "";
    bufB.current = "";

    streamChat({
      messages,
      role,
      model: MODEL_A,
      onDelta: (t) => { bufA.current += t; setResponseA(bufA.current); },
      onDone: () => setDoneA(true),
      onError,
    });

    streamChat({
      messages,
      role,
      model: MODEL_B,
      onDelta: (t) => { bufB.current += t; setResponseB(bufB.current); },
      onDone: () => setDoneB(true),
      onError,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePick = (side: "A" | "B") => {
    setPicked(side);
    const content = side === "A" ? responseA : responseB;
    const model = side === "A" ? MODEL_A : MODEL_B;
    onPick(content, model);
  };

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
            {responseA ? <ReactMarkdown>{responseA}</ReactMarkdown> : (
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
            {responseB ? <ReactMarkdown>{responseB}</ReactMarkdown> : (
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
    </motion.div>
  );
}
