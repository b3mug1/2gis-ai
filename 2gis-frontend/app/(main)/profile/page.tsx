"use client";

import Link from "next/link";
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
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { useHistory } from "@/hooks/useHistory";
import { useStatistics } from "@/hooks/useStatistics";
import { Skeleton } from "@/components/shared/Skeleton";
import { formatDate } from "@/utils/format";
import { useLanguage } from "@/context/LanguageContext";

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-card p-5 shadow-sm hover:border-brand-400/40 transition-all duration-200">
      <div className="w-9 h-9 rounded-xl bg-brand-400/15 text-brand-400 flex items-center justify-center mb-3 font-bold">
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-extrabold tracking-tight text-foreground mb-1">{value}</p>
      <p className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
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
  const successRate =
    stats && stats.length > 0
      ? Math.round(
          (stats.reduce((sum, s) => sum + (s.successful_searches || 0), 0) /
            (stats.reduce((sum, s) => sum + (s.total_searches || 0), 0) || 1)) *
            100
        )
      : null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 relative space-y-6">
      {/* Page Title */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {t.profile.title}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t.profile.subtitle}</p>
      </motion.div>

      {/* Main Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[hsl(var(--border))] bg-card p-6 sm:p-7 shadow-sm relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 relative z-10">
          {/* Professional Sleek Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-brand-400 text-black font-extrabold text-2xl flex items-center justify-center shrink-0 shadow-md shadow-brand-400/20">
            {user.full_name.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground truncate">
              {user.full_name}
            </h2>

            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-xl border border-[hsl(var(--border))]">
                <Mail className="w-3.5 h-3.5" />
                {user.email}
              </span>

              <span
                className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-extrabold uppercase tracking-wider border ${
                  user.role === "admin"
                    ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
                    : "bg-brand-400/15 text-brand-400 border-brand-400/30"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                {user.role === "admin" ? "Admin" : user.role}
              </span>

              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="btn-minimal btn-minimal-primary text-xs uppercase py-1.5 px-4 flex items-center gap-1.5 shadow-md ml-auto sm:ml-0"
                >
                  <span>Панель Администратора</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Analytics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        <StatCard icon={Search} label={t.profile.totalQueries} value={totalSearches} />
        <StatCard
          icon={Heart}
          label={t.profile.savedPlaces}
          value={favsLoading ? "…" : favorites?.length ?? 0}
        />
        <StatCard
          icon={TrendingUp}
          label={t.profile.matchScore}
          value={successRate != null ? `${successRate}%` : "100%"}
        />
        <StatCard
          icon={Calendar}
          label={t.profile.daysActive}
          value={stats?.length ?? "1"}
        />
      </motion.div>

      {/* Recent Activity Section */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-[hsl(var(--border))] bg-card p-6 shadow-sm space-y-4"
      >
        <div className="flex items-center gap-2 border-b border-[hsl(var(--border))] pb-3">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <h3 className="font-extrabold text-base text-foreground">{t.profile.recentActivity}</h3>
        </div>

        {histLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-xl" />
            ))}
          </div>
        ) : (history?.length ?? 0) === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">{t.profile.noActivity}</p>
        ) : (
          <div className="space-y-2">
            {history!.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-[hsl(var(--border)/0.6)] hover:border-brand-400/40 transition-all"
              >
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-xs font-semibold flex-1 truncate text-foreground">
                  {item.query}
                </span>
                <span className="text-[11px] text-muted-foreground shrink-0 font-medium">
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
