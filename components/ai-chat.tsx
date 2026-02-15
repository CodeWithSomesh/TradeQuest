"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, MessageSquare, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AIChatProps {
  userProfile?: any;
  trades?: any[];
  stats?: any;
  isGeneratingQuest?: boolean;
  onGenerateQuest?: (topic: string) => void;
}


const AIChat = ({
  userProfile,
  trades,
  stats,
  isGeneratingQuest = false,
  onGenerateQuest,
}: AIChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    const assistantId = `assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      const response = await fetch("/api/quest/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userProfile,
          trades: trades?.slice(0, 10),
          stats,
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let rawAccumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        rawAccumulated += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: rawAccumulated } : m
          )
        );
      }

      // Trigger quest generation if the user's message implies it
      const lower = userText.toLowerCase();
      const shouldGenerate =
        lower.includes("create") ||
        lower.includes("generate") ||
        lower.includes("quest") ||
        lower.includes("teach") ||
        lower.includes("learn about");

      if (shouldGenerate && onGenerateQuest) {
        setTimeout(() => onGenerateQuest(userText), 500);
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: "Sorry, I had trouble responding. Please try again.",
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-sm min-w-[380px] border border-white/10 rounded-lg bg-gradient-to-b from-white/[0.05] to-white/[0.02] overflow-hidden">
      {/* Chat header */}
      <div className="px-4 py-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="h-4 w-4 text-[#FF444F]" />
          <h3 className="text-sm font-semibold text-foreground">
            AI Trading Mentor
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Ask me anything about trading topics. I&apos;ll create personalized
          quests for you!
        </p>
      </div>

      {/* Messages area */}
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Sparkles className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium text-foreground">Welcome!</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ask about trading topics like &quot;How do I manage risk?&quot;
                or &quot;What is technical analysis?&quot;
              </p>
            </div>
          )}

          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                  message.role === "user"
                    ? "bg-primary/20 text-foreground border border-primary/40"
                    : "bg-white/[0.08] text-foreground border border-white/10"
                }`}
              >
                {message.content}
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white/[0.08] border border-white/10 rounded-lg px-3 py-2 flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Thinking...
                </span>
              </div>
            </motion.div>
          )}

          {isGeneratingQuest && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white/[0.08] border border-white/10 rounded-lg px-3 py-2 flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin text-amber-400" />
                <span className="text-sm text-muted-foreground">
                  Creating your personalized quest...
                </span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="px-4 py-4 border-t border-white/10 flex-shrink-0 bg-white/[0.02]">
        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about any trading topic..."
            className="text-sm h-9"
            disabled={isLoading || isGeneratingQuest}
          />
          <Button
            type="submit"
            size="sm"
            className="gap-1.5 h-9 bg-[#FF444F] hover:bg-[#FF444F]/90"
            disabled={isLoading || isGeneratingQuest || !inputValue.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
