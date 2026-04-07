import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import SavedChats from "./pages/SavedChats";
import Knowledge from "./pages/Knowledge";
import UploadDocument from "./pages/UploadDocument";
import Earn from "./pages/Earn";
import Lab from "./pages/Lab";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ArticleEngagement from "./pages/ArticleEngagement";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isReady } = useAuth();
  if (!isReady) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/saved-chats" element={<ProtectedRoute><SavedChats /></ProtectedRoute>} />
          <Route path="/knowledge" element={<ProtectedRoute><Knowledge /></ProtectedRoute>} />
          <Route path="/upload" element={<ProtectedRoute><UploadDocument /></ProtectedRoute>} />
          <Route path="/earn" element={<ProtectedRoute><Earn /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/article/:id" element={<ArticleEngagement />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
