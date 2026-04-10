import { useAuth } from "@/hooks/useAuth";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

export function DebugAuthStatus() {
  const { user, isReady } = useAuth();

  // Only show in development
  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-card border border-border rounded-lg p-3 shadow-lg max-w-xs">
      <div className="text-xs font-mono space-y-1">
        <div className="font-semibold text-foreground mb-2 flex items-center gap-2">
          🔐 Auth Status
        </div>
        
        <div className="flex items-center gap-2">
          {!isReady ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin text-yellow-500" />
              <span className="text-muted-foreground">Loading...</span>
            </>
          ) : user?.id ? (
            <>
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span className="text-green-600">Logged In</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-3 w-3 text-red-500" />
              <span className="text-red-600">Not Logged In</span>
            </>
          )}
        </div>

        {user?.id && (
          <div className="mt-2 pt-2 border-t border-border">
            <div className="text-muted-foreground">User ID:</div>
            <div className="text-foreground break-all text-[10px]">
              {user.id}
            </div>
          </div>
        )}

        {user?.email && (
          <div className="text-muted-foreground mt-1">
            Email: <span className="text-foreground">{user.email}</span>
          </div>
        )}
      </div>
    </div>
  );
}
