"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function OAuthCallbackPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { oauthLogin } = useAuth();
  const { t } = useLanguage();

  const provider = (params?.provider as string) || "";
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    if (errorParam) {
      setStatus("error");
      setErrorMessage(searchParams.get("error_description") || "OAuth authorization was cancelled or failed.");
      setTimeout(() => router.push("/login"), 3000);
      return;
    }

    if (!code || !provider) {
      setStatus("error");
      setErrorMessage("Invalid OAuth callback parameters.");
      setTimeout(() => router.push("/login"), 3000);
      return;
    }

    const redirectUri = `${window.location.origin}${window.location.pathname}`;


    oauthLogin(provider, code, redirectUri)
      .then(() => {
        setStatus("success");
        setTimeout(() => router.push("/"), 1000);
      })
      .catch((err: any) => {
        setStatus("error");
        setErrorMessage(
          err?.response?.data?.message || err?.message || "Failed to authenticate with provider."
        );
        setTimeout(() => router.push("/login"), 3000);
      });
  }, [code, provider, errorParam, oauthLogin, router, searchParams]);

  const providerDisplayName = provider ? provider.charAt(0).toUpperCase() + provider.slice(1) : "";

  return (
    <div className="flex min-h-screen items-center justify-center p-6 relative overflow-hidden bg-background">
      <div className="orb w-[500px] h-[500px] bg-brand-500/10 -top-40 -left-40 animate-pulse-subtle" />
      <div className="orb w-[400px] h-[400px] bg-purple-500/10 -bottom-20 -right-20 animate-pulse-subtle" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md rounded-3xl border border-[hsl(var(--border)/0.8)] bg-card/80 backdrop-blur-2xl p-8 text-center shadow-2xl relative z-10"
      >
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
              <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-foreground">
              {t.login?.authenticating || "Authenticating..."}
            </h2>
            <p className="text-sm text-muted-foreground">
              Connecting with {providerDisplayName}...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Authenticated!</h2>
            <p className="text-sm text-muted-foreground">Redirecting to home page...</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Authentication Failed</h2>
            <p className="text-xs text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20 max-w-xs">
              {errorMessage}
            </p>
            <p className="text-xs text-muted-foreground pt-2">Redirecting to login page...</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
