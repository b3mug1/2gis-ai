"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, MapPin } from "lucide-react";
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
    if (!isStreaming) {
      setDisplayed(fullText);
      return;
    }
    setDisplayed("");
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
    <div className="flex items-start gap-2.5 max-w-[88%] w-full">
      <div className="w-6 h-6 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center shrink-0 mt-0.5">
        <MapPin className="w-3.5 h-3.5" />
      </div>

      <div className="flex-1 min-w-0 space-y-2.5">
        {displayed && (
          <div className="relative group">
            <div
              className={cn(
                "bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-md px-4 py-3",
                "chat-prose text-foreground",
                !done && message.isStreaming && "typing-cursor"
              )}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, className, children, ...props }) {
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
                className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-muted-foreground hover:text-foreground"
                aria-label="Copy response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[hsl(var(--primary))]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        )}

        {done && message.searchResponse && (
          <SearchResults data={message.searchResponse} />
        )}

        <span className="text-[10px] text-muted-foreground px-0.5 block">
          {timeAgo(message.timestamp.toISOString())}
        </span>
      </div>
    </div>
  );
}
