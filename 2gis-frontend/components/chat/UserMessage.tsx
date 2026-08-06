"use client";

import { timeAgo } from "@/utils/format";
import type { ChatMessage } from "@/types/api";
import { useAuth } from "@/features/auth/AuthContext";

interface UserMessageProps {
  message: ChatMessage;
}

export function UserMessage({ message }: UserMessageProps) {
  const { user } = useAuth();
  const initial = user?.full_name?.charAt(0)?.toUpperCase() ?? "U";

  return (
    <div className="flex items-end gap-2 max-w-[80%]">
      <div className="flex flex-col items-end gap-1">
        <div className="bg-gradient-to-br from-brand-500 to-purple-600 text-white px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed shadow-sm shadow-brand-500/20">
          {message.content}
        </div>
        <span className="text-[10px] text-muted-foreground px-1">
          {timeAgo(message.timestamp.toISOString())}
        </span>
      </div>
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
        {initial}
      </div>
    </div>
  );
}
