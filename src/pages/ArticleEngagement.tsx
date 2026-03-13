import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, Send, ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Article {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  difficulty: string;
  file_url: string | null;
  icon: string;
  user_id: string | null;
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
}

const ArticleEngagement = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isReady } = useAuth();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [shareCount, setShareCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const fetchArticle = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("knowledge_articles")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      toast.error("Article not found");
      setLoading(false);
      return;
    }

    setArticle(data as Article);

    // Fetch engagement data
    const [likesRes, commentsRes, sharesRes] = await Promise.all([
      supabase.from("article_likes").select("id, user_id").eq("article_id", id),
      supabase.from("article_comments").select("*").eq("article_id", id).order("created_at", { ascending: true }),
      supabase.from("article_shares").select("id").eq("article_id", id),
    ]);

    setLikeCount((likesRes.data ?? []).length);
    setComments((commentsRes.data ?? []) as Comment[]);
    setShareCount((sharesRes.data ?? []).length);

    if (user) {
      setLiked((likesRes.data ?? []).some((l: any) => l.user_id === user.id));
    }

    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    if (isReady) {
      fetchArticle();
    }
  }, [isReady, fetchArticle]);

  const requireAuth = () => {
    if (!user) {
      const returnUrl = `/article/${id}`;
      navigate(`/auth?redirect=${encodeURIComponent(returnUrl)}`);
      return true;
    }
    return false;
  };

  const handleLike = async () => {
    if (!id || requireAuth()) return;
    setSubmitting(true);

    if (liked) {
      await supabase.from("article_likes").delete().eq("user_id", user.id).eq("article_id", id);
      setLiked(false);
      setLikeCount((c) => c - 1);
      toast.success("Like removed");
    } else {
      await supabase.from("article_likes").insert({ user_id: user.id, article_id: id });
      setLiked(true);
      setLikeCount((c) => c + 1);
      toast.success("Liked! Author earned 1 credit 🎉");
    }
    setSubmitting(false);
  };

  const handleComment = async () => {
    if (!user || !id || !commentText.trim()) return;
    setSubmitting(true);

    const { data, error } = await supabase
      .from("article_comments")
      .insert({ user_id: user.id, article_id: id, content: commentText.trim() })
      .select()
      .single();

    if (error) {
      toast.error("Failed to post comment");
    } else {
      setComments((prev) => [...prev, data as Comment]);
      setCommentText("");
      toast.success("Comment posted!");
    }
    setSubmitting(false);
  };

  const handleShare = async () => {
    if (!user || !id) return;

    await supabase.from("article_shares").insert({ user_id: user.id, article_id: id });
    setShareCount((c) => c + 1);

    // Copy link to clipboard
    const url = `${window.location.origin}/article/${id}`;
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  if (loading || !isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Article not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-lg font-bold truncate text-foreground">{article.title}</h1>
            <p className="text-xs text-muted-foreground">UseBox Knowledge</p>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          {/* Meta */}
          <div className="flex items-center gap-2 mb-6">
            <Badge variant="outline">{article.category}</Badge>
            <Badge variant="secondary">{article.difficulty}</Badge>
            {article.tags.map((t) => (
              <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
            ))}
          </div>

          <p className="text-muted-foreground mb-6">{article.description}</p>

          {article.file_url && (
            <a
              href={article.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-lg bg-secondary text-sm text-foreground hover:bg-secondary/80 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Open uploaded document
            </a>
          )}

          {/* Content */}
          <div className="prose prose-sm max-w-none mb-8 [&>*:first-child]:mt-0 [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-secondary [&_pre]:rounded-lg [&_pre]:p-3 [&_a]:text-primary [&_li]:text-muted-foreground [&_p]:text-card-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </div>

          {/* Engagement Bar */}
          <div className="border-t border-b border-border py-4 mb-8">
            <div className="flex items-center gap-6">
              <button
                onClick={handleLike}
                disabled={submitting}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  liked ? "text-red-500" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
                {likeCount} {likeCount === 1 ? "Like" : "Likes"}
              </button>

              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageCircle className="h-5 w-5" />
                {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
              </span>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Share2 className="h-5 w-5" />
                {shareCount} {shareCount === 1 ? "Share" : "Shares"}
              </button>
            </div>
          </div>

          {/* Comments Section */}
          <div>
            <h3 className="font-display text-lg font-bold mb-4 text-foreground">Comments</h3>

            {/* Comment Input */}
            <div className="flex items-start gap-3 mb-6">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                {user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  rows={2}
                  className="w-full bg-secondary rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none border border-border focus:border-primary/40 transition-colors"
                />
                <div className="flex justify-end mt-2">
                  <Button
                    size="sm"
                    onClick={handleComment}
                    disabled={!commentText.trim() || submitting}
                  >
                    <Send className="h-4 w-4 mr-1.5" />
                    Post
                  </Button>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-accent/30 flex items-center justify-center text-xs font-bold text-accent-foreground shrink-0">
                    {comment.user_id.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 bg-card border border-border rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-card-foreground">{comment.content}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No comments yet. Be the first!</p>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default ArticleEngagement;
