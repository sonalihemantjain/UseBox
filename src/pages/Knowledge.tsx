import { useState } from "react";
import { motion } from "framer-motion";
import { Search, BookOpen, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useKnowledge, type ArticleWithMeta } from "@/hooks/useKnowledge";
import { KnowledgeCard } from "@/components/knowledge/KnowledgeCard";
import { ArticleViewer } from "@/components/knowledge/ArticleViewer";
import { UploadDialog } from "@/components/knowledge/UploadDialog";

const Knowledge = () => {
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "bookmarked">("all");
  const {
    articles, loading,
    search, setSearch,
    category, setCategory,
    difficulty, setDifficulty,
    categories, difficulties,
    toggleBookmark, updateProgress,
    uploadDocument, allArticles,
  } = useKnowledge();

  const [selectedArticle, setSelectedArticle] = useState<ArticleWithMeta | null>(null);

  const stats = {
    total: allArticles.length,
    completed: allArticles.filter((a) => a.progress === "completed").length,
    bookmarked: allArticles.filter((a) => a.bookmarked).length,
  };

  const handleArticleClick = (article: ArticleWithMeta) => {
    setSelectedArticle(article);
    if (article.progress === "unread") {
      updateProgress(article.id, "reading");
    }
  };

  const handleProgressChange = (id: string, status: "unread" | "reading" | "completed") => {
    updateProgress(id, status);
    setSelectedArticle((prev) => (prev && prev.id === id ? { ...prev, progress: status } : prev));
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">Knowledge Base</h1>
              <p className="text-muted-foreground text-lg">Explore topics, tutorials, and curated content</p>
            </div>
            <UploadDialog onUpload={uploadDocument} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Total Articles", value: stats.total, color: "text-foreground", filter: "all" as const },
              { label: "Completed", value: stats.completed, color: "text-green-600", filter: "completed" as const },
              { label: "Bookmarked", value: stats.bookmarked, color: "text-primary", filter: "bookmarked" as const },
            ].map((s) => (
              <div
                key={s.label}
                onClick={() => setStatusFilter(s.filter)}
                className={`rounded-xl bg-card border p-4 text-center cursor-pointer transition-all ${
                  statusFilter === s.filter
                    ? "border-primary ring-1 ring-primary/30"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <p className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles, tags, topics…"
              className="pl-10 bg-secondary border-border"
            />
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map((c) => (
              <Button
                key={c.value}
                variant={category === c.value ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory(c.value)}
                className={category === c.value ? "glow-gold" : ""}
              >
                {c.label}
              </Button>
            ))}
          </div>

          {/* Difficulty filters */}
          <div className="flex gap-2">
            {difficulties.map((d) => (
              <Badge
                key={d}
                variant={difficulty === d ? "default" : "outline"}
                className={`cursor-pointer capitalize ${difficulty === d ? "bg-primary text-primary-foreground" : ""}`}
                onClick={() => setDifficulty(d)}
              >
                {d === "all" ? "All Levels" : d}
              </Badge>
            ))}
          </div>
        </motion.div>

        {/* Articles grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : articles.filter((a) => {
            if (statusFilter === "completed") return a.progress === "completed";
            if (statusFilter === "bookmarked") return a.bookmarked;
            return true;
          }).length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-lg text-muted-foreground mb-1">
              {statusFilter === "completed" ? "No completed articles yet" : statusFilter === "bookmarked" ? "No bookmarked articles yet" : "No articles found"}
            </p>
            <p className="text-sm text-muted-foreground">
              {statusFilter !== "all" ? "Click \"Total Articles\" to see all" : "Try adjusting your filters or search query"}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles
              .filter((a) => {
                if (statusFilter === "completed") return a.progress === "completed";
                if (statusFilter === "bookmarked") return a.bookmarked;
                return true;
              })
              .map((article, i) => (
              <KnowledgeCard
                key={article.id}
                article={article}
                index={i}
                onBookmark={toggleBookmark}
                onClick={handleArticleClick}
              />
            ))}
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
