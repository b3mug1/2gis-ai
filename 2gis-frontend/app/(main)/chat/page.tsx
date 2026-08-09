"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { motion } from "framer-motion";
import { Map, MessageSquare, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/utils/cn";
import { useSearch } from "@/hooks/useSearch";
import { useLanguage } from "@/context/LanguageContext";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatInput } from "@/components/chat/ChatInput";
import { FilterPanel, SearchFilters } from "@/components/chat/FilterPanel";
import { MapView } from "@/components/map/MapView";
import type { ChatMessage, PlaceRecommendation } from "@/types/api";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [places, setPlaces] = useState<PlaceRecommendation[]>([]);
  const [showMap, setShowMap] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    open_now: false,
    min_rating: 0,
    price_category: null,
  });
  const search = useSearch();
  const initialQuerySent = useRef(false);
  const { language, t } = useLanguage();

  const handleSend = useCallback(
    async (text: string, coords?: { latitude: number; longitude: number }) => {
      const userMsg: ChatMessage = {
        id: uuidv4(),
        role: "user",
        content: text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const result = await search.mutateAsync({
          query: text,
          coordinates: coords,
          locale: language,
        });

        let all = [result.recommendation, ...result.alternatives];

        if (filters.open_now) {
          all = all.filter((p) => (p as unknown as { is_open_now?: boolean }).is_open_now !== false);
        }
        if (filters.min_rating > 0) {
          all = all.filter((p) => (p.rating ?? 0) >= filters.min_rating);
        }
        if (filters.price_category) {
          all = all.filter((p) => p.price_category === filters.price_category);
        }

        setPlaces(all);

        const summary =
          all.length > 0
            ? `${t.chat.foundPlaces} **${all.length}**\n\n` +
              `**${t.chat.topPick}** ${all[0].name} - ${all[0].reason}`
            : t.chat.errorMsg;

        const aiMsg: ChatMessage = {
          id: uuidv4(),
          role: "assistant",
          content: summary,
          searchResponse: {
            ...result,
            recommendation: all[0] || result.recommendation,
            alternatives: all.slice(1),
          },
          timestamp: new Date(),
          isStreaming: true,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          t.chat.errorMsg;

        const errMsg: ChatMessage = {
          id: uuidv4(),
          role: "assistant",
          content: message,
          timestamp: new Date(),
          isStreaming: true,
        };
        setMessages((prev) => [...prev, errMsg]);
      }
    },
    [filters, language, search, t]
  );

  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !initialQuerySent.current) {
      initialQuerySent.current = true;
      handleSend(q);
    }
  }, [handleSend, searchParams]);

  function clearChat() {
    setMessages([]);
    setPlaces([]);
  }

  return (
    <div className="premium-shell flex h-screen overflow-hidden bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="flex min-w-0 flex-1 flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--background))]">
        <div
          className="border-b border-[hsl(var(--border))] backdrop-blur-2xl"
          style={{ backgroundColor: "hsl(var(--background) / 0.8)" }}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[hsl(var(--primary))]" />
                <span className="text-sm font-semibold tracking-tight text-foreground">{t.chat.title}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Search naturally. AI turns your request into a short, useful shortlist.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button onClick={clearChat} className="btn-minimal btn-minimal-secondary text-xs">
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t.chat.newChat}
                </button>
              )}
              <button
                onClick={() => setShowMap((s) => !s)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors xl:hidden",
                  showMap
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]"
                    : "border-[hsl(var(--border))] bg-[hsl(var(--card))] text-muted-foreground hover:text-foreground"
                )}
              >
                <Map className="h-3.5 w-3.5" />
                {t.chat.map}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 px-4 pb-4 sm:px-6">
            <span className="premium-chip">
              <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
              AI + 2GIS
            </span>
            <span className="premium-chip">Open now</span>
            <span className="premium-chip">Budget-aware</span>
            <span className="premium-chip">Quiet work spots</span>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <FilterPanel
            visible={showFilters}
            filters={filters}
            onChange={setFilters}
            onClose={() => setShowFilters(false)}
          />
          <ChatWindow
            messages={messages}
            isLoading={search.isPending}
            onPromptSelect={(p) => handleSend(p)}
          />
          <ChatInput
            onSend={handleSend}
            isLoading={search.isPending}
            onToggleFilters={() => setShowFilters((f) => !f)}
            showFilters={showFilters}
          />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn("hidden xl:block w-[460px] shrink-0 p-4", showMap && "!block")}
      >
        <div className="surface-panel flex h-full flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-4 py-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Live map
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">Places update as you search</p>
            </div>
            <span className="premium-chip">
              <Map className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
              Map
            </span>
          </div>
          <div className="min-h-0 flex-1">
            <MapView places={places} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
