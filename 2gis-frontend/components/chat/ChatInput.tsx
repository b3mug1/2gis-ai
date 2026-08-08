"use client";

import { useRef, useState, useEffect, KeyboardEvent } from "react";
import { Send, Loader2, MapPin, Mic, MicOff, SlidersHorizontal } from "lucide-react";
import { cn } from "@/utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

interface ChatInputProps {
  onSend: (message: string, coords?: { latitude: number; longitude: number }) => void;
  isLoading: boolean;
  disabled?: boolean;
  onToggleFilters?: () => void;
  showFilters?: boolean;
}

export function ChatInput({ onSend, isLoading, disabled, onToggleFilters, showFilters }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const { t, language } = useLanguage();

  useEffect(() => {
    const SpeechRecognitionAPI = typeof window !== "undefined" ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;
    setVoiceSupported(!!SpeechRecognitionAPI);
  }, []);

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

  function toggleVoice() {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const win = window as any;
    const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language === "ru" ? "ru-RU" : language === "kz" ? "kk-KZ" : "en-US";
    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as any[])
        .map((r: any) => r[0].transcript)
        .join("");
      setValue(transcript);
      setTimeout(() => autoResize(), 0);
    };
    recognition.onend = () => {
      setIsRecording(false);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
  }

  const canSend = value.trim().length > 0 && !isLoading && !disabled;

  return (
    <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3">
      <div className={cn(
        "flex items-end gap-2 rounded-md border border-[hsl(var(--border))] bg-card px-3 py-2 transition-colors",
        "focus-within:border-[hsl(var(--primary))]",
        isRecording && "border-destructive ring-1 ring-destructive"
      )}>
        <button
          onClick={getLocation}
          title={coords ? "Location attached" : "Attach your location"}
          className={cn(
            "shrink-0 p-1.5 rounded-md transition-colors mb-0.5",
            coords
              ? "text-[hsl(var(--primary))] bg-[hsl(var(--secondary))]"
              : "text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--muted))]"
          )}
        >
          {locating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4" />
          )}
        </button>

        {voiceSupported && (
          <button
            onClick={toggleVoice}
            title={isRecording ? t.chat.voiceStop : t.chat.voiceStart}
            className={cn(
              "shrink-0 p-1.5 rounded-md transition-all mb-0.5",
              isRecording
                ? "text-destructive bg-destructive/10 animate-pulse"
                : "text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--muted))]"
            )}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => { setValue(e.target.value); autoResize(); }}
          onKeyDown={handleKey}
          placeholder={isRecording ? "..." : t.chat.placeholder}
          rows={1}
          className="flex-1 bg-transparent text-sm resize-none outline-none placeholder:text-muted-foreground py-1 max-h-[140px] leading-relaxed text-foreground"
          disabled={isLoading || disabled}
        />

        {onToggleFilters && (
          <button
            onClick={onToggleFilters}
            title={t.filters.title}
            className={cn(
              "shrink-0 p-1.5 rounded-md transition-colors mb-0.5",
              showFilters
                ? "text-[hsl(var(--primary))] bg-[hsl(var(--secondary))]"
                : "text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--muted))]"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={handleSend}
          disabled={!canSend}
          className={cn(
            "shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors mb-0.5",
            canSend
              ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 cursor-pointer"
              : "bg-[hsl(var(--muted))] text-muted-foreground cursor-not-allowed"
          )}
          aria-label="Send"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      <div className="flex items-center justify-between mt-1.5 px-1">
        <div className="flex items-center gap-2">
          {coords && (
            <p className="text-[10px] text-[hsl(var(--primary))] flex items-center gap-1 font-medium">
              <MapPin className="w-2.5 h-2.5" />
              {t.chat.locationAttached}
            </p>
          )}
          <AnimatePresence>
            {isRecording && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[10px] text-destructive flex items-center gap-1 font-medium"
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                {t.chat.voiceStop}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <p className="text-[10px] text-muted-foreground">{t.chat.enterHelp}</p>
      </div>
    </div>
  );
}
