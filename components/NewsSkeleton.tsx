"use client";

import { Skeleton } from "@/components/ui/skeleton";

const NewsSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="glass-card p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-4 flex-1 bg-secondary" />
          <Skeleton className="h-5 w-20 bg-secondary" />
        </div>
        <Skeleton className="h-3 w-full bg-secondary" />
        <Skeleton className="h-3 w-3/4 bg-secondary" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16 bg-secondary" />
          <Skeleton className="h-3 w-24 bg-secondary" />
        </div>
      </div>
    ))}
  </div>
);

export default NewsSkeleton;
