import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Search,
  TrendingUp,
  Clock,
  Library,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { fetchDerivVideos } from "@/lib/services/youtubeService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoCard } from "./VideoCard";
import { VideoSkeleton } from "./VideoSkeleton";

interface DerivLearnProps {
  activeTopic: string | null;
  setActiveTopic: (topic: string | null) => void;
}

const TOPICS = [
  "Forex",
  "Crypto",
  "Indices",
  "Commodities",
  "Volatility",
  "Risk Management",
  "Technical Analysis",
  "Platform",
  "Multipliers",
];

export function DerivLearn({ activeTopic, setActiveTopic }: DerivLearnProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Store filter state to detect changes
  const filterKey = `${activeTopic}-${searchQuery}-${activeTab}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  const [isExpanded, setIsExpanded] = useState(false);

  // Reset expanded state when filters change (derived, not in effect)
  const actualIsExpanded = filterKey === lastFilterKey ? isExpanded : false;

  // Update last filter key when expanded is toggled
  const handleExpandToggle = () => {
    setLastFilterKey(filterKey);
    setIsExpanded(!actualIsExpanded);
  };

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["derivVideos"],
    queryFn: fetchDerivVideos,
    staleTime: 10 * 60_000,
  });

  // Filter and sort videos based on active tab and search
  const filteredVideos = useMemo(() => {
    let result = [...videos];

    // Apply topic filter
    if (activeTopic) {
      result = result.filter((v) => v.topic === activeTopic);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.title.toLowerCase().includes(query) ||
          v.channel.toLowerCase().includes(query) ||
          v.topic?.toLowerCase().includes(query),
      );
    }

    // Apply tab filter/sort
    if (activeTab === "trending") {
      result = result
        .filter((v) => v.views)
        .sort((a, b) => {
          const viewsA = parseInt(a.views?.replace(/[^0-9]/g, "") || "0");
          const viewsB = parseInt(b.views?.replace(/[^0-9]/g, "") || "0");
          return viewsB - viewsA;
        });
    } else if (activeTab === "recent") {
      result = result.reverse();
    }

    return result;
  }, [videos, activeTopic, searchQuery, activeTab]);

  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    videos.forEach((v) => {
      if (v.topic) counts[v.topic] = (counts[v.topic] || 0) + 1;
    });
    return counts;
  }, [videos]);

  return (
    <section className="flex flex-col h-full">
      {/* Header Section with Stats */}
      <div className="flex flex-col gap-4 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Deriv Learning Hub
              </h2>
              <p className="text-xs text-muted-foreground">
                Master trading with expert tutorials and guides
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {videos.length}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Total Videos
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search videos, topics, or channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-10 bg-secondary/50 border-border/50 focus:border-primary/50"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-auto"
          >
            <TabsList className="bg-secondary/50 border border-border/50">
              <TabsTrigger value="all" className="gap-1.5">
                <Library className="h-3.5 w-3.5" />
                All
              </TabsTrigger>
              <TabsTrigger value="trending" className="gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                Trending
              </TabsTrigger>
              <TabsTrigger value="recent" className="gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Recent
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Topic Filter Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">
            Topics:
          </span>
          <AnimatePresence>
            {TOPICS.map((topic) => (
              <motion.div
                key={topic}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Badge
                  variant="outline"
                  className={`cursor-pointer transition-all text-[11px] ${
                    activeTopic === topic
                      ? "bg-primary/15 text-primary border-primary/50 glow-border-high"
                      : "hover:bg-secondary border-border/50 hover:border-primary/30"
                  }`}
                  onClick={() =>
                    setActiveTopic(activeTopic === topic ? null : topic)
                  }
                >
                  {topic}
                  {topicCounts[topic] && (
                    <span className="ml-1.5 opacity-70">
                      ({topicCounts[topic]})
                    </span>
                  )}
                </Badge>
              </motion.div>
            ))}
            {activeTopic && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTopic(null)}
                className="h-6 text-xs text-primary hover:text-primary/80"
              >
                Clear filter
              </Button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Video Grid */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <VideoSkeleton key={i} />
            ))}
          </div>
        ) : filteredVideos.length > 0 ? (
          <>
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              <AnimatePresence mode="popLayout">
                {(actualIsExpanded
                  ? filteredVideos
                  : filteredVideos.slice(0, 8)
                ).map((video, i) => (
                  <VideoCard key={video.id} video={video} index={i} />
                ))}
              </AnimatePresence>
            </motion.div>

            {/* See More Button */}
            {filteredVideos.length > 8 && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleExpandToggle}
                  className="border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all group min-w-50"
                >
                  {actualIsExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2 group-hover:-translate-y-0.5 transition-transform" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2 group-hover:translate-y-0.5 transition-transform" />
                      See More ({filteredVideos.length - 8} more videos)
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="p-4 rounded-full bg-secondary/50 mb-4">
              <GraduationCap className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-2">
              No videos found
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              {searchQuery
                ? `No results for "${searchQuery}"`
                : activeTopic
                  ? `No videos found for topic "${activeTopic}"`
                  : "No videos available at the moment"}
            </p>
            {(searchQuery || activeTopic) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setActiveTopic(null);
                }}
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                Clear all filters
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
