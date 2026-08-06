"use client";

import { useRef, useState, KeyboardEvent } from "react";
import { Send, Loader2, MapPin } from "lucide-react";
import { cn } from "@/utils/cn";
import { motion } from "framer-motion";

interface ChatInputProps {
  onSend: (message: string, coords?: { latitude: number; longitude: number }) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed, coords ?? undefined);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function getLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false)
    );
  }

  const canSend = value.trim().length > 0 && !isLoading && !disabled;

  return (
    <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3">
      <div className={cn(
        "flex items-end gap-2 rounded-2xl border bg-[hsl(var(--muted))] px-3 py-2 transition-colors",
        "focus-within:border-brand-400 focus-within:bg-[hsl(var(--background))]"
      )}>
        {/* Location button */}
        <button
          onClick={getLocation}
          title={coords ? "Location attached" : "Attach your location"}
          className={cn(
            "shrink-0 p-1.5 rounded-lg transition-colors mb-0.5",
            coords
              ? "text-brand-500 bg-brand-500/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          {locating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4" />
          )}
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => { setValue(e.target.value); autoResize(); }}
          onKeyDown={handleKey}
          placeholder="Ask about restaurants, cafes, places…"
          rows={1}
          className="flex-1 bg-transparent text-sm resize-none outline-none placeholder:text-muted-foreground py-1.5 max-h-[140px] leading-relaxed"
          disabled={isLoading || disabled}
        />

        <motion.button
          onClick={handleSend}
          disabled={!canSend}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all mb-0.5",
            canSend
              ? "bg-gradient-to-br from-brand-500 to-purple-600 text-white shadow-sm shadow-brand-500/30 hover:shadow-md hover:shadow-brand-500/40"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
          aria-label="Send message"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </motion.button>
      </div>

      {coords && (
        <p className="text-[10px] text-brand-500 mt-1.5 px-2 flex items-center gap-1">
          <MapPin className="w-2.5 h-2.5" />
          Location attached — results will be near you
        </p>
      )}
      <p className="text-[10px] text-muted-foreground text-center mt-1.5">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
