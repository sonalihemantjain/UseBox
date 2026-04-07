import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { FlaskConical, Trash2, Clock } from "lucide-react";
import type { Lab } from "@/hooks/useLabs";

interface Props {
  lab: Lab;
  index: number;
  onSelect: (lab: Lab) => void;
  onDelete: (labId: string) => void;
}

const difficultyColors: Record<string, string> = {
  beginner: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  intermediate: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  advanced: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

export function LabCard({ lab, index, onSelect, onDelete }: Props) {
  const progressPct = lab.total_steps > 0 ? Math.round((lab.completed_steps / lab.total_steps) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="group rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
      onClick={() => onSelect(lab)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <FlaskConical className="h-5 w-5" />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={difficultyColors[lab.difficulty] || ""}>
            {lab.difficulty}
          </Badge>
          {lab.status === "completed" && (
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Done</Badge>
          )}
        </div>
      </div>

      <h3 className="font-semibold text-foreground mb-1 line-clamp-2">{lab.title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{lab.description}</p>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{lab.completed_steps}/{lab.total_steps} steps</span>
          <span>{progressPct}%</span>
        </div>
        <Progress value={progressPct} className="h-1.5" />
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(lab.created_at).toLocaleDateString()}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10"
          onClick={(e) => { e.stopPropagation(); onDelete(lab.id); }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}
