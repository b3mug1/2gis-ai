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
        <div className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-3.5 py-2.5 rounded-md text-sm leading-relaxed font-medium">
          {message.content}
        </div>
        <span className="text-[10px] text-muted-foreground px-0.5">
          {timeAgo(message.timestamp.toISOString())}
        </span>
      </div>
      <div className="w-6 h-6 rounded-md bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] flex items-center justify-center text-foreground text-xs font-bold shrink-0">
        {initial}
      </div>
    </div>
  );
}
