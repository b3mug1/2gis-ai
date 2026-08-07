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
}

export function ChatWindow({ messages, isLoading, onPromptSelect }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex-1 overflow-y-auto">
      {isEmpty && !isLoading ? (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="w-12 h-12 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center mb-4"
          >
            <MapPin className="w-6 h-6" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-lg font-bold mb-1.5 text-foreground"
          >
            {t.chat.emptyTitle}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xs text-muted-foreground mb-6 max-w-sm"
          >
            {t.chat.emptySub}
          </motion.p>
          <SuggestedPrompts onSelect={onPromptSelect} />
        </div>
      ) : (
        <div className="py-4 px-4 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </AnimatePresence>
          {isLoading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
