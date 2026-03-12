import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, FileText, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useKnowledge, type ArticleWithMeta } from "@/hooks/useKnowledge";
import { UploadDialog } from "@/components/knowledge/UploadDialog";
import { ArticleViewer } from "@/components/knowledge/ArticleViewer";

const statusBadge: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  approved: { label: "Approved", className: "bg-green-500/10 text-green-600 border-green-500/20", icon: <CheckCircle2 className="h-3 w-3" /> },
  pending: { label: "Pending Review", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: <Clock className="h-3 w-3" /> },
  rejected: { label: "Rejected", className: "bg-red-500/10 text-red-600 border-red-500/20", icon: null },
};

const Knowledge = () => {
  const { user } = useAuth();
  const { myUploads, loading, uploadDocument, updateProgress } = useKnowledge();
  const [selectedArticle, setSelectedArticle] = useState<ArticleWithMeta | null>(null);

  const handleArticleClick = (article: ArticleWithMeta) => {
    setSelectedArticle(article);
  };

  const handleProgressChange = (id: string, status: "unread" | "reading" | "completed") => {
    updateProgress(id, status);
    setSelectedArticle((prev) => (prev && prev.id === id ? { ...prev, progress: status } : prev));
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">Share Knowledge</h1>
              <p className="text-muted-foreground text-lg">Upload documents to share your expertise</p>
            </div>
            <UploadDialog onUpload={uploadDocument} />
          </div>
        </motion.div>

        {/* User's uploads */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : myUploads.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-lg text-muted-foreground mb-1">No documents shared yet</p>
            <p className="text-sm text-muted-foreground">Upload your first document to start sharing knowledge</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myUploads.map((article, i) => {
              const status = statusBadge[(article as any).approval_status ?? "approved"] ?? statusBadge.approved;
              return (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleArticleClick(article)}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors cursor-pointer"
                >
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{article.title}</h3>
                    {article.description && (
                      <p className="text-sm text-muted-foreground truncate">{article.description}</p>
                    )}
                  </div>
                  <Badge variant="outline" className={`shrink-0 gap-1 ${status.className}`}>
                    {status.icon}
                    {status.label}
                  </Badge>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Article viewer modal */}
      <ArticleViewer
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
        onProgressChange={handleProgressChange}
      />
    </div>
  );
};

export default Knowledge;
