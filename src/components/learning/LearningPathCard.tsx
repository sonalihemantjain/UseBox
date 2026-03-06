import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Sparkles, ChevronRight, Trash2 } from "lucide-react";
import { getKnowledgeIcon } from "@/lib/knowledge-icons";
import type { LearningPath } from "@/hooks/useLearningPaths";

interface Props {
  path: LearningPath;
  index: number;
  onSelect: (path: LearningPath) => void;
  onEnroll: (pathId: string) => void;
  onDelete?: (pathId: string) => void;
}

const difficultyColors: Record<string, string> = {
  beginner: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  intermediate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  advanced: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export function LearningPathCard({ path, index, onSelect, onEnroll, onDelete }: Props) {
  const Icon = getKnowledgeIcon(path.icon);
  const enrolled = !!path.enrollment;
  const completedCount = path.enrollment?.completed_steps?.length || 0;
  const totalSteps = path.steps.length;
  const progressPct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;
  const isComplete = path.enrollment?.completed_at != null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <Card className="group hover:border-primary/30 transition-all duration-300 cursor-pointer relative overflow-hidden"
            onClick={() => onSelect(path)}>
        {path.is_ai_generated && (
          <div className="absolute top-3 right-3 flex items-center gap-1">
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(path.id); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1 text-xs">
              <Sparkles className="h-3 w-3" /> AI
            </Badge>
          </div>
        )}
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base font-display leading-tight mb-1">{path.title}</CardTitle>
              <p className="text-sm text-muted-foreground line-clamp-2">{path.description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge variant="outline" className={difficultyColors[path.difficulty] || ""}>
              {path.difficulty}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> {path.estimated_hours}h
            </span>
            <span className="text-xs text-muted-foreground">{totalSteps} steps</span>
          </div>

          {enrolled ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{completedCount}/{totalSteps} completed</span>
                {isComplete && <span className="text-primary font-medium">✓ Complete</span>}
              </div>
              <Progress value={progressPct} className="h-2" />
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
              onClick={(e) => { e.stopPropagation(); onEnroll(path.id); }}
            >
              Start Learning <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
