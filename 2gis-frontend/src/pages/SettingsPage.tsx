import { useEffect, useState, type ElementType, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bell,
  Bug,
  FileText,
  Globe,
  LogOut,
  Moon,
  PencilLine,
  Settings,
  Sparkles,
  ShieldCheck,
  Trash2,
  Wand2,
} from "lucide-react";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";
import { useAuth } from "@/features/auth/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/components/ui/toaster";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/utils/cn";

const APP_VERSION = "0.1.0";
const NOTIFICATIONS_KEY = "settings_notifications_nearby";

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.9)] shadow-[0_18px_50px_-38px_hsl(0_0%_0%/0.45)] backdrop-blur-xl">
      <div className="border-b border-[hsl(var(--border))] px-5 py-4 sm:px-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">{title}</h2>
      </div>
      <div className="divide-y divide-[hsl(var(--border))]">{children}</div>
    </section>
  );
}

function SettingsRow({
  icon: Icon,
  label,
  description,
  action,
}: {
  icon: ElementType;
  label: string;
  description?: string;
  action: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[hsl(var(--secondary)/0.45)] sm:px-6">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold tracking-tight text-foreground">{label}</p>
        {description && <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

function Toggle({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative inline-flex h-8 w-14 items-center rounded-full border p-0.5 transition-all duration-200 cursor-pointer shadow-inner",
        enabled
          ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]"
          : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))]"
      )}
      aria-label={label}
    >
      <span
        className={cn(
          "inline-flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--card))] shadow-sm transition-transform duration-200",
          enabled ? "translate-x-6 text-[hsl(var(--primary))]" : "translate-x-0 text-muted-foreground"
        )}
      >
        {enabled ? <Sparkles className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
      </span>
    </button>
  );
}

