import { Skeleton } from "@/components/ui/skeleton";

export const VideoSkeleton = () => (
  <div className="glass-card overflow-hidden flex flex-col h-full animate-pulse">
    {/* Thumbnail Skeleton */}
    <Skeleton className="aspect-video w-full bg-secondary/50" />

    {/* Content Skeleton */}
    <div className="p-4 flex flex-col flex-1 space-y-3">
      {/* Title Lines */}
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-full bg-secondary/50" />
        <Skeleton className="h-3.5 w-4/5 bg-secondary/50" />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Metadata */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-24 bg-secondary/50" />
        <Skeleton className="h-3 w-16 bg-secondary/50" />
      </div>
    </div>
  </div>
);
