const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

async function request<T>(path: string, opts: ApiRequestOptions = {}): Promise<T> {
  const resp = await fetch(`${API_URL}${path}`, {
    method: opts.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`${opts.method || "GET"} ${path} failed (${resp.status}) ${text}`.trim());
  }

  if (resp.status === 204) return undefined as T;
  return (await resp.json()) as T;
}

export type UserSettingsResponse = {
  user_id: string;
  role: string | null;
  functionalArea: string | null;
  industry: string | null;
  selectedModels?: string[] | null;
  selectedPlatforms: Array<{ id: string; name: string; display_name: string }>;
};

export type ApiKnowledgeArticle = Record<string, unknown>;
export type ApiArticleComment = Record<string, unknown>;
export type ApiAnalyticsResponse = Record<string, unknown>;
export type ApiLearningPath = Record<string, unknown>;
export type ApiLearningEnrollment = Record<string, unknown>;
export type ApiRedemption = { id: string; amount: number; status: string; created_at: string };
export type ApiLabStep = {
  id: string;
  step_order: number;
  title: string;
  content: string;
  is_completed?: boolean;
};
export type ApiLabTask = {
  id: string;
  task_order: number;
  title: string;
  description?: string;
  steps?: ApiLabStep[];
};
export type ApiLab = {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  topic?: string;
  difficulty?: string;
  total_steps?: number;
  completed_steps?: number;
  status?: string;
  created_at: string;
  tasks?: ApiLabTask[];
  goal?: string;
  question?: string;
  raw?: string;
  task_states?: Record<string, boolean>;
};

export const api = {
  request,
  getUserSettings: (userId: string, signal?: AbortSignal) =>
    request<UserSettingsResponse>(`/api/user-settings/${userId}`, { signal }),
  updateUserContext: (payload: { user_id: string; role?: string; functionalArea?: string; industry?: string }) =>
    request<{ user_id: string; role: string | null; functionalArea: string | null; industry: string | null }>(
      "/api/user-context",
      { method: "POST", body: payload }
    ),
  updateUserModels: (payload: { user_id: string; selected_models: string[] }) =>
    request<{ user_id: string; selectedModels: string[] }>("/api/user-settings/models", {
      method: "POST",
      body: payload,
    }),
  changePassword: (payload: { user_id: string; new_password: string }) =>
    request<{ status: "success" }>("/api/auth/change-password", {
      method: "POST",
      body: payload,
    }),
  getPlatforms: (signal?: AbortSignal) =>
    request<{ platforms: Array<{ id: string; name: string; display_name: string }> }>("/api/platforms", { signal }),
  updateUserPlatform: (payload: { user_id: string; platform_id: string; is_selected: boolean }) =>
    request<{ success: boolean }>("/api/user-platforms", { method: "POST", body: payload }),
  initializeUserPlatforms: (user_id: string) =>
    request<{ success: boolean; selections: unknown[] }>("/api/user-platforms/initialize", {
      method: "POST",
      body: { user_id },
    }),
  getKnowledgeArticles: (userId: string) =>
    request<{ articles: ApiKnowledgeArticle[] }>(`/api/knowledge/articles?user_id=${encodeURIComponent(userId)}`),
  toggleKnowledgeBookmark: (payload: { user_id: string; article_id: string }) =>
    request<{ bookmarked: boolean }>("/api/knowledge/bookmarks/toggle", { method: "POST", body: payload }),
  upsertKnowledgeProgress: (payload: { user_id: string; article_id: string; status: "unread" | "reading" | "completed" }) =>
    request<Record<string, unknown>>("/api/knowledge/progress", { method: "POST", body: payload }),
  createKnowledgeArticle: (payload: {
    user_id?: string;
    title: string;
    description?: string;
    content?: string;
    category?: string;
    tags?: string[];
    difficulty?: string;
    source_type?: string;
    file_url?: string | null;
    icon?: string;
    is_public?: boolean;
    approval_status?: string;
  }) => request<Record<string, unknown>>("/api/knowledge/articles", { method: "POST", body: payload }),
  getArticle: (articleId: string) => request<Record<string, unknown>>(`/api/articles/${articleId}`),
  getArticleEngagement: (articleId: string, userId?: string) =>
    request<{ liked: boolean; likeCount: number; shareCount: number; comments: ApiArticleComment[] }>(
      `/api/articles/${articleId}/engagement${userId ? `?user_id=${encodeURIComponent(userId)}` : ""}`
    ),
  toggleArticleLike: (articleId: string, user_id: string) =>
    request<{ liked: boolean }>(`/api/articles/${articleId}/like`, { method: "POST", body: { user_id } }),
  createArticleComment: (articleId: string, payload: { user_id: string; content: string }) =>
    request<ApiArticleComment>(`/api/articles/${articleId}/comment`, { method: "POST", body: payload }),
  createArticleShare: (articleId: string, user_id: string) =>
    request<{ status: string }>(`/api/articles/${articleId}/share`, { method: "POST", body: { user_id } }),
  getAnalytics: (userId: string) => request<ApiAnalyticsResponse>(`/api/analytics/${encodeURIComponent(userId)}`),
  getLearningPaths: (user_id: string) =>
    request<{ paths: ApiLearningPath[] }>("/api/learning/paths/query", { method: "POST", body: { user_id } }),
  enrollLearningPath: (payload: { user_id: string; path_id: string }) =>
    request<{ success: boolean }>("/api/learning/enroll", { method: "POST", body: payload }),
  toggleLearningStep: (payload: { user_id: string; path_id: string; step_id: string }) =>
    request<ApiLearningEnrollment>("/api/learning/toggle-step", { method: "POST", body: payload }),
  generateLearningPath: (payload: { user_id: string; goal: string; role: string; experience_level: string }) =>
    request<{ success: boolean; path_id: string }>("/api/learning/generate", { method: "POST", body: payload }),
  deleteLearningPath: (payload: { user_id: string; path_id: string }) =>
    request<{ success: boolean }>("/api/learning/delete", { method: "POST", body: payload }),
  getEarnings: (userId: string) =>
    request<{
      totalViews: number;
      totalCredits: number;
      redeemedCredits: number;
      availableCredits: number;
      articleStats: { id: string; title: string; views: number; likes: number; credits: number }[];
      redemptions: ApiRedemption[];
    }>(`/api/earnings/${encodeURIComponent(userId)}`),
  redeemCredits: (payload: { user_id: string; amount: number }) =>
    request<{ success: boolean; redemption: ApiRedemption }>(
      "/api/earnings/redeem",
      { method: "POST", body: payload }
    ),
  getLabsForUser: (userId: string) => request<ApiLab[]>(`/api/labs/user/${encodeURIComponent(userId)}`),
  generateLab: (payload: { topic: string; difficulty?: string; user_id?: string }) =>
    request<ApiLab>("/api/labs/generate", { method: "POST", body: payload }),
  updateLabProgress: (labId: string, payload: { task_states: Record<string, boolean>; tasks: unknown[] }) =>
    request<{ status: string }>(`/api/labs/${labId}/progress`, { method: "PATCH", body: payload }),
  deleteLab: (labId: string) => request<{ status: string }>(`/api/labs/${labId}`, { method: "DELETE" }),
  getLabById: (labId: string) => request<ApiLab>(`/api/labs/${labId}`),
  getChatFollowups: (payload: { userId?: string; prompt?: string; pickedPlatform?: string; pickedAnswer?: string }) =>
    request<{ questions: string[] }>("/api/chat/followups", { method: "POST", body: payload }),
};

