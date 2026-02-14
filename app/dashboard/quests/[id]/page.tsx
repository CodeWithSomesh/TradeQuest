"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, CheckCircle2, X, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Answer {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
}

interface Page {
    id: string;
    title: string;
    story: string;
    answers: Answer[];
}

interface UserProfile {
    tradingStyle?: string;
    riskTolerance?: string;
    instruments?: string[];
    learningStyle?: string;
    learningGoals?: string;
}

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

const quests = [
    {
        id: 1,
        title: "Introduction to Trading",
        description: "Learn the fundamentals of trading and how to place your first trade.",
    },
    {
        id: 2,
        title: "Technical Analysis Basics",
        description: "Explore chart patterns, indicators, and technical analysis strategies.",
    },
    {
        id: 3,
        title: "Understanding Risk Management",
        description: "Master the art of managing risk and protecting your trading capital.",
    },
    {
        id: 4,
        title: "Fundamental Analysis Deep Dive",
        description: "Understand economic indicators and their impact on market movements.",
    },
    {
        id: 5,
        title: "Advanced Trading Strategies",
        description: "Learn complex trading strategies and portfolio management techniques.",
    },
    {
        id: 6,
        title: "Market Psychology and Trading",
        description: "Discover how psychology influences trading decisions and market behavior.",
    },
];

