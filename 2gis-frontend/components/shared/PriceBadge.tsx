import { cn } from "@/utils/cn";
import { getPriceLevelEmoji } from "@/utils/format";

interface PriceBadgeProps {
  level: string | null | undefined;
  className?: string;
}

export function PriceBadge({ level, className }: PriceBadgeProps) {
  if (!level) return null;

  const colorMap: Record<string, string> = {
    budget: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    moderate: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    premium: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
    luxury: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
        colorMap[level] ?? "bg-muted text-muted-foreground border-border",
        className
      )}
    >
      {getPriceLevelEmoji(level)}
      <span className="capitalize">{level}</span>
    </span>
  );
}
