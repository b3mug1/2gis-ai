"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy, Sparkles } from "lucide-react";
import { cn } from "@/utils/cn";
import type { ChatMessage } from "@/types/api";
import { SearchResults } from "@/components/search/SearchResults";
import { timeAgo } from "@/utils/format";

interface AIMessageProps {
  message: ChatMessage;
}

function useStreamText(fullText: string, isStreaming: boolean) {
  const [displayed, setDisplayed] = useState(isStreaming ? "" : fullText);

  useEffect(() => {
    if (!isStreaming) return;
    let i = 0;
    const interval = setInterval(() => {
      i += 3;
      setDisplayed(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(interval);
    }, 18);

    return () => clearInterval(interval);
  }, [fullText, isStreaming]);

  return { displayed, done: displayed.length >= fullText.length };
}

export function AIMessage({ message }: AIMessageProps) {
  const { displayed, done } = useStreamText(message.content, message.isStreaming ?? false);
  const [copied, setCopied] = useState(false);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="flex w-full max-w-[88%] items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm">
        <Sparkles className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1 space-y-2.5">
        {displayed && (
          <div className="group relative">
            <div
              className={cn(
                "rounded-[1.25rem] border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-4 py-3 text-foreground",
                "chat-prose",
                !done && message.isStreaming && "typing-cursor"
              )}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const isBlock = match != null;
                    return isBlock ? (
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-md text-sm"
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {displayed}
              </ReactMarkdown>
            </div>

            {done && (
              <button
                onClick={copyText}
                className="absolute right-2 top-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
                aria-label="Copy response"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-[hsl(var(--primary))]" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        )}

        {done && message.searchResponse && <SearchResults data={message.searchResponse} />}

        <span className="block px-0.5 text-[10px] text-muted-foreground">{timeAgo(message.timestamp.toISOString())}</span>
      </div>
    </div>
  );
}
