"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Book, Check, Circle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface UserProfile {
  tradingStyle?: string;
  riskTolerance?: string;
  instruments?: string[];
  learningStyle?: string;
  learningGoals?: string;
}

interface Quest {
  id: number;
  label: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  completed: boolean;
}

const quests: Quest[] = [
  {
    id: 1,
    label: "Quest 1",
    title: "Introduction to Trading",
    description: "Learn the fundamentals of trading and how to place your first trade.",
    difficulty: "beginner",
    completed: false,
  },
  {
    id: 2,
    label: "Quest 2",
    title: "Technical Analysis Basics",
    description: "Explore chart patterns, indicators, and technical analysis strategies.",
    difficulty: "beginner",
    completed: false,
  },
  {
    id: 3,
    label: "Quest 3",
    title: "Understanding Risk Management",
    description: "Master the art of managing risk and protecting your trading capital.",
    difficulty: "intermediate",
    completed: true,
  },
  {
    id: 4,
    label: "Quest 4",
    title: "Fundamental Analysis Deep Dive",
    description: "Understand economic indicators and their impact on market movements.",
    difficulty: "intermediate",
    completed: false,
  },
  {
    id: 5,
    label: "Quest 5",
    title: "Advanced Trading Strategies",
    description: "Learn complex trading strategies and portfolio management techniques.",
    difficulty: "advanced",
    completed: false,
  },
  {
    id: 6,
    label: "Quest 6",
    title: "Market Psychology and Trading",
    description: "Discover how psychology influences trading decisions and market behavior.",
    difficulty: "advanced",
    completed: false,
  },
];

type FilterType = "suggested" | "all" | "completed";

const QuestsPage = () => {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [completedQuestIds, setCompletedQuestIds] = useState<Set<number>>(new Set([3])); // Quest 3 is pre-completed
  const [confirmRedoQuestId, setConfirmRedoQuestId] = useState<number | null>(null);
  const [userProfile] = useState<UserProfile>({
    tradingStyle: "position",
    riskTolerance: "moderate",
    instruments: ["EUR/USD", "BTC/USD", "Gold", "S&P 500"],
    learningStyle: "analytical",
    learningGoals: "Improve entry timing and reduce emotional trading",
  });

  const filteredQuests = quests.map((quest) => ({
    ...quest,
    completed: completedQuestIds.has(quest.id),
  })).filter((quest) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "completed") return quest.completed;
    if (activeFilter === "suggested") return !quest.completed;
    return true;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30";
      case "intermediate":
        return "bg-amber-500/15 text-amber-600 border-amber-500/30";
      case "advanced":
        return "bg-red-500/15 text-red-600 border-red-500/30";
      default:
        return "bg-slate-500/15 text-slate-600 border-slate-500/30";
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with filters */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <Book className="h-3.5 w-3.5 text-primary" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">These Quests have been selected for you   based on your trading profile.</h2>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2">
          <Button
            variant={activeFilter === "suggested" ? "default" : "outline"}
            onClick={() => setActiveFilter("suggested")}
            className="text-xs"
          >
            Suggested
          </Button>
          <Button
            variant={activeFilter === "all" ? "default" : "outline"}
            onClick={() => setActiveFilter("all")}
            className="text-xs"
          >
            All
          </Button>
          <Button
            variant={activeFilter === "completed" ? "default" : "outline"}
            onClick={() => setActiveFilter("completed")}
            className="text-xs"
          >
            Completed
          </Button>
        </div>
      </div>

      {/* Quest cards grid */}
      <div className="flex-1 overflow-y-auto pr-2 scroll-smooth min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuests.map((quest, index) => (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
              whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
              className="glass-card p-4 cursor-pointer transition-colors duration-200 hover:border-primary/20 group"
            >
              <div className="flex flex-col h-full">
                {/* Top section with label and badges */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-primary mb-1">
                      {quest.label}
                    </p>
                    <h3 className="text-sm font-semibold text-foreground leading-tight">
                      {quest.title}
                    </h3>
                  </div>

                  {/* Right side badges */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Difficulty badge */}
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-medium uppercase border ${getDifficultyColor(
                        quest.difficulty
                      )}`}
                    >
                      {quest.difficulty}
                    </Badge>

                    {/* Completed checkmark - clickable to toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (quest.completed) {
                          setConfirmRedoQuestId(quest.id);
                        }
                      }}
                      className={`flex items-center justify-center w-5 h-5 rounded-full border transition-all ${quest.completed
                        ? "bg-emerald-500/20 border-emerald-500/40 hover:bg-emerald-500/10 hover:border-emerald-500/30 cursor-pointer"
                        : "border-muted-foreground/30 hover:border-muted-foreground/50"
                        }`}
                      title={quest.completed ? "Click to redo quest" : ""}
                    >
                      {quest.completed ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Circle className="h-2.5 w-2.5 text-muted-foreground/40" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                  {quest.description}
                </p>

                {/* Footer action - optional */}
                <div className="mt-4 pt-3 border-t border-border/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs h-7 hover:bg-primary/10 text-primary"
                    onClick={() => router.push(`/dashboard/quests/${quest.id}`)}
                  >
                    {quest.completed ? "View Details" : "Start Quest"}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Confirmation Dialog for Redoing Quest */}
      <Dialog open={confirmRedoQuestId !== null} onOpenChange={(open) => !open && setConfirmRedoQuestId(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <DialogTitle>Redo Quest?</DialogTitle>
                <DialogDescription>
                  {confirmRedoQuestId && (
                    <span className="text-sm">
                      Are you sure you want to redo <strong>{quests.find((q) => q.id === confirmRedoQuestId)?.title}</strong>? Your progress will be reset.
                    </span>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmRedoQuestId(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (confirmRedoQuestId) {
                  setCompletedQuestIds((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(confirmRedoQuestId);
                    return newSet;
                  });
                  setConfirmRedoQuestId(null);
                }
              }}
              variant="destructive"
            >
              Redo Quest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuestsPage;