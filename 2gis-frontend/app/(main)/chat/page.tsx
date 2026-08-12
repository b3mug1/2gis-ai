"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "framer-motion";
import { Map, MessageSquare, RotateCcw, Sparkles, Trophy, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { useLanguage } from "@/context/LanguageContext";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatInput } from "@/components/chat/ChatInput";
import { FilterPanel, SearchFilters } from "@/components/chat/FilterPanel";
import { MapView } from "@/components/map/MapView";
import { PlaceComparisonModal } from "@/components/compare/PlaceComparisonModal";
import { searchService } from "@/services/searchService";
import type { ChatMessage, ComparePlacesResponse, PlaceRecommendation } from "@/types/api";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [places, setPlaces] = useState<PlaceRecommendation[]>([]);
  const [showMap, setShowMap] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    open_now: false,
    min_rating: 0,
    price_category: null,
    travel_mode: null,
    max_travel_time_min: null,
  });

  // Comparison State
  const [selectedComparePlaces, setSelectedComparePlaces] = useState<PlaceRecommendation[]>([]);
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [comparisonData, setComparisonData] = useState<ComparePlacesResponse | null>(null);
  const [isComparingLoading, setIsComparingLoading] = useState(false);

  const initialQuerySent = useRef(false);
  const lastQuery = useRef<string>("");
  const { language, t } = useLanguage();

  const handleToggleComparePlace = useCallback((place: PlaceRecommendation) => {
    setSelectedComparePlaces((prev) => {
      const exists = prev.some((p) => p.place_id === place.place_id);
      if (exists) {
        return prev.filter((p) => p.place_id !== place.place_id);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, place];
    });
  }, []);

  const handleStartCompare = async () => {
    if (selectedComparePlaces.length < 2) return;
    setComparisonModalOpen(true);
    setIsComparingLoading(true);
    try {
      const res = await searchService.compare({
        place_ids: selectedComparePlaces.map((p) => p.place_id),
        user_query: lastQuery.current,
        locale: language,
      });
      setComparisonData(res);
    } catch {
      setComparisonData(null);
    } finally {
      setIsComparingLoading(false);
    }
  };

  const handleSend = useCallback(
    async (text: string, coords?: { latitude: number; longitude: number }) => {
      lastQuery.current = text;
      setIsSearching(true);

      const userMsg: ChatMessage = {
        id: uuidv4(),
        role: "user",
        content: text,
        timestamp: new Date(),
      };

      const aiMsgId = uuidv4();
      const aiMsg: ChatMessage = {
        id: aiMsgId,
        role: "assistant",
        content: "Анализируем запрос...",
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);

      try {
        let currentText = "";
        const result = await searchService.searchStream(
          {
            query: text,
            coordinates: coords,
            locale: language,
            travel_mode: filters.travel_mode || undefined,
            max_travel_time_min: filters.max_travel_time_min || undefined,
          },
          (evt) => {
            if (evt.event === "status") {
              const msgText = typeof evt.data === "object" ? evt.data.message : evt.data;
              currentText = `✨ ${msgText}`;
              setMessages((prev) =>
                prev.map((m) => (m.id === aiMsgId ? { ...m, content: currentText } : m))
              );
            } else if (evt.event === "chunk") {
              const chunkStr = typeof evt.data === "object" ? evt.data.text : evt.data;
              if (currentText.startsWith("✨ ")) currentText = "";
              currentText += chunkStr;
              setMessages((prev) =>
                prev.map((m) => (m.id === aiMsgId ? { ...m, content: currentText } : m))
              );
            }
          }
        );

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

        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  content: summary,
                  searchResponse: {
                    ...result,
                    recommendation: all[0] || result.recommendation,
                    alternatives: all.slice(1),
                  },
                  isStreaming: false,
                }
              : m
          )
        );
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          t.chat.errorMsg;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  content: message,
                  isStreaming: false,
                }
              : m
          )
        );
      } finally {
        setIsSearching(false);
      }
    },
    [filters, language, t]
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
    setSelectedComparePlaces([]);
  }

  return (
    <div className="premium-shell flex h-screen overflow-hidden bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="relative flex min-w-0 flex-1 flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--background))]">
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
                Умный поиск 2GIS с поддержкой стриминга AI и сравнения мест.
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
              AI + 2GIS SSE Stream
            </span>
            <span className="premium-chip">🚶 Пешком / 🚗 Авто</span>
            <span className="premium-chip">⚖️ AI Сравнение</span>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col relative">
          <FilterPanel
            visible={showFilters}
            filters={filters}
            onChange={setFilters}
            onClose={() => setShowFilters(false)}
          />
          <ChatWindow
            messages={messages}
            isLoading={isSearching}
            onPromptSelect={(p) => handleSend(p)}
            selectedCompareIds={selectedComparePlaces.map((p) => p.place_id)}
            onToggleCompare={handleToggleComparePlace}
          />

          {/* Floating Comparison Selection Bar */}
          <AnimatePresence>
            {selectedComparePlaces.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-20 left-4 right-4 z-20 mx-auto flex max-w-xl items-center justify-between rounded-full border border-[hsl(var(--primary))] bg-[hsl(var(--card))] p-2 px-4 shadow-2xl backdrop-blur-xl"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[hsl(var(--primary))]" />
                  <span className="text-xs font-bold text-foreground">
                    Выбрано {selectedComparePlaces.length} заведения
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleStartCompare}
                    disabled={selectedComparePlaces.length < 2}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--primary))] px-4 py-1.5 text-xs font-bold text-[hsl(var(--primary-foreground))] transition-transform hover:scale-105 disabled:opacity-50"
                  >
                    <Trophy className="h-3.5 w-3.5" />
                    Сравнить в ИИ
                  </button>
                  <button
                    onClick={() => setSelectedComparePlaces([])}
                    className="rounded-full border p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ChatInput
            onSend={handleSend}
            isLoading={isSearching}
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

      {/* Place Comparison Modal */}
      <PlaceComparisonModal
        isOpen={comparisonModalOpen}
        onClose={() => setComparisonModalOpen(false)}
        places={selectedComparePlaces}
        comparisonData={comparisonData}
        isLoading={isComparingLoading}
      />
    </div>
  );
}

