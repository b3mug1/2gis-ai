"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatInput } from "@/components/chat/ChatInput";
import { MapView } from "@/components/map/MapView";
import { useSearch } from "@/hooks/useSearch";
import type { ChatMessage, PlaceRecommendation } from "@/types/api";
import { Map, MessageSquare, RotateCcw } from "lucide-react";
import { cn } from "@/utils/cn";
import { motion } from "framer-motion";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [places, setPlaces] = useState<PlaceRecommendation[]>([]);
  const [showMap, setShowMap] = useState(true);
  const search = useSearch();
  const initialQuerySent = useRef(false);

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
        const currentLocale = typeof window !== "undefined" ? (localStorage.getItem("app_language") || "ru") : "ru";
        const result = await search.mutateAsync({
          query: text,
          coordinates: coords,
          locale: currentLocale,
        });

        const all = [result.recommendation, ...result.alternatives];
        setPlaces(all);

        const summary =
          `Найдено мест по вашему запросу: **${all.length}**\n\n` +
          `**Лучший выбор:** ${result.recommendation.name} — ${result.recommendation.reason}`;

        const aiMsg: ChatMessage = {
          id: uuidv4(),
          role: "assistant",
          content: summary,
          searchResponse: result,
          timestamp: new Date(),
          isStreaming: true,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "К сожалению, по данному запросу ничего не найдено. Попробуйте сформулировать по-другому.";

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
    [search]
  );

  // Handle ?q= param from home page
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
    <div className="flex h-screen">
      {/* Chat panel */}
      <div className="flex flex-col flex-1 min-w-0 h-full border-r border-[hsl(var(--border))]">
        {/* Chat topbar */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-[hsl(var(--border))] shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-500" />
            <span className="text-sm font-bold text-foreground">ИИ Поиск</span>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Новый чат
              </button>
            )}
            <button
              onClick={() => setShowMap((s) => !s)}
              className={cn(
                "flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors xl:hidden",
                showMap
                  ? "bg-brand-500/10 text-brand-500"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Map className="w-3.5 h-3.5" />
              Карта
            </button>
          </div>
        </div>

        <ChatWindow
          messages={messages}
          isLoading={search.isPending}
          onPromptSelect={(p) => handleSend(p)}
        />
        <ChatInput
          onSend={handleSend}
          isLoading={search.isPending}
        />
      </div>

      {/* Map panel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "hidden xl:block w-[420px] shrink-0 p-4",
          showMap && "!block"
        )}
      >
        <div className="h-full">
          <MapView places={places} />
        </div>
      </motion.div>
    </div>
  );
}
