import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { authService } from "@/services/authService";
import { MapPin, ArrowRight, Lock, Mail, User } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const GithubIcon = () => (
  <svg className="w-5 h-5 shrink-0 fill-current text-foreground" viewBox="0 0 24 24">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t } = useLanguage();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      await register({ email, password, full_name: fullName });
      navigate("/");
    } catch (error: any) {
      setErrorMsg(error?.response?.data?.message || "Could not create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: "google" | "github") => {
    try {
      setIsLoading(true);
      setErrorMsg("");
      const redirectUri = `${window.location.origin}/callback/${provider}`;
      const { url } = await authService.getOAuthUrl(provider, redirectUri);
      window.location.href = url;
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          `OAuth configuration missing or service error for ${provider}.`
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 relative overflow-hidden bg-background">
      <div className="orb w-[500px] h-[500px] bg-[hsl(var(--primary)/0.08)] -top-40 -left-40 animate-pulse-subtle" />
      <div className="orb w-[400px] h-[400px] bg-[hsl(var(--accent)/0.08)] -bottom-20 -right-20 animate-pulse-subtle" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md rounded-3xl border border-[hsl(var(--border))] bg-card/90 backdrop-blur-2xl p-8 sm:p-10 relative z-10 shadow-2xl"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center mb-4 shadow-lg">
            <MapPin className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 text-foreground">
            {t.register.title}
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">{t.register.sub}</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold border border-destructive/20 text-center">
            {errorMsg}
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleOAuthLogin("google")}
            className="flex items-center justify-center gap-2.5 rounded-xl border border-[hsl(var(--border))] bg-muted/30 hover:bg-muted/70 active:scale-[0.98] py-3 px-4 text-xs font-semibold text-foreground transition-all duration-200 shadow-sm"
          >
            <GoogleIcon />
            <span>Google</span>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleOAuthLogin("github")}
            className="flex items-center justify-center gap-2.5 rounded-xl border border-[hsl(var(--border))] bg-muted/30 hover:bg-muted/70 active:scale-[0.98] py-3 px-4 text-xs font-semibold text-foreground transition-all duration-200 shadow-sm"
          >
            <GithubIcon />
            <span>GitHub</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-6">
          <div className="border-t border-[hsl(var(--border))] w-full" />
          <span className="bg-card px-3 text-[10px] uppercase font-bold tracking-wider text-muted-foreground shrink-0 relative z-10">
            {t.login.orEmail || "Or with email"}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-sans">
          <div className="space-y-1.5">
            <label
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              htmlFor="fullName"
            >
              {t.register.fullName}
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 w-4 h-4 text-muted-foreground" />
              <input
                id="fullName"
                type="text"
                required
                placeholder="Иван Иванов"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-[hsl(var(--border))] bg-muted/40 pl-10 pr-4 py-3 text-sm outline-none focus:border-[hsl(var(--primary))] focus:bg-card focus:ring-4 focus:ring-[hsl(var(--primary)/0.1)] transition-all text-foreground"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              htmlFor="email"
            >
              {t.register.email}
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-muted-foreground" />
              <input
                id="email"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[hsl(var(--border))] bg-muted/40 pl-10 pr-4 py-3 text-sm outline-none focus:border-[hsl(var(--primary))] focus:bg-card focus:ring-4 focus:ring-[hsl(var(--primary)/0.1)] transition-all text-foreground"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              htmlFor="password"
            >
              {t.register.password}
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-muted-foreground" />
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[hsl(var(--border))] bg-muted/40 pl-10 pr-4 py-3 text-sm outline-none focus:border-[hsl(var(--primary))] focus:bg-card focus:ring-4 focus:ring-[hsl(var(--primary)/0.1)] transition-all text-foreground"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] py-3.5 px-6 text-sm font-semibold shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 transition-all duration-200"
          >
            {isLoading ? t.register.creatingAccount : t.register.signUp}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          {t.register.hasAccount}{" "}
          <Link to="/login" className="font-bold text-[hsl(var(--primary))] hover:underline">
            {t.register.signIn}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
