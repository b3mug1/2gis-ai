import { cn } from "@/utils/cn";
import { SearchX, Heart, History, Star } from "lucide-react";

interface EmptyStateProps {
  icon?: "search" | "heart" | "history" | "star";
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const iconMap = {
  search: SearchX,
  heart: Heart,
  history: History,
  star: Star,
};

export function EmptyState({ icon = "search", title, description, action, className }: EmptyStateProps) {
  const Icon = iconMap[icon];
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-20 px-6 text-center space-y-4",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-foreground">
        <Icon className="h-6 w-6 text-foreground" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
