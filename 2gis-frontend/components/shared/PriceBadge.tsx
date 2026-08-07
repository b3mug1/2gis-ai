import { cn } from "@/utils/cn";
import { getPriceLevelEmoji } from "@/utils/format";

interface PriceBadgeProps {
  level: string | null | undefined;
  className?: string;
}

export function PriceBadge({ level, className }: PriceBadgeProps) {
  if (!level) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-[hsl(var(--secondary))] border-[hsl(var(--border))] text-foreground",
        className
      )}
    >
      {getPriceLevelEmoji(level)}
      <span className="capitalize">{level}</span>
    </span>
  );
}
