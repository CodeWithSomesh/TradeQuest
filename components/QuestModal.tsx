"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, CheckCircle2, X, Send, Loader2, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Answer {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
}

interface QuestPage {
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

interface QuestModalProps {
    isOpen: boolean;
    onClose: () => void;
    questId: number;
    questTitle: string;
    onQuestComplete: (questId: number) => void;
    userProfile?: UserProfile;
    isCompleted?: boolean;
}

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

export function QuestModal({
    isOpen,
    onClose,
    questId,
    questTitle,
    onQuestComplete,
    userProfile,
    isCompleted = false,
}: QuestModalProps) {
    const [pages, setPages] = useState<QuestPage[]>([]);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
    const [showResults, setShowResults] = useState(false);
    const [questCompleted, setQuestCompleted] = useState(false);
    const [isGenerating, setIsGenerating] = useState(true);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [showChatSidebar, setShowChatSidebar] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [isChatLoading, setIsChatLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Generate questions using Gemini API
    useEffect(() => {
        if (!isOpen || pages.length > 0) return;

        const generateQuestions = async () => {
            try {
                setIsGenerating(true);
                setGenerationError(null);

                const response = await fetch("/api/quest/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        questId,
                        questTitle,
                        userProfile,
                    }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || "Failed to generate quest");
                }

                const data = await response.json();
                setPages(data.pages);

                // If viewing a completed quest, set questCompleted to true
                // and populate selected answers with the first correct answer for each page
                if (isCompleted) {
                    setQuestCompleted(true);
                    const dummyAnswers: Record<string, string> = {};
                    data.pages.forEach((page: QuestPage) => {
                        const correctAnswer = page.answers.find((a: Answer) => a.isCorrect);
                        if (correctAnswer) {
                            dummyAnswers[page.id] = correctAnswer.id;
                        }
                    });
                    setSelectedAnswers(dummyAnswers);
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
    }, [isOpen, questId, questTitle, userProfile, pages.length, isCompleted]);

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
        // Clear the selected answer for this page to allow retrying
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
            onQuestComplete(questId);
        }
    };

    const handleClose = () => {
        setCurrentPageIndex(0);
        setSelectedAnswers({});
        setShowResults(false);
        setQuestCompleted(false);
        setPages([]);
        setChatMessages([]);
        setShowChatSidebar(false);
        onClose();
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;

        const userMessage = chatInput;
        setChatInput("");
        setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setIsChatLoading(true);

        try {
            const response = await fetch("/api/quest/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    questId,
                    questTitle,
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

    if (generationError) {
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Quest Error</DialogTitle>
                    </DialogHeader>
                    <div className="text-center py-6">
                        <p className="text-red-500 mb-4">{generationError}</p>
                        <Button onClick={handleClose}>Close</Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    if (isGenerating) {
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Generating Your Quest...</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    if (!pages.length) {
        return null;
    }

    if (questCompleted) {
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="flex items-center justify-between flex-row">
                        <DialogTitle className="text-center text-2xl w-full">Quest Completed! 🎉</DialogTitle>
                        <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0">
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogHeader>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 py-4">
                        {/* Results Section */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-center gap-4">
                                <CheckCircle2 className="h-12 w-12 text-emerald-500 shrink-0" />
                                <div>
                                    <h2 className="text-xl font-bold">{questTitle}</h2>
                                    <p className="text-sm text-muted-foreground">Perfect score - All answers correct!</p>
                                </div>
                            </div>

                            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20 space-y-3">
                                {pages.map((page, idx) => {
                                    const pageAnswerId = selectedAnswers[page.id];
                                    const answer = page.answers.find((a) => a.id === pageAnswerId);
                                    return (
                                        <div key={page.id} className="pb-3 border-b border-border/50 last:border-0">
                                            <p className="font-semibold text-sm mb-1">{page.title}</p>
                                            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                                <CheckCircle2 className="h-3.5 w-3.5" /> {answer?.text}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                                {answer?.explanation}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Chat Sidebar on Results */}
                        <div className="lg:col-span-1 border border-border/50 rounded-lg flex flex-col h-[500px] bg-muted/30">
                            <div className="p-3 border-b border-border/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare className="h-4 w-4 text-primary" />
                                    <h3 className="font-semibold text-sm">Assessment Analyst</h3>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Ask questions about your assessment and results
                                </p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3">
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
                                        className="h-8 w-8 p-0"
                                    >
                                        {isChatLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button onClick={handleClose} className="flex-1">
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 flex flex-col">
                <DialogHeader className="px-6 pt-6 flex items-center justify-between flex-row border-b border-border/50">
                    <div>
                        <DialogTitle>Quest {questId}</DialogTitle>
                        <p className="text-sm text-muted-foreground mt-1">{questTitle}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0">
                        <X className="h-4 w-4" />
                    </Button>
                </DialogHeader>

                <div className="flex flex-1 overflow-hidden">
                    {/* Main Content */}
                    <div className="flex-1 flex flex-col overflow-y-auto px-6 py-6">
                        <div className="space-y-4">
                            {/* Progress */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">
                                        Page {currentPageIndex + 1} of {pages.length}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {Object.keys(selectedAnswers).length}/{pages.length} answered
                                    </span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-primary"
                                        initial={{ width: 0 }}
                                        animate={{
                                            width: `${((currentPageIndex + 1) / pages.length) * 100}%`,
                                        }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                            </div>

                            {/* Story */}
                            <div className="space-y-3 py-4">
                                <h3 className="font-semibold text-lg">{currentPage.title}</h3>
                                <p className="text-sm leading-relaxed text-muted-foreground">{currentPage.story}</p>
                            </div>

                            {/* Answers */}
                            <div className="space-y-2">
                                <AnimatePresence mode="wait">
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
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="text-sm font-medium">{answer.text}</p>
                                                    {isSelected && showCorrect && (
                                                        <div
                                                            className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${answer.isCorrect
                                                                ? "bg-emerald-500 text-white"
                                                                : "bg-red-500 text-white"
                                                                }`}
                                                        >
                                                            {answer.isCorrect ? "✓" : "✗"}
                                                        </div>
                                                    )}
                                                </div>

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
                    </div>

                    {/* Chat Sidebar - Only visible during quiz */}
                    {questCompleted === false && showChatSidebar && (
                        <div className="w-80 border-l border-border/50 flex flex-col bg-muted/30">
                            <div className="p-4 border-b border-border/50">
                                <h3 className="font-semibold text-sm">Quiz Assistant</h3>
                                <p className="text-xs text-muted-foreground mt-1">Ask about trading concepts</p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4">
                                <div className="space-y-3">
                                    {chatMessages.length === 0 && (
                                        <div className="text-center text-xs text-muted-foreground py-4">
                                            <p>💡 Ask about trading terms, concepts, or quiz questions</p>
                                        </div>
                                    )}
                                    {chatMessages.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                        >
                                            <div
                                                className={`max-w-xs p-2 rounded-lg text-xs ${msg.role === "user"
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-background border border-border/50"
                                                    }`}
                                            >
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 border-t border-border/50 space-y-2">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Ask..."
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
                                        className="h-8 w-8 p-0"
                                    >
                                        {isChatLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