export function SettingsPage() {
  const { logout } = useAuth();
  const { lowLight, setLowLight } = useTheme();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [clearConfirm, setClearConfirm] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(NOTIFICATIONS_KEY) === "1";
  });
  const [policyExpanded, setPolicyExpanded] = useState(false);

  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_KEY, notificationsEnabled ? "1" : "0");
  }, [notificationsEnabled]);

  async function handleLogout() {
    await logout();
    toast.info(t.settings.signedOut);
    navigate("/login", { replace: true });
  }

  function clearCache() {
    queryClient.clear();
    toast.success(t.settings.cacheCleared);
    setClearConfirm(false);
  }

  function openMail(subject: string) {
    const mailto = `mailto:support@cityguide.ai?subject=${encodeURIComponent(subject)}`;
    window.location.href = mailto;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] shadow-[0_16px_35px_-24px_hsl(0_0%_0%/0.45)]">
            <Settings className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{t.settings.title}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{t.settings.subtitle}</p>
          </div>
        </div>
      </motion.div>

      <div className="space-y-6">
        {/* Appearance Section */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <SettingsSection title={t.settings.appearance}>
            <SettingsRow
              icon={Moon}
              label={t.settings.visualTheme}
              description={t.settings.visualThemeSub}
              action={<ThemeSwitcher />}
            />
            <SettingsRow
              icon={Wand2}
              label={t.settings.lowLight}
              description={t.settings.lowLightSub}
              action={<Toggle enabled={lowLight} onChange={setLowLight} label={t.settings.lowLight} />}
            />
          </SettingsSection>
        </motion.div>

        {/* Localization Section with ru, en, kz */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <SettingsSection title={t.settings.localization}>
            <SettingsRow
              icon={Globe}
              label={t.settings.language}
              description={t.settings.languageSub}
              action={
                <div className="inline-flex items-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.35)] p-1 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setLanguage("ru")}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                      language === "ru"
                        ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Русский
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                      language === "en"
                        ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("kz")}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                      language === "kz"
                        ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Қазақша
                  </button>
                </div>
              }
            />
          </SettingsSection>
        </motion.div>

        {/* Notifications Section */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <SettingsSection title={t.settings.notifications}>
            <SettingsRow
              icon={Bell}
              label={t.settings.notificationsNearby}
              description={t.settings.notificationsNearbySub}
              action={<Toggle enabled={notificationsEnabled} onChange={setNotificationsEnabled} label={t.settings.notificationsNearby} />}
            />
          </SettingsSection>
        </motion.div>

        {/* Data & Storage Section */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <SettingsSection title={t.settings.dataStorage}>
            <SettingsRow
              icon={Trash2}
              label={t.settings.clearCache}
              description={t.settings.clearCacheSub}
              action={
                clearConfirm ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setClearConfirm(false)}
                      className="rounded-full border border-[hsl(var(--border))] px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {t.settings.cancel}
                    </button>
                    <button
                      onClick={clearCache}
                      className="rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/15"
                    >
                      {t.settings.confirm}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setClearConfirm(true)}
                    className="rounded-full border border-[hsl(var(--border))] px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-[hsl(var(--primary))] hover:text-foreground"
                  >
                    {t.settings.clearCache}
                  </button>
                )
              }
            />
          </SettingsSection>
        </motion.div>

        {/* Account & Security Section */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <SettingsSection title={t.settings.account}>
            <SettingsRow
              icon={ShieldCheck}
              label={t.settings.changePassword}
              description={t.settings.changePasswordSub}
              action={
                <button
                  onClick={() => navigate("/profile")}
                  className="rounded-full border border-[hsl(var(--border))] px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]"
                >
                  {t.settings.changePassword}
                </button>
              }
            />
            <SettingsRow
              icon={LogOut}
              label={t.settings.signOut}
              description={t.settings.signOutSub}
              action={
                <button
                  onClick={handleLogout}
                  className="rounded-full border border-destructive/20 bg-destructive/10 px-4 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/15"
                >
                  {t.settings.signOut}
                </button>
              }
            />
          </SettingsSection>
        </motion.div>

        {/* Support Section */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <SettingsSection title={t.settings.support}>
            <SettingsRow
              icon={PencilLine}
              label={t.settings.sendFeedback}
              description={t.settings.sendFeedbackSub}
              action={
                <button
                  onClick={() => openMail("Feedback - City Guide AI")}
                  className="rounded-full border border-[hsl(var(--border))] px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]"
                >
                  {t.settings.openEmail}
                </button>
              }
            />
            <SettingsRow
              icon={Bug}
              label={t.settings.reportBug}
              description={t.settings.reportBugSub}
              action={
                <button
                  onClick={() => openMail("Bug Report - City Guide AI")}
                  className="rounded-full border border-[hsl(var(--border))] px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]"
                >
                  {t.settings.openEmail}
                </button>
              }
            />
            <SettingsRow
              icon={FileText}
              label={t.settings.privacyPolicy}
              description={t.settings.privacyPolicySub}
              action={
                <button
                  onClick={() => setPolicyExpanded((v) => !v)}
                  className="rounded-full border border-[hsl(var(--border))] px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]"
                >
                  {policyExpanded ? t.settings.hide : t.settings.open}
                </button>
              }
            />

            {policyExpanded && (
              <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.35)] px-5 py-5 sm:px-6">
                <div className="rounded-[1.5rem] border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.95)] p-4 text-sm leading-6 text-muted-foreground">
                  <p className="font-semibold text-foreground">{t.settings.policyBriefTitle}</p>
                  <p className="mt-2">
                    {t.settings.policyBriefText}
                  </p>
                </div>
              </div>
            )}
          </SettingsSection>
        </motion.div>

        {/* About App Section */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <SettingsSection title={t.settings.aboutApp}>
            <SettingsRow
              icon={Sparkles}
              label={t.settings.appVersion}
              description={t.settings.appVersionSub}
              action={
                <span className="inline-flex items-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.45)] px-3 py-1.5 text-xs font-semibold text-foreground">
                  v{APP_VERSION}
                </span>
              }
            />
          </SettingsSection>
        </motion.div>
      </div>
    </div>
  );
}
