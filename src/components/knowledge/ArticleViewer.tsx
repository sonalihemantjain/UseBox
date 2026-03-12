import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, Eye, BookOpen, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import type { ArticleWithMeta } from "@/hooks/useKnowledge";
import { getArticleIcon } from "@/lib/knowledge-icons";

interface ArticleViewerProps {
  article: ArticleWithMeta | null;
  onClose: () => void;
}

export function ArticleViewer({ article, onClose, onProgressChange }: ArticleViewerProps) {
  if (!article) return null;

  const Icon = getArticleIcon(article.icon);

  return (
    <AnimatePresence>
      <motion.div
        key={article.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex justify-center overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          className="relative w-full max-w-3xl mx-4 my-8 bg-card border border-border rounded-2xl shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-border">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-foreground mb-1">{article.title}</h2>
                <p className="text-sm text-muted-foreground">{article.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{article.difficulty}</Badge>
                  {article.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                  ))}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6">
            {article.file_url && (
              <a
                href={article.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-lg bg-secondary text-sm text-foreground hover:bg-secondary/80 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Open uploaded document
              </a>
            )}
            <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-secondary [&_pre]:rounded-lg [&_pre]:p-3 [&_a]:text-primary [&_li]:text-muted-foreground [&_p]:text-card-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground">
              <ReactMarkdown>{article.content}</ReactMarkdown>
            </div>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