export default function QuestDetailPage() {
    const router = useRouter();
    const params = useParams();
    const questId = parseInt(params.id as string);

    const quest = quests.find((q) => q.id === questId);

    const [pages, setPages] = useState<Page[]>([]);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
    const [showResults, setShowResults] = useState(false);
    const [questCompleted, setQuestCompleted] = useState(false);
    const [isGenerating, setIsGenerating] = useState(true);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [isChatLoading, setIsChatLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement | null>(null);

    const [userProfile] = useState<UserProfile>({
        tradingStyle: "position",
        riskTolerance: "moderate",
        instruments: ["EUR/USD", "BTC/USD", "Gold", "S&P 500"],
        learningStyle: "analytical",
        learningGoals: "Improve entry timing and reduce emotional trading",
    });

    const [completedQuestIds, setCompletedQuestIds] = useState<Set<number>>(new Set([3]));
    const isCompleted = completedQuestIds.has(questId);

    // Initialize questCompleted based on whether this quest is already completed
    useEffect(() => {
        if (isCompleted) {
            setQuestCompleted(true);
        }
    }, [isCompleted]);

    useEffect(() => {
        const generateQuestions = async () => {
            if (pages.length > 0) {
                setIsGenerating(false);
                return;
            }

            try {
                const response = await fetch("/api/quest/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        questId,
                        questTitle: quest?.title || "",
                        userProfile,
                    }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || "Failed to generate quest questions");
                }

                const data = await response.json();
                if (!Array.isArray(data.pages) || data.pages.length !== 5) {
                    throw new Error("Invalid response structure from API");
                }

                setPages(data.pages);

                // If this is a completed quest, pre-populate with correct answers
                if (isCompleted) {
                    const correctAnswers: Record<string, string> = {};
                    data.pages.forEach((page: Page) => {
                        const correctAnswer = page.answers.find((a) => a.isCorrect);
                        if (correctAnswer) {
                            correctAnswers[page.id] = correctAnswer.id;
                        }
                    });
                    setSelectedAnswers(correctAnswers);
                }
            } catch (error) {
                console.error("Error generating quest:", error);
                setGenerationError(
                    error instanceof Error ? error.message : "Failed to generate quest questions"
                );
            } finally {
                setIsGenerating(false);
            }
        };

        generateQuestions();
    }, [questId, quest?.title, userProfile, pages.length, isCompleted]);

    const currentPage = pages[currentPageIndex];
    const selectedAnswerId = currentPage?.id ? selectedAnswers[currentPage.id] : null;
    const selectedAnswer = selectedAnswerId
        ? currentPage?.answers.find((a) => a.id === selectedAnswerId)
        : null;
    const isAnswerCorrect = selectedAnswer?.isCorrect ?? false;
    const allAnswersCorrect = pages.every((page) => {
        const pageAnswerId = selectedAnswers[page.id];
        const answer = page.answers.find((a) => a.id === pageAnswerId);
        return answer?.isCorrect;
    });

    const handleSelectAnswer = (answerId: string) => {
        if (!currentPage) return;
        setSelectedAnswers((prev) => ({
            ...prev,
            [currentPage.id]: answerId,
        }));
        setShowResults(true);
    };

    const handleTryAgain = () => {
        if (!currentPage) return;
        setSelectedAnswers((prev) => {
            const newAnswers = { ...prev };
            delete newAnswers[currentPage.id];
            return newAnswers;
        });
        setShowResults(false);
    };

    const handleNext = () => {
        if (currentPageIndex < pages.length - 1) {
            setCurrentPageIndex(currentPageIndex + 1);
            setShowResults(false);
        } else if (allAnswersCorrect) {
            setQuestCompleted(true);
            setCompletedQuestIds((prev) => new Set(prev).add(questId));
        }
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim() || isChatLoading) return;

        const userMessage = chatInput;
        setChatInput("");
        setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setIsChatLoading(true);

        try {
            const response = await fetch("/api/quest/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    questTitle: quest?.title || "",
                    question: userMessage,
                    selectedAnswers,
                    pages,
                    previousMessages: chatMessages,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to get response");
            }

            const data = await response.json();
            setChatMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
        } catch (error) {
            console.error("Chat error:", error);
            setChatMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
            ]);
        } finally {
            setIsChatLoading(false);
        }

        // Auto-scroll to bottom
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollIntoView({ behavior: "smooth" });
            }
        }, 100);
    };

    if (!quest) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Quest not found</p>
                <Button onClick={() => router.back()} className="ml-4">
                    Back
                </Button>
            </div>
        );
    }

    if (generationError) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-red-500">{generationError}</p>
                <Button onClick={() => router.back()}>Back to Quests</Button>
            </div>
        );
    }

    if (isGenerating) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
        );
    }

    // Quest Completed View
    if (questCompleted) {
        return (
            <div className="flex flex-col h-full gap-4">
                {/* Header */}
                <div className="flex items-center justify-between flex-shrink-0 pb-4 border-b border-border/50">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Quest Completed! 🎉</h1>
                        <p className="text-sm text-muted-foreground">{quest.title}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Results Section */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
                                <h3 className="font-semibold text-emerald-600 mb-2">Great job! All answers correct</h3>
                                <p className="text-sm text-muted-foreground">
                                    You've completed this quest and demonstrated your understanding. Review your answers below or ask the Assessment Analyst for more details.
                                </p>
                            </div>

                            {/* Q&A Review */}
                            <div className="space-y-4">
                                {pages.map((page, idx) => {
                                    const selectedAnswerId = selectedAnswers[page.id];
                                    const selectedAnswer = page.answers.find((a) => a.id === selectedAnswerId);

                                    return (
                                        <motion.div
                                            key={page.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="border border-border rounded-lg p-4 bg-card/50"
                                        >
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-sm">{page.story}</h4>
                                                </div>
                                            </div>

                                            <div className="ml-9 space-y-2">
                                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-3">
                                                    <p className="text-xs font-medium text-emerald-600 mb-1">Your answer:</p>
                                                    <p className="text-sm">{selectedAnswer?.text}</p>
                                                    <p className="text-xs text-emerald-600 mt-2">{selectedAnswer?.explanation}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Chat Sidebar */}
                        <div className="lg:col-span-1 border border-border rounded-lg overflow-hidden flex flex-col bg-card">
                            <div className="p-3 border-b border-border/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare className="h-4 w-4 text-primary" />
                                    <h3 className="font-semibold text-sm">Assessment Analyst</h3>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Ask questions about your assessment and results
                                </p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 min-h-0">
                                <div className="space-y-3">
                                    {chatMessages.length === 0 && (
                                        <div className="text-center text-xs text-muted-foreground py-4">
                                            <p>👋 Ask about your assessment results, explanations, or trading concepts</p>
                                        </div>
                                    )}
                                    {chatMessages.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                        >
                                            <div
                                                className={`max-w-xs p-2.5 rounded-lg text-xs ${msg.role === "user"
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted border border-border/50"
                                                    }`}
                                            >
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={scrollRef} />
                                </div>
                            </div>

                            <div className="p-3 border-t border-border/50 space-y-2">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Ask a question..."
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === "Enter" && !isChatLoading) {
                                                handleSendMessage();
                                            }
                                        }}
                                        className="h-8 text-xs"
                                        disabled={isChatLoading}
                                    />
                                    <Button
                                        size="sm"
                                        onClick={handleSendMessage}
                                        disabled={isChatLoading || !chatInput.trim()}
                                        className="h-8 px-3"
                                    >
                                        {isChatLoading ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            "Send"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Quiz View
    return (
        <div className="flex flex-col h-full gap-4">
            {/* Header */}
            <div className="flex items-center justify-between flex-shrink-0 pb-4 border-b border-border/50">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{quest.title}</h1>
                    <p className="text-sm text-muted-foreground">
                        Page {currentPageIndex + 1} of {pages.length}
                    </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Progress Bar */}
            <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: (currentPageIndex + 1) / pages.length }}
                className="h-1 bg-primary rounded-full origin-left"
            />

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto min-h-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentPageIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        {/* Story/Question */}
                        <div className="bg-card border border-border rounded-lg p-6">
                            <h2 className="text-lg font-semibold mb-4 text-foreground">{currentPage.story}</h2>

                            {/* Answers */}
                            <div className="space-y-3">
                                <AnimatePresence>
                                    {currentPage.answers.map((answer) => {
                                        const isSelected = selectedAnswerId === answer.id;
                                        const showCorrect = showResults && isSelected;

                                        return (
                                            <motion.button
                                                key={answer.id}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -8 }}
                                                onClick={() => handleSelectAnswer(answer.id)}
                                                disabled={showResults}
                                                className={`w-full text-left p-3 rounded-lg border transition-all ${isSelected
                                                        ? showCorrect
                                                            ? answer.isCorrect
                                                                ? "border-emerald-500/50 bg-emerald-500/10"
                                                                : "border-red-500/50 bg-red-500/10"
                                                            : "border-primary/50 bg-primary/10"
                                                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                                                    } ${showResults ? "cursor-default" : "cursor-pointer"}`}
                                            >
                                                <div className="text-sm">{answer.text}</div>
                                                {showCorrect && (
                                                    <motion.p
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        className={`text-xs mt-2 leading-relaxed ${answer.isCorrect ? "text-emerald-600" : "text-red-600"
                                                            }`}
                                                    >
                                                        {answer.explanation}
                                                    </motion.p>
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>

                            {/* Action Button */}
                            {showResults && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-4">
                                    <Button
                                        onClick={isAnswerCorrect ? handleNext : handleTryAgain}
                                        className="w-full"
                                    >
                                        {!isAnswerCorrect ? (
                                            <>Try Again</>
                                        ) : currentPageIndex === pages.length - 1 ? (
                                            <>
                                                {allAnswersCorrect ? "Complete Quest" : "Continue"}
                                                {allAnswersCorrect && <CheckCircle2 className="h-4 w-4 ml-2" />}
                                            </>
                                        ) : (
                                            <>
                                                Next <ChevronRight className="h-4 w-4 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
