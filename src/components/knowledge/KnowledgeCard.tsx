import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck, CheckCircle2, Eye, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ArticleWithMeta } from "@/hooks/useKnowledge";
import { getArticleIcon } from "@/lib/knowledge-icons";

const difficultyColors: Record<string, string> = {
  beginner: "bg-green-500/10 text-green-400 border-green-500/20",
  intermediate: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  advanced: "bg-red-500/10 text-red-400 border-red-500/20",
};

const progressIcons: Record<string, React.ReactNode> = {
  unread: null,
  reading: <Eye className="h-3.5 w-3.5 text-accent" />,
  completed: <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />,
};

interface KnowledgeCardProps {
  article: ArticleWithMeta;
  onBookmark: (id: string, current: boolean) => void;
  onClick: (article: ArticleWithMeta) => void;
  index: number;
}

export function KnowledgeCard({ article, onBookmark, onClick, index }: KnowledgeCardProps) {
  const Icon = getArticleIcon(article.icon);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={() => onClick(article)}
      className="group relative rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:bg-card/80 transition-all cursor-pointer"
    >
      {/* Top row: icon + bookmark */}
      <div className="flex items-start justify-between mb-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex items-center gap-1.5">
          {progressIcons[article.progress]}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onBookmark(article.id, article.bookmarked);
            }}
          >
            {article.bookmarked ? (
              <BookmarkCheck className="h-4 w-4 text-primary" />
            ) : (
              <Bookmark className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            )}
          </Button>
        </div>
      </div>

      <h3 className="font-display font-semibold text-foreground mb-1.5 line-clamp-2">{article.title}</h3>
      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{article.description}</p>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className={difficultyColors[article.difficulty]}>
          {article.difficulty}
        </Badge>
        {article.source_type === "uploaded" && (
          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
            uploaded
          </Badge>
        )}
        {article.tags.slice(0, 2).map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>
    </motion.div>
  );
}
