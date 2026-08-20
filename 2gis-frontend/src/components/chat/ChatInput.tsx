"use client";

import { useRef, useState, KeyboardEvent } from "react";
import { Send, Loader2, MapPin, Mic, MicOff, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import { useLanguage } from "@/context/LanguageContext";

type SpeechRecognitionResultLike = { transcript: string };
type SpeechRecognitionResultEventLike = {
  results: ArrayLike<{
    0: SpeechRecognitionResultLike;
  }>;
};

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructorLike {
  new (): SpeechRecognitionLike;
}

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const { t, language } = useLanguage();

  const voiceSupported = (() => {
    if (typeof window === "undefined") return false;
    const win = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructorLike;
      webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
    };
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  })();

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
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

    const win = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructorLike;
      webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
    };
    const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language === "ru" ? "ru-RU" : language === "kz" ? "kk-KZ" : "en-US";
    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: SpeechRecognitionResultEventLike) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join("");
      setValue(transcript);
      setTimeout(() => autoResize(), 0);
    };
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
  }

  const canSend = value.trim().length > 0 && !isLoading && !disabled;

  return (
    <div
      className="border-t border-[hsl(var(--border))] px-4 py-3 backdrop-blur-2xl sm:px-6"
      style={{ backgroundColor: "hsl(var(--background) / 0.85)" }}
    >
      <div className="mx-auto max-w-3xl">
        <div
          className={cn(
            "flex items-end gap-2 rounded-[1.5rem] border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.9)] px-3.5 py-2.5 shadow-lg backdrop-blur-xl transition-all duration-200",
            "focus-within:border-[hsl(var(--primary))] focus-within:shadow-xl",
            isRecording && "border-destructive ring-1 ring-destructive"
          )}
        >
          <button
            onClick={getLocation}
            title={coords ? "Location attached" : "Attach your location"}
            className={cn(
              "mb-0.5 shrink-0 rounded-full p-2 transition-colors",
              coords
                ? "bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]"
                : "text-muted-foreground hover:bg-[hsl(var(--secondary))] hover:text-foreground"
            )}
          >
            {locating ? <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--primary))]" /> : <MapPin className="h-4 w-4" />}
          </button>

          {voiceSupported && (
            <button
              onClick={toggleVoice}
              title={isRecording ? t.chat.voiceStop : t.chat.voiceStart}
              className={cn(
                "mb-0.5 shrink-0 rounded-full p-2 transition-all",
                isRecording
                  ? "bg-destructive/10 text-destructive animate-pulse"
                  : "text-muted-foreground hover:bg-[hsl(var(--secondary))] hover:text-foreground"
              )}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          )}

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              autoResize();
            }}
            onKeyDown={handleKey}
            placeholder={isRecording ? "Слушаю..." : t.chat.placeholder}
            rows={1}
            className="max-h-[140px] flex-1 resize-none bg-transparent py-1.5 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
            disabled={isLoading || disabled}
          />

          {onToggleFilters && (
            <button
              onClick={onToggleFilters}
              title={t.filters.title}
              className={cn(
                "mb-0.5 shrink-0 rounded-full p-2 transition-colors",
                showFilters
                  ? "bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]"
                  : "text-muted-foreground hover:bg-[hsl(var(--secondary))] hover:text-foreground"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              "mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-150",
              canSend
                ? "cursor-pointer bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-md hover:scale-105 active:scale-95"
                : "cursor-not-allowed bg-[hsl(var(--secondary))] text-muted-foreground opacity-50"
            )}
            aria-label="Send"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--primary-foreground))]" /> : <Send className="h-4 w-4" />}
          </button>
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-3 px-2">
          <div className="flex items-center gap-2">
            {coords && (
              <p className="flex items-center gap-1 text-[10px] font-medium text-[hsl(var(--primary))]">
                <MapPin className="h-2.5 w-2.5" />
                {t.chat.locationAttached}
              </p>
            )}
            <AnimatePresence>
              {isRecording && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1 text-[10px] font-medium text-destructive"
                >
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                  {t.chat.voiceStop}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <p className="text-[10px] text-muted-foreground">{t.chat.enterHelp}</p>
        </div>
      </div>
    </div>
  );
}
