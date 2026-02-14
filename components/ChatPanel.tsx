'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateAIResponse, type NewsItem } from '@/lib/services/marketService'
import { detectTopicFromText } from '@/lib/services/youtubeService'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatPanelProps {
  news: NewsItem[]
  onTopicChange?: (topic: string | null) => void
}

const INITIAL_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    '🤖 **DerivHub Analyst Online**\n\nI have access to real-time market intelligence and can recommend learning resources.\n\nTry: _"I keep losing money on volatility"_',
  timestamp: new Date(),
}

const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    className="flex items-start gap-2.5 mb-3"
  >
    <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
      <Bot className="h-3.5 w-3.5 text-primary" />
    </div>
    <div className="glass-card px-4 py-3">
      <div className="flex items-center gap-1.5">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  </motion.div>
)

const ChatBubble = ({ msg }: { msg: Message }) => {
  const isUser = msg.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start gap-2.5 mb-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
          isUser
            ? 'bg-secondary border-border'
            : 'bg-primary/10 border-primary/20'
        }`}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5 text-foreground" />
        ) : (
          <Bot className="h-3.5 w-3.5 text-primary" />
        )}
      </div>

      <div
        className={`max-w-[85%] px-4 py-3 rounded-lg text-[13px] leading-relaxed ${
          isUser
            ? 'bg-primary/10 border border-primary/20 text-foreground'
            : 'glass-card text-foreground'
        }`}
      >
        {msg.content.split('\n').map((line, i) => {
          let processed = line
            .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
            .replace(/_(.+?)_/g, '<em class="text-muted-foreground">$1</em>')
            .replace(
              /`(.+?)`/g,
              '<code class="bg-secondary px-1 py-0.5 rounded text-primary font-mono text-[11px]">$1</code>'
            )

          if (line.startsWith('• ') || line.startsWith('- ')) {
            processed = processed.replace(/^[•\-]\s/, '')
            return (
              <div key={i} className="flex items-start gap-1.5 ml-1">
                <span className="text-primary mt-0.5 text-[10px]">▸</span>
                <span dangerouslySetInnerHTML={{ __html: processed }} />
              </div>
            )
          }

          return line === '' ? (
            <div key={i} className="h-1.5" />
          ) : (
            <div key={i} dangerouslySetInnerHTML={{ __html: processed }} />
          )
        })}
      </div>
    </motion.div>
  )
}

const ChatPanel = ({ news, onTopicChange }: ChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isTyping) return

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Detect topic from user query
    const userTopic = detectTopicFromText(text)

    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 600))

    const response = generateAIResponse(text, news)
    const responseTopic = detectTopicFromText(response)

    // Set active topic — prioritize what was detected
    const detectedTopic = userTopic || responseTopic
    if (detectedTopic && onTopicChange) {
      onTopicChange(detectedTopic)
    }

    const aiMsg: Message = {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    }

    setIsTyping(false)
    setMessages((prev) => [...prev, aiMsg])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <section className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold text-foreground leading-none">
              AI Analyst
            </h2>
            <span className="text-[10px] text-muted-foreground mt-0.5">{news.length} events loaded</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/10 border border-green-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-medium text-green-600 dark:text-green-400">Online</span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto pr-2 mb-3 min-h-0"
        style={{ scrollbarWidth: 'thin' }}
      >
        {messages.map((msg) => (
          <ChatBubble key={msg.id} msg={msg} />
        ))}
        <AnimatePresence>{isTyping && <TypingIndicator />}</AnimatePresence>
      </div>

      <div className="glass-card p-2.5 flex items-center gap-2 border border-border/50 flex-shrink-0">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about markets, risk, or strategy..."
          disabled={isTyping}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none px-3 py-1.5 font-sans disabled:opacity-50"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className="h-8 w-8 bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0 transition-all"
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </section>
  )
}

export default ChatPanel
