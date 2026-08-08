"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";
import { MapPin, ArrowRight, Lock, Mail } from "lucide-react";
import { motion } from "framer-motion";

import { useLanguage } from "@/context/LanguageContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      await login({ email, password });
      router.push("/");
    } catch (error: any) {
      setErrorMsg(error?.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 relative overflow-hidden bg-background">
      <div className="orb w-[500px] h-[500px] bg-brand-500/10 -top-40 -left-40 animate-pulse-subtle" />
      <div className="orb w-[400px] h-[400px] bg-purple-500/10 -bottom-20 -right-20 animate-pulse-subtle" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md rounded-3xl border border-[hsl(var(--border)/0.8)] bg-card/80 backdrop-blur-2xl p-8 sm:p-10 relative z-10 shadow-2xl shadow-brand-500/5"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center mb-4 shadow-lg shadow-brand-500/25">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 text-foreground">{t.login.welcome}</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            {t.login.sub}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold border border-destructive/20 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="email">
              {t.login.email}
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
                className="w-full rounded-xl border border-[hsl(var(--border))] bg-muted/40 pl-10 pr-4 py-3 text-sm outline-none focus:border-brand-500 focus:bg-card focus:ring-4 focus:ring-brand-500/10 transition-all text-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="password">
              {t.login.password}
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
                className="w-full rounded-xl border border-[hsl(var(--border))] bg-muted/40 pl-10 pr-4 py-3 text-sm outline-none focus:border-brand-500 focus:bg-card focus:ring-4 focus:ring-brand-500/10 transition-all text-foreground"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 py-3.5 px-6 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/35 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 transition-all duration-200"
          >
            {isLoading ? t.login.signingIn : t.login.signIn}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          {t.login.noAccount}{" "}
          <Link href="/register" className="font-bold text-brand-500 hover:underline">
            {t.login.createAccount}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

