import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { api } from "@/lib/api";

export interface KnowledgeArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  difficulty: string;
  source_type: string;
  file_url: string | null;
  icon: string;
  is_public: boolean;
  approval_status: string;
  user_id: string | null;
  created_at: string;
}

export interface ArticleWithMeta extends KnowledgeArticle {
  bookmarked: boolean;
  progress: "unread" | "reading" | "completed";
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
}

const CATEGORIES = [
  { value: "all", label: "All Topics" },
  { value: "ai-fundamentals", label: "AI Fundamentals" },
  { value: "product", label: "Product" },
  { value: "learning", label: "Learning" },
  { value: "governance", label: "Governance" },
  { value: "development", label: "Development" },
  { value: "data", label: "Data" },
  { value: "uploaded", label: "My Uploads" },
];

const DIFFICULTIES = ["all", "beginner", "intermediate", "advanced"] as const;

export function useKnowledge() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<ArticleWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState<string>("all");

  const fetchArticles = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.getKnowledgeArticles(user.id);
      setArticles((data.articles || []) as ArticleWithMeta[]);
    } catch (e) {
      console.error("Failed to load articles:", e);
      toast.error("Failed to load articles");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const toggleBookmark = useCallback(async (articleId: string, current: boolean) => {
    if (!user) return;
    await api.toggleKnowledgeBookmark({ user_id: user.id, article_id: articleId });
    setArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, bookmarked: !current } : a))
    );
    toast.success(current ? "Bookmark removed" : "Bookmarked!");
  }, [user]);

  const updateProgress = useCallback(async (articleId: string, status: "unread" | "reading" | "completed") => {
    if (!user) return;
    await api.upsertKnowledgeProgress({ user_id: user.id, article_id: articleId, status });

    setArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, progress: status } : a))
    );
  }, [user]);

  const uploadDocument = useCallback(async (file: File, title: string, desc: string, cat: string, diff: string, tags: string[]) => {
    if (!user) return;
    // Phase 2 backend-first migration:
    // we persist metadata to Progress DB; file binary storage migration can be added later.
    await api.createKnowledgeArticle({
      user_id: user.id,
      title,
      description: desc,
      content: `Uploaded file: ${file.name}`,
      category: cat,
      tags,
      difficulty: diff,
      source_type: "uploaded",
      file_url: null,
      icon: "file-text",
      is_public: false,
      approval_status: "approved",
    });
    toast.success("Document metadata saved!");
    await fetchArticles();
  }, [user, fetchArticles]);

  const filtered = articles.filter((a) => {
    if (category === "uploaded") {
      if (a.source_type !== "uploaded") return false;
    } else if (category !== "all" && a.category !== category) return false;
    if (difficulty !== "all" && a.difficulty !== difficulty) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // All public approved articles for the Share page
  const sharedArticles = articles.filter((a) => a.is_public && a.approval_status === "approved");

  // User's own uploads only
  const myUploads = articles.filter((a) => a.source_type === "uploaded" && a.user_id === user?.id);

  return {
    articles: filtered,
    allArticles: articles,
    sharedArticles,
    myUploads,
    loading,
    search, setSearch,
    category, setCategory,
    difficulty, setDifficulty,
    categories: CATEGORIES,
    difficulties: DIFFICULTIES,
    toggleBookmark,
    updateProgress,
    uploadDocument,
    refetch: fetchArticles,
  };
}
