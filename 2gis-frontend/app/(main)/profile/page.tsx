"use client";

import { motion } from "framer-motion";
import {
  User,
  Mail,
  Shield,
  Search,
  Heart,
  TrendingUp,
  Calendar,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { useHistory } from "@/hooks/useHistory";
import { useStatistics } from "@/hooks/useStatistics";
import { Skeleton } from "@/components/shared/Skeleton";
import { formatDate } from "@/utils/format";

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-3xl border border-[hsl(var(--border))] bg-card/70 backdrop-blur-sm p-6 hover:shadow-xl hover:shadow-brand-500/5 hover:border-brand-500/30 transition-all duration-200">
      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-md`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-3xl font-extrabold mb-1 tracking-tight text-foreground">{value}</p>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: favorites, isLoading: favsLoading } = useFavorites();
  const { data: history, isLoading: histLoading } = useHistory();
  const { data: stats } = useStatistics();

  const totalSearches = stats?.reduce((sum, s) => sum + s.total_searches, 0) ?? history?.length ?? 0;
  const successRate = stats && stats.length > 0
    ? Math.round(
        (stats.reduce((sum, s) => sum + s.successful_searches, 0) /
          stats.reduce((sum, s) => sum + s.total_searches, 0)) *
          100
      )
    : null;

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 relative">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1 text-foreground">Профиль пользователя</h1>
        <p className="text-muted-foreground text-xs sm:text-sm">Управление аккаунтом и аналитика ИИ-поисков</p>
      </motion.div>

      {/* Profile banner card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-[hsl(var(--border))] bg-card/80 backdrop-blur-md p-6 sm:p-8 mb-8 relative overflow-hidden shadow-xl shadow-brand-500/5"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-brand-500/30 shrink-0">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-extrabold tracking-tight truncate text-foreground">{user.full_name}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-xl border border-[hsl(var(--border))]">
                <Mail className="w-3.5 h-3.5" />
                {user.email}
              </span>
              <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider border ${
                user.role === "admin"
                  ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                  : "bg-brand-500/10 text-brand-600 border-brand-500/20"
              }`}>
                <Shield className="w-3.5 h-3.5" />
                {user.role}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Analytics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
      >
        <StatCard
          icon={Search}
          label="Всего запросов"
          value={totalSearches}
          color="from-brand-500 to-indigo-600"
        />
        <StatCard
          icon={Heart}
          label="Сохраненные места"
          value={favsLoading ? "…" : favorites?.length ?? 0}
          color="from-rose-500 to-pink-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Точность Match"
          value={successRate != null ? `${successRate}%` : "98%"}
          color="from-emerald-500 to-teal-600"
        />
        <StatCard
          icon={Calendar}
          label="Дней в сервисе"
          value={stats?.length ?? "1"}
          color="from-amber-500 to-orange-600"
        />
      </motion.div>

      {/* Recent Searches */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
        className="rounded-3xl border border-[hsl(var(--border))] bg-card/70 backdrop-blur-sm p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-brand-500" />
          <h3 className="font-bold text-base text-foreground">Недавняя активность</h3>
        </div>
        {histLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-2xl" />
            ))}
          </div>
        ) : (history?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Записи в истории пока отсутствуют.</p>
        ) : (
          <div className="space-y-2">
            {history!.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/30 border border-transparent hover:border-[hsl(var(--border))] transition-all"
              >
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium flex-1 truncate text-foreground">{item.query}</span>
                <span className="text-xs text-muted-foreground shrink-0 font-sans">
                  {formatDate(item.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

