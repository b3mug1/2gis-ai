import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { History, Search, ArrowRight, Clock, Filter } from "lucide-react";
import { useHistory } from "@/hooks/useHistory";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/shared/Skeleton";
import { timeAgo, formatDate } from "@/utils/format";
import { cn } from "@/utils/cn";
import { useLanguage } from "@/context/LanguageContext";

export function HistoryPage() {
  const { data: history, isLoading } = useHistory();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { t } = useLanguage();

  const filtered = (history ?? []).filter((item) =>
    item.query.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groups = filtered.reduce<Record<string, typeof filtered>>((acc, item) => {
    const day = formatDate(item.created_at);
    acc[day] = acc[day] ?? [];
    acc[day].push(item);
    return acc;
  }, {});

  function repeatSearch(query: string) {
    navigate(`/chat?q=${encodeURIComponent(query)}`);
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 relative">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{t.history.title}</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {t.history.savedCount} {history?.length ?? 0}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="relative mb-8">
        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.history.filterPlaceholder}
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[hsl(var(--border))] bg-card/60 backdrop-blur-md text-sm outline-none focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-[hsl(var(--primary)/0.1)] transition-all text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="history"
          title={searchQuery ? t.history.noMatchTitle : t.history.noHistoryTitle}
          description={
            searchQuery
              ? t.history.noMatchSub
              : t.history.noHistorySub
          }
        />
      ) : (
        <div className="space-y-10">
          {Object.entries(groups).map(([date, items], groupIndex) => (
            <motion.section
              key={date}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.05 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">{date}</span>
                <div className="h-px flex-1 bg-[hsl(var(--border))]" />
              </div>

              <div className="grid gap-2.5">
                {items.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="group"
                  >
                    <button
                      onClick={() => repeatSearch(item.query)}
                      className={cn(
                        "w-full flex items-center justify-between gap-4 p-4 rounded-2xl border border-[hsl(var(--border))] bg-card/70 backdrop-blur-sm text-left transition-all duration-200",
                        "hover:border-[hsl(var(--primary))] hover:bg-card hover:shadow-lg"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center group-hover:bg-[hsl(var(--primary)/0.1)] group-hover:text-[hsl(var(--primary))] transition-colors shrink-0">
                          <Search className="w-4 h-4 text-muted-foreground group-hover:text-[hsl(var(--primary))]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate text-foreground">{item.query}</p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {timeAgo(item.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs font-medium text-[hsl(var(--primary))]">{t.history.repeatSearch}</span>
                        <ArrowRight className="w-4 h-4 text-[hsl(var(--primary))]" />
                      </div>
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          ))}
        </div>
      )}
    </div>
  );
}
