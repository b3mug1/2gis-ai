"use client";

import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import type { ChatMessage } from "@/types/api";
import { UserMessage } from "./UserMessage";
import { AIMessage } from "./AIMessage";

interface MessageBubbleProps {
  message: ChatMessage;
  selectedCompareIds?: string[];
  onToggleCompare?: (place: any) => void;
}

export function MessageBubble({ message, selectedCompareIds, onToggleCompare }: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "flex w-full",
        message.role === "user" ? "justify-end" : "justify-start"
      )}
    >
      {message.role === "user" ? (
        <UserMessage message={message} />
      ) : (
        <AIMessage
          message={message}
          selectedCompareIds={selectedCompareIds}
          onToggleCompare={onToggleCompare}
        />
      )}
    </motion.div>
  );
}
