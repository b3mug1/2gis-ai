"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ChatMessage } from "@/types/api";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { SuggestedPrompts } from "./SuggestedPrompts";
import { MapPin } from "lucide-react";

import { useLanguage } from "@/context/LanguageContext";

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onPromptSelect: (prompt: string) => void;
  selectedCompareIds?: string[];
  onToggleCompare?: (place: any) => void;
}

export function ChatWindow({
  messages,
  isLoading,
  onPromptSelect,
  selectedCompareIds,
  onToggleCompare,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex-1 overflow-y-auto">
      {isEmpty && !isLoading ? (
        <div className="flex h-full min-h-[460px] flex-col items-center justify-center px-4 py-8 text-center sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--primary))] shadow-lg backdrop-blur-xl"
          >
            <MapPin className="h-6 w-6 text-[hsl(var(--primary))]" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl mb-2.5"
          >
            {t.chat.emptyTitle}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 max-w-lg text-sm leading-relaxed text-muted-foreground"
          >
            {t.chat.emptySub}
          </motion.p>
          <SuggestedPrompts onSelect={onPromptSelect} />
        </div>
      ) : (
        <div className="space-y-4 px-4 py-5 sm:px-6">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                selectedCompareIds={selectedCompareIds}
                onToggleCompare={onToggleCompare}
              />
            ))}
          </AnimatePresence>
          {isLoading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
