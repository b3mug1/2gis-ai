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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const { t, language } = useLanguage();

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    // Use language for voice recognition
    recognition.lang = language === "ru" ? "ru-RU" : language === "kz" ? "kk-KZ" : "en-US";
    recognition.onstart = () => setIsRecording(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        "flex items-end gap-2 rounded-2xl border bg-[hsl(var(--muted))] px-3 py-2 transition-colors",
        "focus-within:border-brand-400 focus-within:bg-[hsl(var(--background))]",
        isRecording && "border-rose-400 ring-2 ring-rose-400/20"
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

        {/* Voice button */}
        {voiceSupported && (
          <button
            onClick={toggleVoice}
            title={isRecording ? t.chat.voiceStop : t.chat.voiceStart}
            className={cn(
              "shrink-0 p-1.5 rounded-lg transition-all mb-0.5",
              isRecording
                ? "text-rose-500 bg-rose-500/10 animate-pulse"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
          className="flex-1 bg-transparent text-sm resize-none outline-none placeholder:text-muted-foreground py-1.5 max-h-[140px] leading-relaxed text-foreground"
          disabled={isLoading || disabled}
        />

        {/* Filters toggle */}
        {onToggleFilters && (
          <button
            onClick={onToggleFilters}
            title={t.filters.title}
            className={cn(
              "shrink-0 p-1.5 rounded-lg transition-colors mb-0.5",
              showFilters
                ? "text-brand-500 bg-brand-500/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        )}

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
          aria-label="Send"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </motion.button>
      </div>

      <div className="flex items-center justify-between mt-1.5 px-2">
        <div className="flex items-center gap-2">
          {coords && (
            <p className="text-[10px] text-brand-500 flex items-center gap-1 font-medium">
              <MapPin className="w-2.5 h-2.5" />
              {t.chat.locationAttached}
            </p>
          )}
          <AnimatePresence>
            {isRecording && (
              <motion.p
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-[10px] text-rose-500 flex items-center gap-1 font-medium"
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
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
