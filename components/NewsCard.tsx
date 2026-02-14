"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, TrendingDown, TrendingUp, Minus, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { NewsItem } from "@/lib/services/marketService";

interface NewsCardProps {
  item: NewsItem;
  index: number;
}

const impactClass: Record<string, string> = {
  HIGH: "glow-border-high",
  MEDIUM: "glow-border-medium",
  LOW: "glow-border-low",
};

const sentimentConfig: Record<
  string,
  { icon: typeof TrendingDown; className: string }
> = {
  Bearish: {
    icon: TrendingDown,
    className:
      "bg-sentiment-bearish/15 text-sentiment-bearish border-sentiment-bearish/30",
  },
  Bullish: {
    icon: TrendingUp,
    className:
      "bg-sentiment-bullish/15 text-sentiment-bullish border-sentiment-bullish/30",
  },
  Neutral: {
    icon: Minus,
    className:
      "bg-sentiment-neutral/15 text-sentiment-neutral border-sentiment-neutral/30",
  },
};

const impactBadgeClass: Record<string, string> = {
  HIGH: "bg-primary/15 text-primary border-primary/30",
  MEDIUM: "bg-impact-medium/15 text-impact-medium border-impact-medium/30",
  LOW: "border-border text-muted-foreground",
};

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

const NewsCard = ({ item, index }: NewsCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const sc = sentimentConfig[item.sentiment];
  const SentimentIcon = sc.icon;

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
        whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
        onClick={() => setIsOpen(true)}
        className={`glass-card p-3.5 cursor-pointer transition-colors duration-200 hover:border-primary/20 ${impactClass[item.impact]}`}
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="text-[13px] font-semibold text-foreground leading-tight flex-1">
            {item.title}
          </h3>
          <Badge
            variant="outline"
            className={`shrink-0 text-[9px] font-mono uppercase border ${sc.className}`}
          >
            <SentimentIcon className="h-2.5 w-2.5 mr-1" />
            {item.sentiment}
          </Badge>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed mb-2.5 line-clamp-2">
          {item.summary}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className={`text-[9px] font-mono border ${impactBadgeClass[item.impact]}`}
            >
              {item.impact}
            </Badge>
            <span className="text-[10px] text-muted-foreground font-mono">
              {item.asset}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            <span className="font-mono">{timeAgo(item.timestamp)}</span>
            <span className="opacity-30">•</span>
            <span>{item.source}</span>
          </div>
        </div>
      </motion.article>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3 mb-3">
              <DialogTitle className="text-xl font-bold text-foreground leading-tight pr-8">
                {item.title}
              </DialogTitle>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge
                variant="outline"
                className={`text-xs font-mono uppercase border ${sc.className}`}
              >
                <SentimentIcon className="h-3 w-3 mr-1" />
                {item.sentiment}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs font-mono border ${impactBadgeClass[item.impact]}`}
              >
                {item.impact} IMPACT
              </Badge>
              <Badge variant="outline" className="text-xs">
                {item.asset}
              </Badge>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
                <Clock className="h-3 w-3" />
                <span className="font-mono">{timeAgo(item.timestamp)}</span>
              </div>
            </div>
          </DialogHeader>

          <DialogDescription className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {item.summary}
          </DialogDescription>

          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Source: {item.source}</span>
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  Read Full Article
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NewsCard;
