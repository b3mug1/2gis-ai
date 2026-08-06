"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { History, Search, ArrowRight, Clock, Filter } from "lucide-react";
import { useHistory } from "@/hooks/useHistory";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/shared/Skeleton";
import { timeAgo, formatDate } from "@/utils/format";
import { useRouter } from "next/navigation";
import { cn } from "@/utils/cn";

export default function HistoryPage() {
  const { data: history, isLoading } = useHistory();
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const filtered = (history ?? []).filter((item) =>
    item.query.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by date
  const groups = filtered.reduce<Record<string, typeof filtered>>((acc, item) => {
    const day = formatDate(item.created_at);
    acc[day] = acc[day] ?? [];
    acc[day].push(item);
    return acc;
  }, {});

  function repeatSearch(query: string) {
    router.push(`/chat?q=${encodeURIComponent(query)}`);
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-1">
          <History className="w-6 h-6 text-brand-500" />
          Search History
        </h1>
        <p className="text-muted-foreground text-sm">
          {history?.length ?? 0} search{history?.length !== 1 ? "es" : ""} recorded
        </p>
      </motion.div>

      {/* Search filter */}
      <div className="relative mb-6">
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter searches…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm outline-none focus:border-brand-400 transition-colors"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="history"
          title={searchQuery ? "No matching searches" : "No search history"}
          description={
            searchQuery
              ? "Try a different filter term"
              : "Your AI searches will appear here"
          }
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(groups).map(([date, items], groupIndex) => (
            <motion.section
              key={date}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.06 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-[hsl(var(--border))]" />
                <span className="text-xs font-medium text-muted-foreground px-2">{date}</span>
                <div className="h-px flex-1 bg-[hsl(var(--border))]" />
              </div>

              <div className="relative pl-5">
                {/* Timeline line */}
                <div className="absolute left-1.5 top-2 bottom-2 w-px bg-[hsl(var(--border))]" />

                <div className="space-y-2">
                  {items.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="relative flex items-center gap-3 group"
                    >
                      {/* Timeline dot */}
                      <div className="absolute -left-[15px] w-3 h-3 rounded-full border-2 border-[hsl(var(--border))] bg-[hsl(var(--background))] group-hover:border-brand-400 group-hover:bg-brand-500/10 transition-colors" />

                      <button
                        onClick={() => repeatSearch(item.query)}
                        className={cn(
                          "flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]",
                          "hover:border-brand-400/60 hover:bg-brand-500/3 text-left transition-all"
                        )}
                      >
                        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm truncate">{item.query}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {timeAgo(item.created_at)}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.section>
          ))}
        </div>
      )}
    </div>
  );
}
