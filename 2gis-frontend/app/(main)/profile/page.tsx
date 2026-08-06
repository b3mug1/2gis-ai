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
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-card p-5">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-bold mb-0.5">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
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
    <div className="max-w-3xl mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Profile</h1>
        <p className="text-muted-foreground text-sm">Your account and activity overview</p>
      </motion.div>

      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[hsl(var(--border))] bg-card p-6 mb-6"
      >
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-brand-500/20">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold truncate">{user.full_name}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Mail className="w-3.5 h-3.5" />
                {user.email}
              </span>
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                user.role === "admin"
                  ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                  : "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              }`}>
                <Shield className="w-3 h-3" />
                {user.role}
              </span>
              {!user.is_active && (
                <span className="text-xs text-destructive">Inactive</span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
      >
        <StatCard
          icon={Search}
          label="Total Searches"
          value={totalSearches}
          color="from-brand-500 to-purple-600"
        />
        <StatCard
          icon={Heart}
          label="Saved Places"
          value={favsLoading ? "…" : favorites?.length ?? 0}
          color="from-rose-500 to-pink-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Success Rate"
          value={successRate != null ? `${successRate}%` : "—"}
          color="from-green-500 to-emerald-600"
        />
        <StatCard
          icon={Calendar}
          label="Days Active"
          value={stats?.length ?? "—"}
          color="from-amber-500 to-orange-600"
        />
      </motion.div>

      {/* Recent Searches */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
        className="rounded-2xl border border-[hsl(var(--border))] bg-card p-5"
      >
        <h3 className="font-semibold text-sm mb-4">Recent Activity</h3>
        {histLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (history?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <div className="space-y-2">
            {history!.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 py-2 border-b border-[hsl(var(--border))] last:border-0"
              >
                <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm flex-1 truncate">{item.query}</span>
                <span className="text-xs text-muted-foreground shrink-0">
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
