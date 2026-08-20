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
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/components/ui/toaster";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/utils/cn";

const APP_VERSION = "0.1.0";
const NOTIFICATIONS_KEY = "settings_notifications_nearby";
const LOW_LIGHT_KEY = "settings_low_light";

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
        "relative inline-flex h-9 w-[72px] items-center rounded-full border px-1 transition-colors",
        enabled
          ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.12)]"
          : "border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.4)]"
      )}
      aria-label={label}
    >
      <span
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--card))] shadow-sm transition-transform",
          enabled ? "translate-x-[34px]" : "translate-x-0"
        )}
      >
        {enabled ? <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--primary))]" /> : <Moon className="h-3.5 w-3.5 text-muted-foreground" />}
      </span>
    </button>
  );
}

export function SettingsPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [clearConfirm, setClearConfirm] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(NOTIFICATIONS_KEY) === "1";
  });
  const [lowLightEnabled, setLowLightEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(LOW_LIGHT_KEY) === "1";
  });
  const [policyExpanded, setPolicyExpanded] = useState(false);

  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_KEY, notificationsEnabled ? "1" : "0");
  }, [notificationsEnabled]);

  useEffect(() => {
    localStorage.setItem(LOW_LIGHT_KEY, lowLightEnabled ? "1" : "0");
    document.documentElement.classList.toggle("low-light", lowLightEnabled);
  }, [lowLightEnabled]);

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
              label="Режим для слабого освещения"
              description="Снижает яркость поверхностей и делает интерфейс комфортнее в темноте"
              action={<Toggle enabled={lowLightEnabled} onChange={setLowLightEnabled} label="Режим для слабого освещения" />}
            />
          </SettingsSection>
        </motion.div>

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

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <SettingsSection title="Уведомления">
            <SettingsRow
              icon={Bell}
              label="Уведомления о новых местах рядом"
              description="Получайте мягкие подсказки, когда рядом появляются новые интересные места"
              action={<Toggle enabled={notificationsEnabled} onChange={setNotificationsEnabled} label="Уведомления о новых местах рядом" />}
            />
          </SettingsSection>
        </motion.div>

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

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <SettingsSection title="Аккаунт и безопасность">
            <SettingsRow
              icon={ShieldCheck}
              label="Изменить пароль"
              description="Откроет профиль, где можно обновить данные аккаунта"
              action={
                <button
                  onClick={() => navigate("/profile")}
                  className="rounded-full border border-[hsl(var(--border))] px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]"
                >
                  Изменить пароль
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

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <SettingsSection title="Поддержка">
            <SettingsRow
              icon={PencilLine}
              label="Отправить отзыв"
              description="Расскажите, что стоит улучшить в продукте"
              action={
                <button
                  onClick={() => openMail("Отзыв о City Guide AI")}
                  className="rounded-full border border-[hsl(var(--border))] px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]"
                >
                  Открыть почту
                </button>
              }
            />
            <SettingsRow
              icon={Bug}
              label="Сообщить о проблеме"
              description="Опишите баг, и мы быстрее его исправим"
              action={
                <button
                  onClick={() => openMail("Проблема в City Guide AI")}
                  className="rounded-full border border-[hsl(var(--border))] px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]"
                >
                  Открыть почту
                </button>
              }
            />
            <SettingsRow
              icon={FileText}
              label="Политика конфиденциальности"
              description="Кратко о том, как мы работаем с данными"
              action={
                <button
                  onClick={() => setPolicyExpanded((v) => !v)}
                  className="rounded-full border border-[hsl(var(--border))] px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]"
                >
                  {policyExpanded ? "Скрыть" : "Открыть"}
                </button>
              }
            />

            {policyExpanded && (
              <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.35)] px-5 py-5 sm:px-6">
                <div className="rounded-[1.5rem] border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.95)] p-4 text-sm leading-6 text-muted-foreground">
                  <p className="font-semibold text-foreground">Краткая политика</p>
                  <p className="mt-2">
                    Мы используем ваш запрос, язык интерфейса и локальные настройки, чтобы улучшать поиск и
                    рекомендации. История и избранное хранятся локально и могут быть очищены в настройках.
                    Геолокация применяется только для поиска рядом с вами.
                  </p>
                </div>
              </div>
            )}
          </SettingsSection>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <SettingsSection title="О приложении">
            <SettingsRow
              icon={Sparkles}
              label="Версия приложения"
              description="Текущая сборка интерфейса и сервисов"
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
