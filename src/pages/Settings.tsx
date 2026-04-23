import { useState } from "react";
import { motion } from "framer-motion";
import { KeyRound, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { toast } from "sonner";

const Settings = () => {
  const { user } = useAuth();

  // Password reset
  const [newPassword, setNewPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const handlePasswordReset = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (!user?.id) {
      toast.error("Please log in again");
      return;
    }
    setChangingPw(true);
    try {
      await api.changePassword({ user_id: user.id, new_password: newPassword });
      toast.success("Password updated successfully");
      setNewPassword("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update password");
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="w-full px-4 sm:px-8 lg:px-12 py-8">
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

        </div>
      </div>
    </div>
  );
};

export default Settings;
