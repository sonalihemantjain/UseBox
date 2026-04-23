import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, Eye, EyeOff, KeyRound } from "lucide-react";
import useBoxLogo from "@/assets/usebox-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGoogleLogin } from "@react-oauth/google";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const STATIC_OTP = "12345";

type AuthStep = "credentials" | "otp";
type PendingAction = "email" | "google";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP gate
  const [step, setStep] = useState<AuthStep>("credentials");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [pendingGoogleToken, setPendingGoogleToken] = useState<string | null>(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  const getErrorMessage = (err: unknown) => {
    if (err instanceof Error) return err.message;
    return "Something went wrong";
  };

  // ── Step 1: intercept email submit → go to OTP step ─────────────────────────
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setPendingAction("email");
    setOtp("");
    setOtpError("");
    setStep("otp");
  };

  // ── Step 1: intercept Google login → go to OTP step ─────────────────────────
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setPendingGoogleToken(tokenResponse.access_token);
      setPendingAction("google");
      setOtp("");
      setOtpError("");
      setStep("otp");
    },
    onError: () => {
      toast.error("Google login failed");
    },
  });

  // ── Step 2: validate OTP then execute the real auth call ─────────────────────
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.trim() !== STATIC_OTP) {
      setOtpError("Incorrect access code. Please try again.");
      return;
    }

    setOtpError("");
    setLoading(true);

    try {
      if (pendingAction === "email") {
        await doEmailAuth();
      } else if (pendingAction === "google" && pendingGoogleToken) {
        await doGoogleAuth(pendingGoogleToken);
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || "Something went wrong. Please try again.");
      setStep("credentials");
    } finally {
      setLoading(false);
    }
  };

  const doEmailAuth = async () => {
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.detail || data.error || "Authentication failed");
      setStep("credentials");
      return;
    }

    localStorage.setItem("authToken", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    toast.success(isLogin ? "Successfully logged in!" : "Successfully registered!");
    navigate(redirectTo || "/chat");
  };

  const doGoogleAuth = async (token: string) => {
    const response = await fetch(`${API_URL}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Google login failed (${response.status})${text ? ": " + text : ""}`);
    }

    const data = await response.json();
    localStorage.setItem("authToken", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    toast.success("Successfully logged in with Google!");
    navigate(redirectTo || "/chat");
  };

  const handleBack = () => {
    setStep("credentials");
    setOtp("");
    setOtpError("");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-learn/5 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-earn/5 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <a href="/" className="flex items-center justify-center gap-2.5 mb-3">
          <img src={useBoxLogo} alt="Usebox" className="h-8 w-8" />
          <span className="font-display text-2xl font-bold tracking-tight">
            Use<span className="text-gradient-gold">box</span>
          </span>
        </a>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex items-center justify-center gap-2 mb-4"
        >
          <span className="text-lg font-display font-semibold text-gradient-learn">Learn.</span>
          <span className="text-lg font-display font-semibold text-gradient-share">Share.</span>
          <span className="text-lg font-display font-semibold text-gradient-gold">Earn.</span>
        </motion.div>

        <div className="bg-glass rounded-2xl px-8 py-5 border border-white/10 backdrop-blur-xl">
          <AnimatePresence mode="wait">

            {/* ── Step 1: Credentials ── */}
            {step === "credentials" && (
              <motion.div
                key="credentials"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="font-display text-2xl font-bold text-center mb-2">
                  {isLogin ? "Welcome back" : "Create account"}
                </h2>
                <p className="text-muted-foreground text-center text-sm mb-8">
                  {isLogin ? "Sign in to continue learning" : "Start your learning journey"}
                </p>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm text-muted-foreground">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 bg-secondary/50 border-border focus:ring-1 ring-learn/30"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm text-muted-foreground">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-11 bg-secondary/50 border-border focus:ring-1 ring-learn/30"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-11 glow-gold gap-2" disabled={loading}>
                    {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 transition-all hover:bg-learn/5 border-border group relative overflow-hidden text-foreground hover:text-foreground"
                  onClick={() => handleGoogleLogin()}
                  disabled={loading}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-learn/5 via-share/5 to-earn/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center justify-center">
                    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                      <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
                    </svg>
                    <span className="font-medium">Continue with Google</span>
                  </div>
                </Button>

                <p className="text-center text-sm text-muted-foreground mt-6">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-primary hover:underline font-medium"
                  >
                    {isLogin ? "Sign up" : "Sign in"}
                  </button>
                </p>
              </motion.div>
            )}

            {/* ── Step 2: OTP ── */}
            {step === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex flex-col items-center mb-6">
                  <div className="h-14 w-14 rounded-full bg-learn/10 flex items-center justify-center mb-4">
                    <KeyRound className="h-6 w-6 text-learn" />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-center">Enter Access Code</h2>
                  <p className="text-muted-foreground text-center text-sm mt-2">
                    Enter the access code to continue
                  </p>
                </div>

                <form onSubmit={handleOtpSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-sm text-muted-foreground">Access Code</Label>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      placeholder="_ _ _ _ _"
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value);
                        setOtpError("");
                      }}
                      className="h-12 text-center text-xl tracking-[0.4em] bg-secondary/50 border-border focus:ring-1 ring-learn/30 font-mono"
                      maxLength={10}
                      autoFocus
                      required
                    />
                    {otpError && (
                      <p className="text-destructive text-sm text-center">{otpError}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full h-11 glow-gold gap-2" disabled={loading}>
                    {loading ? "Verifying..." : "Verify & Continue"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full h-9 text-muted-foreground"
                    onClick={handleBack}
                    disabled={loading}
                  >
                    ← Back
                  </Button>
                </form>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
