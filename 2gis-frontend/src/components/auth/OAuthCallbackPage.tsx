import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export function OAuthCallbackPage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
      setTimeout(() => navigate("/login"), 3000);
      return;
    }

    if (!code || !provider) {
      setStatus("error");
      setErrorMessage("Invalid OAuth callback parameters.");
      setTimeout(() => navigate("/login"), 3000);
      return;
    }

    const redirectUri = `${window.location.origin}${window.location.pathname}`;

    oauthLogin(provider, code, redirectUri)
      .then(() => {
        setStatus("success");
        setTimeout(() => navigate("/"), 1000);
      })
      .catch((err: any) => {
        setStatus("error");
        setErrorMessage(
          err?.response?.data?.message || err?.message || "Failed to authenticate with provider."
        );
        setTimeout(() => navigate("/login"), 3000);
      });
  }, [code, provider, errorParam, oauthLogin, navigate, searchParams]);

  const providerDisplayName = provider ? provider.charAt(0).toUpperCase() + provider.slice(1) : "";

  return (
    <div className="flex min-h-screen items-center justify-center p-6 relative overflow-hidden bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md rounded-3xl border border-[hsl(var(--border))] bg-card p-8 text-center shadow-2xl relative z-10"
      >
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] flex items-center justify-center">
              <Loader2 className="w-7 h-7 text-foreground animate-spin" />
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
