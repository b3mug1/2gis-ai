import { cn } from "@/utils/cn";
import { Star } from "lucide-react";

interface RatingProps {
  value: number | null | undefined;
  className?: string;
  showValue?: boolean;
  size?: "sm" | "md";
}

export function Rating({ value, className, showValue = true, size = "sm" }: RatingProps) {
  if (!value) return <span className="text-muted-foreground text-xs">No rating</span>;

  const stars = Math.round(value / 5 * 5); // normalize to 5-star scale if needed
  const starCount = Math.min(5, Math.max(0, Math.round(value)));

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              size === "sm" ? "w-3 h-3" : "w-4 h-4",
              i < starCount
                ? "fill-amber-400 stroke-amber-400"
                : "fill-none stroke-muted-foreground/40"
            )}
          />
        ))}
      </div>
      {showValue && (
        <span className={cn("font-medium", size === "sm" ? "text-xs" : "text-sm")}>
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}
