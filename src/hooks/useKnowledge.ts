import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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

    const [{ data: arts }, { data: bmarks }, { data: prog }, { data: views }, { data: likes }, { data: comments }, { data: shares }] = await Promise.all([
      supabase.from("knowledge_articles").select("*").order("created_at", { ascending: false }),
      supabase.from("knowledge_bookmarks").select("article_id").eq("user_id", user.id),
      supabase.from("knowledge_progress").select("article_id, status").eq("user_id", user.id),
      supabase.from("article_views").select("article_id"),
      supabase.from("article_likes").select("article_id"),
      supabase.from("article_comments").select("article_id"),
      supabase.from("article_shares").select("article_id"),
    ]);

    const bookmarkedIds = new Set((bmarks ?? []).map((b: any) => b.article_id));
    const progressMap = new Map((prog ?? []).map((p: any) => [p.article_id, p.status]));

    // Count engagement per article
    const countByArticle = (data: any[] | null) => {
      const map = new Map<string, number>();
      (data ?? []).forEach((r: any) => map.set(r.article_id, (map.get(r.article_id) || 0) + 1));
      return map;
    };

    const viewCounts = countByArticle(views);
    const likeCounts = countByArticle(likes);
    const commentCounts = countByArticle(comments);
    const shareCounts = countByArticle(shares);

    const enriched: ArticleWithMeta[] = (arts ?? []).map((a: any) => ({
      ...a,
      bookmarked: bookmarkedIds.has(a.id),
      progress: (progressMap.get(a.id) as any) || "unread",
      viewCount: viewCounts.get(a.id) || 0,
      likeCount: likeCounts.get(a.id) || 0,
      commentCount: commentCounts.get(a.id) || 0,
      shareCount: shareCounts.get(a.id) || 0,
    }));

    setArticles(enriched);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const toggleBookmark = useCallback(async (articleId: string, current: boolean) => {
    if (!user) return;
    if (current) {
      await supabase.from("knowledge_bookmarks").delete().eq("user_id", user.id).eq("article_id", articleId);
    } else {
      await supabase.from("knowledge_bookmarks").insert({ user_id: user.id, article_id: articleId });
    }
    setArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, bookmarked: !current } : a))
    );
    toast.success(current ? "Bookmark removed" : "Bookmarked!");
  }, [user]);

  const updateProgress = useCallback(async (articleId: string, status: "unread" | "reading" | "completed") => {
    if (!user) return;
    const payload: any = {
      user_id: user.id,
      article_id: articleId,
      status,
      updated_at: new Date().toISOString(),
      ...(status === "completed" ? { completed_at: new Date().toISOString() } : {}),
    };

    const { data: existing } = await supabase
      .from("knowledge_progress")
      .select("id")
      .eq("user_id", user.id)
      .eq("article_id", articleId)
      .maybeSingle();

    if (existing) {
      await supabase.from("knowledge_progress").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("knowledge_progress").insert(payload);
    }

    setArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, progress: status } : a))
    );
  }, [user]);

  const uploadDocument = useCallback(async (file: File, title: string, desc: string, cat: string, diff: string, tags: string[]) => {
    if (!user) return;
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("knowledge-docs").upload(path, file);
    if (uploadError) { toast.error("Upload failed"); return; }

    const { data: { publicUrl } } = supabase.storage.from("knowledge-docs").getPublicUrl(path);

    const { error } = await supabase.from("knowledge_articles").insert({
      user_id: user.id,
      title,
      description: desc,
      category: cat,
      tags,
      difficulty: diff,
      source_type: "uploaded",
      file_url: publicUrl,
      icon: "file-text",
      is_public: false,
      approval_status: "approved",
    } as any);

    if (error) { toast.error("Failed to save article"); return; }
    toast.success("Document uploaded!");
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
