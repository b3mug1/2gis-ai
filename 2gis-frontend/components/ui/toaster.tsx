"use client";

import { useEffect, useRef, useState } from "react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export type ToastData = {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  duration?: number;
};

// Simple global toast store
let listeners: Array<(toasts: ToastData[]) => void> = [];
let toastQueue: ToastData[] = [];

function notify(toast: Omit<ToastData, "id">) {
  const id = Math.random().toString(36).slice(2);
  toastQueue = [{ id, ...toast }, ...toastQueue].slice(0, 5);
  listeners.forEach((l) => l([...toastQueue]));
}

export const toast = {
  success: (description: string, title?: string) =>
    notify({ title, description, variant: "success" }),
  error: (description: string, title?: string) =>
    notify({ title: title ?? "Error", description, variant: "destructive" }),
  info: (description: string, title?: string) =>
    notify({ title, description, variant: "default" }),
};

export function Toaster() {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const ref = useRef(setToasts);
  ref.current = setToasts;

  useEffect(() => {
    const handler = (t: ToastData[]) => ref.current(t);
    listeners.push(handler);
    return () => {
      listeners = listeners.filter((l) => l !== handler);
    };
  }, []);

  function dismiss(id: string) {
    toastQueue = toastQueue.filter((t) => t.id !== id);
    setToasts([...toastQueue]);
  }

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, variant }) => (
        <Toast key={id} variant={variant} onOpenChange={(open) => !open && dismiss(id)}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
