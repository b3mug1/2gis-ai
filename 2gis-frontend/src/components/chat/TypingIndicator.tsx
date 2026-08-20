"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="w-6 h-6 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center text-xs shrink-0">
        <MapPin className="w-3.5 h-3.5" />
      </div>
      <div className="flex items-center gap-1 bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-md px-3 py-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60"
            animate={{ y: [0, -3, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}
