"use client";

import { motion } from "framer-motion";
import { Settings, Moon, Trash2, LogOut, ChevronRight, Bell, Globe } from "lucide-react";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";
import { useAuth } from "@/features/auth/AuthContext";
import { useRouter } from "next/navigation";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/components/ui/toaster";
import { useState } from "react";

import { cn } from "@/utils/cn";

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-[hsl(var(--border))] bg-card/70 backdrop-blur-sm overflow-hidden shadow-sm">
      <div className="px-6 py-3.5 border-b border-[hsl(var(--border))] bg-muted/40">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h2>
      </div>
      <div className="divide-y divide-[hsl(var(--border))]">{children}</div>
    </div>
  );
}

function SettingsRow({ icon: Icon, label, description, action }: {
  icon: React.ElementType;
  label: string;
  description?: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 px-6 py-4.5 hover:bg-muted/20 transition-colors">
      <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export default function SettingsPage() {
  const { logout } = useAuth();
  const router = useRouter();
  const [clearConfirm, setClearConfirm] = useState(false);

  async function handleLogout() {
    await logout();
    toast.info("Вы вышли из системы");
    router.replace("/login");
  }

  function clearCache() {
    queryClient.clear();
    toast.success("Кэш очищен");
    setClearConfirm(false);
  }

  const [language, setLanguage] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("app_language") || "ru";
    }
    return "ru";
  });

  function handleLanguageChange(newLang: string) {
    setLanguage(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("app_language", newLang);
    }
    toast.success(
      newLang === "ru" ? "Язык интерфейса: Русский" : "Interface language: English"
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 relative">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Настройки</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Персонализация внешнего вида и локальное хранилище</p>
          </div>
        </div>
      </motion.div>

      <div className="space-y-6">
        {/* Appearance */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <SettingsSection title="Внешний вид">
            <SettingsRow
              icon={Moon}
              label="Визуальная тема"
              description="Переключение между светлой и темной темами"
              action={<ThemeSwitcher />}
            />
          </SettingsSection>
        </motion.div>

        {/* Preferences */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <SettingsSection title="Локализация">
            <SettingsRow
              icon={Globe}
              label="Язык интерфейса"
              description="Основной язык приложения и поиска ИИ"
              action={
                <div className="flex items-center p-1 rounded-2xl bg-muted/80 border border-[hsl(var(--border))] shadow-inner">
                  <button
                    type="button"
                    onClick={() => handleLanguageChange("ru")}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200",
                      language === "ru"
                        ? "bg-card text-brand-500 shadow-md border border-[hsl(var(--border))]"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Русский
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLanguageChange("en")}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200",
                      language === "en"
                        ? "bg-card text-brand-500 shadow-md border border-[hsl(var(--border))]"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    English
                  </button>
                </div>
              }
            />
          </SettingsSection>
        </motion.div>

        {/* Data */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <SettingsSection title="Данные и хранилище">
            <SettingsRow
              icon={Trash2}
              label="Очистить локальный кэш"
              description="Сбрасывает сохраненные данные запросов и карточек мест"
              action={
                clearConfirm ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setClearConfirm(false)} className="text-xs text-muted-foreground px-2 py-1">Отмена</button>
                    <button onClick={clearCache} className="text-xs font-bold text-destructive bg-destructive/10 px-3 py-1.5 rounded-xl border border-destructive/20">Подтвердить</button>
                  </div>
                ) : (
                  <button onClick={() => setClearConfirm(true)} className="text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-xl transition-all">
                    Очистить кэш
                  </button>
                )
              }
            />
          </SettingsSection>
        </motion.div>

        {/* Account */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <SettingsSection title="Аккаунт">
            <SettingsRow
              icon={LogOut}
              label="Выйти из системы"
              description="Завершение текущей активной сессии"
              action={
                <button
                  onClick={handleLogout}
                  className="text-xs font-bold text-destructive hover:bg-destructive/10 px-4 py-2 rounded-xl border border-destructive/20 transition-all"
                >
                  Выйти
                </button>
              }
            />
          </SettingsSection>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground pt-6">
          City Guide AI · Интеграция 2GIS 3.0 API & Gemini ИИ
        </p>
      </div>
    </div>
  );
}

