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
        <div className="flex h-full min-h-[420px] flex-col items-center justify-center px-4 text-center sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[0_20px_40px_-24px_hsl(0_0%_0%/0.45)]"
          >
            <MapPin className="h-6 w-6" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-2xl font-semibold tracking-tight mb-2 text-foreground"
          >
            {t.chat.emptyTitle}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 max-w-xl text-sm leading-6 text-muted-foreground"
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
