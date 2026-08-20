import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bookmark,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  History,
  Lock,
  LogOut,
  Mail,
  RotateCcw,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { useHistory } from "@/hooks/useHistory";
import { useStatistics } from "@/hooks/useStatistics";
import { Skeleton } from "@/components/shared/Skeleton";
import { formatDate, timeAgo } from "@/utils/format";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "@/components/ui/toaster";

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: history, isLoading: histLoading } = useHistory();
  const { data: favorites, isLoading: favsLoading } = useFavorites();
  const { data: stats } = useStatistics();
  const { t } = useLanguage();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Skeleton className="w-80 h-40 rounded-2xl" />
      </div>
    );
  }

  const totalSearches = history?.length ?? 0;
  const totalFavorites = favorites?.length ?? 0;
  const successRate =
    stats && stats.length > 0
      ? Math.round(
          (stats.reduce((sum, s) => sum + (s.successful_searches || 0), 0) /
            (stats.reduce((sum, s) => sum + (s.total_searches || 0), 0) || 1)) *
            100
        )
      : 100;

  async function handleLogout() {
    await logout();
    toast.info(t.settings.signedOut);
    navigate("/login");
  }

  function handleRepeatSearch(q: string) {
    navigate(`/chat?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[hsl(var(--border))] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t.profile.title}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {t.profile.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/settings")}
            className="btn-minimal btn-minimal-secondary text-xs px-3.5 py-1.5"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>{t.sidebar.settings}</span>
          </button>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/10 px-3.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/15 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{t.sidebar.logout}</span>
          </button>
        </div>
      </div>

      {/* User Hero Identity Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[hsl(var(--border))] bg-card p-5 sm:p-6 shadow-sm relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-2xl font-bold shadow-md">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-[hsl(var(--card))] bg-emerald-500" />
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {user.full_name}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                    user.role === "admin"
                      ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
                      : "bg-[hsl(var(--secondary))] text-foreground border-[hsl(var(--border))]"
                  }`}
                >
                  <Shield className="h-3 w-3" />
                  {user.role === "admin" ? "Admin" : "Пользователь"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  {user.email}
                </span>
                {user.created_at && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    Регистрация: {formatDate(user.created_at)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {user.role === "admin" && (
            <Link
              to="/admin"
              className="btn-minimal btn-minimal-primary text-xs shrink-0 self-start sm:self-center"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Панель Администратора</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </motion.div>

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="rounded-2xl border border-[hsl(var(--border))] bg-card p-4 shadow-sm"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider">Запросы</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--secondary))] text-foreground">
              <Search className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground">{totalSearches}</p>
          <p className="text-xs text-muted-foreground mt-0.5">В истории поиска</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="rounded-2xl border border-[hsl(var(--border))] bg-card p-4 shadow-sm"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider">Избранное</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--secondary))] text-foreground">
              <Bookmark className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {favsLoading ? "…" : totalFavorites}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Сохраненных мест</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="rounded-2xl border border-[hsl(var(--border))] bg-card p-4 shadow-sm"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider">Точность ИИ</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--secondary))] text-foreground">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground">{successRate}%</p>
          <p className="text-xs text-muted-foreground mt-0.5">Релевантность</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="rounded-2xl border border-[hsl(var(--border))] bg-card p-4 shadow-sm"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider">Активность</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--secondary))] text-foreground">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {stats?.length || 1}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Дней в сервисе</p>
        </motion.div>
      </div>

      {/* Recent Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-[hsl(var(--border))] bg-card p-5 sm:p-6 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[hsl(var(--secondary))] text-foreground">
              <History className="h-3.5 w-3.5" />
            </div>
            <h3 className="font-bold text-sm text-foreground">{t.profile.recentActivity}</h3>
          </div>

          <Link
            to="/history"
            className="text-xs font-semibold text-[hsl(var(--muted-foreground))] hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            <span>Смотреть всю историю</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {histLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : (history?.length ?? 0) === 0 ? (
          <div className="py-8 text-center">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-xs text-muted-foreground">{t.profile.noActivity}</p>
          </div>
        ) : (
          <div className="divide-y divide-[hsl(var(--border))]">
            {history!.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between gap-3 py-3 transition-colors hover:bg-[hsl(var(--secondary)/0.4)] px-2 rounded-lg -mx-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--secondary))] text-muted-foreground group-hover:text-foreground transition-colors">
                    <Search className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{item.query}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeAgo(item.created_at)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleRepeatSearch(item.query)}
                  className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2.5 py-1 text-[11px] font-medium text-foreground opacity-80 group-hover:opacity-100 hover:bg-[hsl(var(--secondary))] transition-all"
                  title="Повторить поиск"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span className="hidden sm:inline">Повторить</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
