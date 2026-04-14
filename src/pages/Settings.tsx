import { useState } from "react";
import { motion } from "framer-motion";
import { KeyRound, User, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformSelection } from "@/hooks/usePlatformSelection";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Settings = () => {
  const { user } = useAuth();
  const { platforms, selectedPlatformIds, togglePlatform, loaded } = usePlatformSelection();

  // Password reset
  const [newPassword, setNewPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const handlePasswordReset = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPw(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully");
      setNewPassword("");
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-6 lg:px-10 py-8 max-w-7xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground text-lg">Manage your account, preferences and saved content</p>
        </motion.div>

        <div className="space-y-8">
          {/* Profile Information */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Profile Information</h2>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div>
                <Label className="text-muted-foreground text-sm">Email</Label>
                <p className="text-foreground font-medium mt-1">{user?.email ?? "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Account Created</Label>
                <p className="text-foreground font-medium mt-1">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                </p>
              </div>
            </div>
          </motion.section>

          <Separator />

          {/* Reset Password */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Reset Password</h2>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 6 characters)"
                  className="flex-1"
                />
                <Button onClick={handlePasswordReset} disabled={changingPw}>
                  {changingPw ? "Updating…" : "Update Password"}
                </Button>
              </div>
            </div>
          </motion.section>

          <Separator />

          {/* Platform Selection */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="flex items-center gap-2 mb-4">
              <Layers className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Platform Selection</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Select one or more platforms to display in your learning experience.
            </p>
            <div className="rounded-xl border border-border bg-card p-5">
              {!loaded ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-muted-foreground">Loading platforms...</div>
                </div>
              ) : platforms.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-2">No platforms available</p>
                  <p className="text-xs text-muted-foreground">Please run the database migration (database_schema.sql)</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {platforms.map((platform) => {
                      const isSelected = selectedPlatformIds.includes(platform.id);
                      return (
                        <div
                          key={platform.id}
                          onClick={() => togglePlatform(platform.id)}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? "border-primary/30 bg-primary/5"
                              : "border-border hover:border-primary/20"
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => togglePlatform(platform.id)}
                          />
                          <span className="text-sm font-medium text-foreground">{platform.display_name}</span>
                        </div>
                      );
                    })}
                  </div>
                  {selectedPlatformIds.length === 0 && (
                    <p className="text-xs text-destructive mt-3">Please select at least one platform.</p>
                  )}
                </>
              )}
            </div>
          </motion.section>

        </div>
      </div>
    </div>
  );
};

export default Settings;
