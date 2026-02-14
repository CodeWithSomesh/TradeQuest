"use client";

import { useRef, useState } from "react";
import { Newspaper, AlertTriangle, ChevronDown } from "lucide-react";
import type { NewsItem } from "@/lib/services/marketService";
import NewsCard from "./NewsCard";
import NewsSkeleton from "./NewsSkeleton";
import { Button } from "./ui/button";

interface NewsHubProps {
  news: NewsItem[];
  isLoading: boolean;
  compact?: boolean;
}

const NewsHub = ({ news, isLoading, compact = false }: NewsHubProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showAll, setShowAll] = useState(false);
  const highCount = news.filter((n) => n.impact === "HIGH").length;

  const displayedNews = compact && !showAll ? news.slice(0, 4) : news;
  const hasMore = news.length > 4;

  const handleSeeMore = () => {
    setShowAll(true);
    // Scroll down smoothly after showing all news
    setTimeout(() => {
      if (containerRef.current) {
        const scrollAmount = containerRef.current.clientHeight * 0.8;
        containerRef.current.scrollBy({
          top: scrollAmount,
          behavior: "smooth"
        });
      }
    }, 100);
  };

  return (
    <section className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <Newspaper className="h-3.5 w-3.5 text-primary" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">
            NewsHub
          </h2>
        </div>
        {highCount > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 border border-primary/20">
            <AlertTriangle className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-medium text-primary">{highCount} HIGH</span>
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto pr-2 scroll-smooth min-h-0"
        style={{ scrollbarWidth: 'thin' }}
      >
        <div className="space-y-2.5">
          {isLoading ? (
            <NewsSkeleton />
          ) : (
            <>
              {displayedNews.map((item, i) => (
                <NewsCard key={item.id} item={item} index={i} />
              ))}
              
              {compact && hasMore && !showAll && (
                <Button
                  variant="outline"
                  onClick={handleSeeMore}
                  className="w-full mt-3 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all group"
                >
                  <ChevronDown className="h-4 w-4 mr-2 group-hover:translate-y-0.5 transition-transform" />
                  See More ({news.length - 4} more)
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default NewsHub;
