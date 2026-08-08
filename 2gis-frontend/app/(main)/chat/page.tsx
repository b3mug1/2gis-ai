"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatInput } from "@/components/chat/ChatInput";
import { FilterPanel, SearchFilters } from "@/components/chat/FilterPanel";
import { MapView } from "@/components/map/MapView";
import { useSearch } from "@/hooks/useSearch";
import type { ChatMessage, PlaceRecommendation } from "@/types/api";
import { Map, MessageSquare, RotateCcw } from "lucide-react";
import { cn } from "@/utils/cn";
import { motion } from "framer-motion";

import { useLanguage } from "@/context/LanguageContext";

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
              `**${t.chat.topPick}** ${all[0].name} — ${all[0].reason}`
            : t.chat.errorMsg;

        const aiMsg: ChatMessage = {
          id: uuidv4(),
          role: "assistant",
          content: summary,
          searchResponse: { ...result, recommendation: all[0] || result.recommendation, alternatives: all.slice(1) },
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
    [search, language, t, filters]
  );

  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !initialQuerySent.current) {
      initialQuerySent.current = true;
      handleSend(q);
    }
  }, [searchParams, handleSend]);

  function clearChat() {
    setMessages([]);
    setPlaces([]);
  }

  return (
    <div className="flex h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="flex flex-col flex-1 min-w-0 h-full border-r border-[hsl(var(--border))]">
        <div className="flex items-center justify-between px-4 h-14 border-b border-[hsl(var(--border))] shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[hsl(var(--primary))]" />
            <span className="text-sm font-semibold text-foreground">{t.chat.title}</span>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md hover:bg-[hsl(var(--muted))] transition-colors font-medium border border-transparent hover:border-[hsl(var(--border))]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {t.chat.newChat}
              </button>
            )}
            <button
              onClick={() => setShowMap((s) => !s)}
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors xl:hidden border border-[hsl(var(--border))]",
                showMap
                  ? "bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"
                  : "text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--muted))]"
              )}
            >
              <Map className="w-3.5 h-3.5" />
              {t.chat.map}
            </button>
          </div>
        </div>

        <ChatWindow
          messages={messages}
          isLoading={search.isPending}
          onPromptSelect={(p) => handleSend(p)}
        />
        <FilterPanel
          visible={showFilters}
          filters={filters}
          onChange={setFilters}
          onClose={() => setShowFilters(false)}
        />
        <ChatInput
          onSend={handleSend}
          isLoading={search.isPending}
          onToggleFilters={() => setShowFilters((f) => !f)}
          showFilters={showFilters}
        />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "hidden xl:block w-[420px] shrink-0 p-3",
          showMap && "!block"
        )}
      >
        <div className="h-full rounded-md border border-[hsl(var(--border))] overflow-hidden">
          <MapView places={places} />
        </div>
      </motion.div>
    </div>
  );
}
