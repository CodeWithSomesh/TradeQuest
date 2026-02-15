"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Book,
  Check,
  Circle,
  AlertCircle,
  Star,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGamification } from "@/lib/gamification-context";
import { getProfile } from "@/lib/user-profile";
import { useDemoMode } from "@/lib/demo-context";
import AIChat from "@/components/ai-chat";

interface GeneratedQuest {
  questId: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: string;
  xpReward: number;
  lessons: Array<{
    id: string;
    title: string;
    content: string;
    realWorldExample: string;
    keyTakeaway: string;
  }>;
  relatedTopics: string[];
}

interface Quest {
  id: string;
  label: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  completed: boolean;
  isAiGenerated?: boolean;
  estimatedTime?: string;
  xpReward?: number;
}

type FilterType = "suggested" | "all" | "completed";

const QuestsPage = () => {
  const router = useRouter();
  const { isQuestCompleted, awardXP } = useGamification();
  const [quests, setQuests] = useState<Quest[]>([
    {
      id: "1",
      label: "Quest 1",
      title: "Introduction to Trading",
      description: "Learn the fundamentals of trading and how to place your first trade.",
      difficulty: "beginner",
      completed: false,
      isAiGenerated: false,
      xpReward: 100,
    },
    {
      id: "2",
      label: "Quest 2",
      title: "Technical Analysis Basics",
      description: "Explore chart patterns, indicators, and technical analysis strategies.",
      difficulty: "beginner",
      completed: false,
      isAiGenerated: false,
      xpReward: 100,
    },
  ]);

  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [confirmRedoQuestId, setConfirmRedoQuestId] = useState<string | null>(null);
  const [isGeneratingQuest, setIsGeneratingQuest] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const { showDemoData } = useDemoMode();

  // Load user profile and trades on mount
  useEffect(() => {
    const profile = getProfile();
    setUserProfile(profile);

    // Fetch trades data
    const fetchTrades = async () => {
      if (showDemoData) {
        // Use demo data
        const { demoTradeHistory, demoDashboardStats } = await import(
          "@/app/dashboard/demo-data"
        );
        setTrades(demoTradeHistory);
        setStats(demoDashboardStats);
      } else {
        try {
          const response = await fetch("/api/deriv/trades");
          if (response.ok) {
            const data = await response.json();
            setTrades(data.trades || []);
            setStats(data.stats || {});
          }
        } catch (error) {
          console.error("Failed to fetch trades:", error);
        }
      }
    };

    fetchTrades();
  }, [showDemoData]);

  const generateQuestFromTopic = async (topic: string) => {
    if (!topic.trim()) return;

    setIsGeneratingQuest(true);
    try {
      const response = await fetch("/api/quest/generate-from-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userTopic: topic,
          userProfile,
          trades: trades.slice(0, 10),
          stats,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate quest");
      }

      const generatedQuest: GeneratedQuest = await response.json();

      // Add the generated quest to the quests list
      const newQuest: Quest = {
        id: generatedQuest.questId,
        label: `AI Quest ${quests.length + 1}`,
        title: generatedQuest.title,
        description: generatedQuest.description,
        difficulty: generatedQuest.difficulty,
        completed: false,
        isAiGenerated: true,
        estimatedTime: generatedQuest.estimatedTime,
        xpReward: generatedQuest.xpReward,
      };

      setQuests((prev) => [newQuest, ...prev]);
      setSelectedQuest(newQuest);

      // Award some XP for creating a quest
      awardXP(50, "Generated a custom learning quest");
    } catch (error) {
      console.error("Error generating quest:", error);
    } finally {
      setIsGeneratingQuest(false);
    }
  };

  const filteredQuests = quests
    .filter((quest) => {
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
    <div className="flex h-full gap-4 p-4 md:p-6 overflow-hidden">
      {/* LEFT SIDE: Quests List */}
      <div className="flex flex-col flex-1 min-w-0 border border-white/10 rounded-lg bg-white/[0.02]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <Book className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Your Quests</h2>
              <p className="text-xs text-muted-foreground">
                {filteredQuests.length} quest{filteredQuests.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Filter buttons */}
          <div className="flex gap-2">
            <Button
              variant={activeFilter === "suggested" ? "default" : "outline"}
              onClick={() => setActiveFilter("suggested")}
              className="text-xs h-8"
            >
              New
            </Button>
            <Button
              variant={activeFilter === "all" ? "default" : "outline"}
              onClick={() => setActiveFilter("all")}
              className="text-xs h-8"
            >
              All
            </Button>
            <Button
              variant={activeFilter === "completed" ? "default" : "outline"}
              onClick={() => setActiveFilter("completed")}
              className="text-xs h-8"
            >
              Done
            </Button>
          </div>
        </div>

        {/* Quest cards list */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-3">
            {filteredQuests.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-center">
                <div>
                  <MessageSquare className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Ask the AI mentor to create a quest!
                  </p>
                </div>
              </div>
            ) : (
              filteredQuests.map((quest, index) => (
                <motion.button
                  key={quest.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => setSelectedQuest(quest)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedQuest?.id === quest.id
                      ? "border-primary/50 bg-primary/10"
                      : "border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      {quest.isAiGenerated && (
                        <div className="flex items-center gap-1 mb-1">
                          <Sparkles className="h-3 w-3 text-amber-400" />
                          <span className="text-xs font-semibold text-amber-400">AI-Generated</span>
                        </div>
                      )}
                      <h3 className="text-sm font-semibold text-foreground line-clamp-2">
                        {quest.title}
                      </h3>
                    </div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (quest.completed) {
                          setConfirmRedoQuestId(quest.id);
                        }
                      }}
                      className={`flex items-center justify-center w-5 h-5 rounded-full border flex-shrink-0 transition-all cursor-pointer ${
                        quest.completed
                          ? "bg-emerald-500/20 border-emerald-500/40"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {quest.completed ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Circle className="h-2.5 w-2.5 text-muted-foreground/40" />
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {quest.description}
                  </p>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-medium border ${getDifficultyColor(quest.difficulty)}`}
                    >
                      {quest.difficulty}
                    </Badge>
                    {quest.xpReward && !quest.completed && (
                      <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-400">
                        +{quest.xpReward} XP
                      </Badge>
                    )}
                    {quest.estimatedTime && (
                      <span className="text-[9px] text-muted-foreground">
                        {quest.estimatedTime}
                      </span>
                    )}
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Chatbot */}
      <AIChat
        userProfile={userProfile}
        trades={trades}
        stats={stats}
        isGeneratingQuest={isGeneratingQuest}
        onGenerateQuest={generateQuestFromTopic}
      />

      {/* Selected Quest Detail Modal */}
      {selectedQuest && (
        <Dialog
          open={!!selectedQuest}
          onOpenChange={(open) => !open && setSelectedQuest(null)}
        >
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  {selectedQuest.isAiGenerated && (
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-amber-400" />
                      <span className="text-xs font-semibold text-amber-400">AI-Generated Quest</span>
                    </div>
                  )}
                  <DialogTitle>{selectedQuest.title}</DialogTitle>
                  <DialogDescription className="mt-2">
                    {selectedQuest.description}
                  </DialogDescription>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={`text-xs font-medium border ${getDifficultyColor(
                    selectedQuest.difficulty
                  )}`}
                >
                  {selectedQuest.difficulty}
                </Badge>
                {selectedQuest.estimatedTime && (
                  <Badge variant="outline" className="text-xs">
                    {selectedQuest.estimatedTime}
                  </Badge>
                )}
                {selectedQuest.xpReward && (
                  <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400">
                    <Star className="h-3 w-3 mr-1" />
                    {selectedQuest.xpReward} XP
                  </Badge>
                )}
              </div>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <p className="text-sm text-foreground/80">
                Complete this quest to learn more about this trading topic and improve your skills.
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedQuest(null)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setSelectedQuest(null);
                  router.push(`/dashboard/quests/${selectedQuest.id}`);
                }}
                className="bg-primary"
              >
                Start Quest
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Dialog for Redoing Quest */}
      <Dialog open={confirmRedoQuestId !== null} onOpenChange={(open) => !open && setConfirmRedoQuestId(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <DialogTitle>Review Quest?</DialogTitle>
                <DialogDescription>
                  {confirmRedoQuestId && (
                    <span className="text-sm">
                      You&apos;ve already completed <strong>{quests.find((q) => q.id === confirmRedoQuestId)?.title}</strong>. Do you want to review it again?
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
                  setConfirmRedoQuestId(null);
                  router.push(`/dashboard/quests/${confirmRedoQuestId}`);
                }
              }}
              variant="default"
            >
              Review Quest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuestsPage;