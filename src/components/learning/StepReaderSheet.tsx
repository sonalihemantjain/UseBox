import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { LearningPathStep } from "@/hooks/useLearningPaths";

interface Props {
  step: LearningPathStep | null;
  open: boolean;
  onClose: () => void;
  enrolled: boolean;
  isCompleted: boolean;
  onToggleComplete: () => void;
}

export function StepReaderSheet({ step, open, onClose, enrolled, isCompleted, onToggleComplete }: Props) {
  if (!step) return null;

  const hasContent = step.content && step.content.trim().length > 0;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">Step {step.step_order}</Badge>
            {isCompleted && (
              <Badge className="bg-primary/10 text-primary border-primary/20 gap-1 text-xs">
                <CheckCircle2 className="h-3 w-3" /> Completed
              </Badge>
            )}
          </div>
          <SheetTitle className="font-display text-xl">{step.title}</SheetTitle>
          <p className="text-sm text-muted-foreground">{step.description}</p>
        </SheetHeader>

        <div className="prose prose-sm dark:prose-invert max-w-none mb-8">
          {hasContent ? (
            <ReactMarkdown>{step.content}</ReactMarkdown>
          ) : (
            <div className="text-muted-foreground text-center py-12 border border-dashed border-border rounded-xl">
              <p className="text-base mb-1">No detailed content yet</p>
              <p className="text-sm">This step only has a brief description. AI-generated paths include full content.</p>
            </div>
          )}
        </div>

        {enrolled && (
          <div className="sticky bottom-0 bg-background border-t border-border pt-4 pb-2">
            <Button
              variant={isCompleted ? "outline" : "default"}
              className="w-full gap-2"
              onClick={onToggleComplete}
            >
              {isCompleted ? (
                <><CheckCircle2 className="h-4 w-4" /> Mark as incomplete</>
              ) : (
                <><Circle className="h-4 w-4" /> Mark as complete</>
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
