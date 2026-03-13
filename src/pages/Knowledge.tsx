import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, FileText, Eye, Heart, MessageCircle, Share2, Upload } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useKnowledge, type ArticleWithMeta } from "@/hooks/useKnowledge";
import { ArticleViewer } from "@/components/knowledge/ArticleViewer";

const Knowledge = () => {
  const navigate = useNavigate();
  const { myUploads, loading } = useKnowledge();
  const [selectedArticle, setSelectedArticle] = useState<ArticleWithMeta | null>(null);

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">Share Knowledge</h1>
              <p className="text-muted-foreground text-lg">
                Upload documents to share your expertise. When others learn from your content, you earn credits.
              </p>
            </div>
            <Button onClick={() => navigate("/upload")} className="gap-2">
              <Upload className="h-4 w-4" /> Upload Document
            </Button>
          </div>
        </motion.div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : myUploads.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-lg text-muted-foreground mb-1">No documents shared yet</p>
            <p className="text-sm text-muted-foreground">Upload your first document to start earning from your knowledge</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myUploads.map((article, i) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/article/${article.id}`)}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors cursor-pointer"
              >
                <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-foreground truncate">{article.title}</h3>
                    <Badge variant="outline" className="text-[10px] shrink-0">{article.category}</Badge>
                    <Badge variant="secondary" className="text-[10px] shrink-0">{article.difficulty}</Badge>
                  </div>
                  {article.description && (
                    <p className="text-sm text-muted-foreground truncate">{article.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{article.viewCount}</span>
                  <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{article.likeCount}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{article.commentCount}</span>
                  <span className="flex items-center gap-1"><Share2 className="h-3.5 w-3.5" />{article.shareCount}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <ArticleViewer
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </div>
  );
};

export default Knowledge;
