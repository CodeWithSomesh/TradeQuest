'use client'

import { useState } from 'react'
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fetchMarketNews } from '@/lib/services/marketService'
import MarketTicker from '@/components/MarketTicker'
import NewsHub from '@/components/NewsHub'
import ChatPanel from '@/components/ChatPanel'
import { DerivLearn } from '@/components/learn'

const queryClient = new QueryClient()

function LearnContent() {
  const [activeTopic, setActiveTopic] = useState<string | null>(null)
  
  const { data: news = [], isLoading: newsLoading } = useQuery({
    queryKey: ['marketNews'],
    queryFn: fetchMarketNews,
    refetchInterval: 5 * 60_000,
    staleTime: 2 * 60_000,
  })

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Market Ticker */}
      <div className="flex-shrink-0 mb-4">
        <MarketTicker />
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        {/* Top Row: NewsHub + Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[500px]">
          {/* NewsHub — Left Column */}
          <div className="lg:col-span-5 flex flex-col min-h-0">
            <div className="glass-card p-4 lg:p-5 flex flex-col h-full">
              <NewsHub news={news} isLoading={newsLoading} compact />
            </div>
          </div>

          {/* Chat Panel — Right Column */}
          <div className="lg:col-span-7 flex flex-col min-h-0">
            <div className="glass-card p-4 lg:p-5 flex flex-col h-full">
              <ChatPanel news={news} onTopicChange={setActiveTopic} />
            </div>
          </div>
        </div>

        {/* Bottom Row: Video Learning Hub (Full Width) */}
        <div className="glass-card p-4 lg:p-5 flex-1 flex flex-col min-h-0">
          <DerivLearn activeTopic={activeTopic} setActiveTopic={setActiveTopic} />
        </div>
      </div>
    </div>
  )
}

export default function LearnPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="@container/main h-full w-full">
        <div className="h-full p-4 md:p-5 lg:p-6">
          <LearnContent />
        </div>
      </div>
    </QueryClientProvider>
  )
}
