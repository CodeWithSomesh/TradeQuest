'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Copy, Edit3, Linkedin, Twitter, Sparkles, Save, X, RefreshCw, ChevronUp, Info, FileText, ImageIcon, Download } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface TopicItem {
  value: string
  label: string
  newsSource?: string
  actualSources?: string[]
  primarySource?: string
  lastUpdated?: number
  newsReleaseDate?: number
  sourceNews?: any[]
  context?: string
}

export default function SocialStudioPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [selectedPersona, setSelectedPersona] = useState('')
  const [additionalContext, setAdditionalContext] = useState('')
  const [includeEmojis, setIncludeEmojis] = useState(true)
  const [generatedContent, setGeneratedContent] = useState({
    linkedin: '',
    twitter: ''
  })
  const [editedContent, setEditedContent] = useState({
    linkedin: '',
    twitter: ''
  })
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [imagePrompt, setImagePrompt] = useState('')
  const [imageNegativePrompt, setImageNegativePrompt] = useState('')
  const [includeImageGeneration, setIncludeImageGeneration] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isCheckingCompliance, setIsCheckingCompliance] = useState(false)
  const [complianceStatus, setComplianceStatus] = useState<{
    isCompliant: boolean;
    reason?: string;
  } | null>(null)
  const [error, setError] = useState('')
  const [usedProvider, setUsedProvider] = useState('')
  const [previewPlatform, setPreviewPlatform] = useState<'linkedin' | 'twitter'>('linkedin')
  const [hasCustomImagePrompt, setHasCustomImagePrompt] = useState(false) // Track if user has manually edited the prompt
  
  // News context state
  const [showNewsContext, setShowNewsContext] = useState(false)
  const [newsContext, setNewsContext] = useState('')
  const [isLoadingContext, setIsLoadingContext] = useState(false)
  
  // Dynamic topics state
  const [topics, setTopics] = useState<TopicItem[]>([
    { value: 'market-highlights', label: 'Market Highlights & Analysis', newsSource: 'Default Topics', actualSources: [], primarySource: 'Default Topics', lastUpdated: Date.now() },
    { value: 'educational-content', label: 'Trading Education & Concepts', newsSource: 'Default Topics', actualSources: [], primarySource: 'Default Topics', lastUpdated: Date.now() },
    { value: 'market-psychology', label: 'Market Psychology & Risk Management', newsSource: 'Default Topics', actualSources: [], primarySource: 'Default Topics', lastUpdated: Date.now() },
    { value: 'economic-indicators', label: 'Economic Indicators & Data', newsSource: 'Default Topics', actualSources: [], primarySource: 'Default Topics', lastUpdated: Date.now() },
    { value: 'crypto-education', label: 'Cryptocurrency Education', newsSource: 'Default Topics', actualSources: [], primarySource: 'Default Topics', lastUpdated: Date.now() },
    { value: 'forex-fundamentals', label: 'Forex Market Fundamentals', newsSource: 'Default Topics', actualSources: [], primarySource: 'Default Topics', lastUpdated: Date.now() }
  ])
  const [isLoadingTopics, setIsLoadingTopics] = useState(false)
  const [topicsLastUpdated, setTopicsLastUpdated] = useState<number | null>(null)
  const [topicsSource, setTopicsSource] = useState('fallback')

  // Fetch dynamic topics from API
  const fetchTopics = useCallback(async (isManual = false) => {
    setIsLoadingTopics(true)
    
    try {
      const response = await fetch('/api/social/topics', {
        method: isManual ? 'POST' : 'GET',
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch topics')
      }
      
      const data = await response.json()

      console.log('Topics data:', data)
      // Save current selection before updating topics
      const currentValue = selectedTopic
      
      setTopics(data.topics)
      setTopicsLastUpdated(data.lastUpdated)
      setTopicsSource(data.source)
      
      // Restore selection if it still exists in new topics
      const topicStillExists = data.topics.some((topic: any) => topic.value === currentValue)
      if (!topicStillExists && currentValue) {
        // If current selection no longer exists, keep it but show warning
        toast.info('Your selected topic has been updated. Please review the new options.')
      }
      
      // Save to localStorage for offline fallback
      localStorage.setItem('dynamicTopics', JSON.stringify({
        topics: data.topics,
        lastUpdated: data.lastUpdated,
        source: data.source
      }))
      
      if (isManual) {
        toast.success(`Topics refreshed! Found ${data.topics.length} new topics from ${data.source === 'dynamic' ? 'financial news' : 'fallback data'}`)
      }
      
    } catch (error: any) {
      console.error('Failed to fetch topics:', error)
      
      // Try to load from localStorage as fallback
      const cached = localStorage.getItem('dynamicTopics')
      if (cached) {
        const cachedData = JSON.parse(cached)
        setTopics(cachedData.topics)
        setTopicsLastUpdated(cachedData.lastUpdated)
        setTopicsSource('cached')
        
        if (isManual) {
          toast.warning('Using cached topics. Network unavailable.')
        }
      } else {
        if (isManual) {
          toast.error('Failed to refresh topics. Using default options.')
        }
      }
    } finally {
      setIsLoadingTopics(false)
    }
  }, [selectedTopic])

  // Manual topic refresh
  const handleRefreshTopics = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    fetchTopics(true)
  }

  // Helper function to format date for display
  const formatTopicDate = (timestamp?: number): string => {
    if (!timestamp) return 'Recent'
    
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Helper function to format source name with actual sources
  const formatSourceName = (topic: TopicItem): string => {
    // Use actual source if available
    if (topic.primarySource && topic.primarySource !== 'Default Topics') {
      // Format actual source display with count if multiple sources
      if (topic.actualSources && topic.actualSources.length > 1) {
        return `${topic.primarySource} +${topic.actualSources.length - 1}`
      }
      return topic.primarySource
    }
    
    // Fallback to generic labels
    if (!topic.newsSource || topic.newsSource === 'Default Topics') return 'Default'
    if (topic.newsSource === 'Live Financial News') return 'Live News'
    if (topic.newsSource === 'Finnhub') return 'Live News' // Backward compatibility
    return topic.newsSource
  }

  // Handler functions for copy protection
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (complianceStatus && !complianceStatus.isCompliant) {
      // Prevent Ctrl+A, Ctrl+C, Ctrl+V, etc.
      if (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
        e.preventDefault()
        toast.error('Text selection and copying is disabled for flagged content')
        return
      }
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    if (complianceStatus && !complianceStatus.isCompliant) {
      e.preventDefault()
      toast.error('Right-click menu is disabled for flagged content')
      return false
    }
  }

  // Global protection against copying flagged content
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (complianceStatus && !complianceStatus.isCompliant) {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C' || e.key === 'a' || e.key === 'A' || e.key === 'x' || e.key === 'X')) {
          e.preventDefault()
          toast.error('Content copying is disabled for flagged content')
        }
      }
    }

    const handleGlobalCopy = (e: ClipboardEvent) => {
      if (complianceStatus && !complianceStatus.isCompliant) {
        e.preventDefault()
        toast.error('Content copying is disabled for flagged content')
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    document.addEventListener('copy', handleGlobalCopy)
    document.addEventListener('cut', handleGlobalCopy)

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown)
      document.removeEventListener('copy', handleGlobalCopy)
      document.removeEventListener('cut', handleGlobalCopy)
    }
  }, [complianceStatus])

  // Screenshot detection and warning
  useEffect(() => {
    if (!complianceStatus || complianceStatus.isCompliant) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User might be taking a screenshot or switching apps
        console.warn('Screenshot attempt detected on flagged content')
        toast.warning('Screenshot detection: This content is flagged and should not be copied or shared')
      }
    }

    const handleKeyboardShortcut = (e: KeyboardEvent) => {
      // Detect common screenshot shortcuts
      if (
        (e.metaKey || e.ctrlKey) && 
        (e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) || // Mac screenshot shortcuts
        (e.key === 'PrintScreen') || // Windows screenshot
        (e.altKey && e.key === 'PrintScreen') // Alt+PrintScreen
      ) {
        e.preventDefault()
        toast.error('Screenshots are blocked for flagged content')
        return false
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('keydown', handleKeyboardShortcut, { capture: true })

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('keydown', handleKeyboardShortcut, { capture: true })
    }
  }, [complianceStatus])

  // Load topics on component mount
  useEffect(() => {
    // Try to load from localStorage first for fast loading
    const cached = localStorage.getItem('dynamicTopics')
    if (cached) {
      try {
        const cachedData = JSON.parse(cached)
        const cacheAge = Date.now() - cachedData.lastUpdated
        const SIX_HOURS = 6 * 60 * 60 * 1000
        
        if (cacheAge < SIX_HOURS) {
          // Use cached data if less than 6 hours old
          setTopics(cachedData.topics)
          setTopicsLastUpdated(cachedData.lastUpdated)
          setTopicsSource('cached')
        } else {
          // Cache is stale, fetch new topics
          fetchTopics()
        }
      } catch (error) {
        // Invalid cache, fetch new topics
        fetchTopics()
      }
    } else {
      // No cache, fetch new topics
      fetchTopics()
    }
  }, [fetchTopics])

  // Auto-refresh topics every 8 hours
  useEffect(() => {
    const SIX_HOURS = 8 * 60 * 60 * 1000 // 6 hours in milliseconds
    
    const interval = setInterval(() => {
      fetchTopics()
    }, SIX_HOURS)

    return () => clearInterval(interval)
  }, [fetchTopics])

  // Clear news context when topic changes
  useEffect(() => {
    if (selectedTopic) {
      setShowNewsContext(false)
      setNewsContext('')
    }
  }, [selectedTopic])

  const handleGenerateContent = async () => {
    setIsGenerating(true)
    setError('')
    setGeneratedContent({ linkedin: '', twitter: '' }) // Clear previous content
    setEditedContent({ linkedin: '', twitter: '' })
    setIsEditing(false)
    setComplianceStatus(null)

    try {
      // Generate content for both platforms
      const [linkedinResponse, twitterResponse] = await Promise.all([
        fetch('/api/social', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: selectedTopic,
            platform: 'linkedin',
            persona: selectedPersona,
            includeEmojis: includeEmojis,
            additionalContext: additionalContext.trim() || null
          }),
        }),
        fetch('/api/social', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: selectedTopic,
            platform: 'twitter',
            persona: selectedPersona,
            includeEmojis: includeEmojis,
            additionalContext: additionalContext.trim() || null
          }),
        })
      ])

      if (!linkedinResponse.ok || !twitterResponse.ok) {
        const errorData = !linkedinResponse.ok 
          ? await linkedinResponse.json()
          : await twitterResponse.json()
        throw new Error(errorData.error || 'Failed to generate content')
      }

      const [linkedinData, twitterData] = await Promise.all([
        linkedinResponse.json(),
        twitterResponse.json()
      ])

      setGeneratedContent({
        linkedin: linkedinData.content,
        twitter: twitterData.content
      })
      setEditedContent({
        linkedin: linkedinData.content,
        twitter: twitterData.content
      })
      setComplianceStatus(null)
      setIsEditing(false)
      setHasCustomImagePrompt(false) // Reset so image prompt can be auto-updated for new content
      
      // Use provider from the primary platform
      const primaryData = selectedPlatform === 'linkedin' ? linkedinData : twitterData
      setUsedProvider(primaryData.provider || 'AI')
      
      if (primaryData.provider === 'Ollama') {
        toast.success('Content generated for both platforms using Ollama (Gemini fallback)')
      } else {
        toast.success('Content generated for both platforms with Gemini!')
      }
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate content. Please try again.'
      setError(errorMessage)
      
      // Show specific toast messages for different error types
      if (err.message?.includes('Both AI providers have exceeded quotas')) {
        toast.error('Both Gemini and Ollama have exceeded quotas. Please wait and try again.', {
          duration: 6000
        })
      } else if (err.message?.includes('Ollama server is not running')) {
        toast.error('Ollama server not running. Please start Ollama and install llama3.2:3b model.', {
          duration: 7000
        })
      } else if (err.message?.includes('quota') || err.message?.includes('rate limit')) {
        toast.error('API rate limit exceeded. Please wait before trying again.', {
          duration: 5000
        })
      } else if (err.message?.includes('API key')) {
        toast.error('API configuration error. Please check your Gemini API key.')
      } else if (err.message?.includes('Model not available') || err.message?.includes('models temporarily unavailable')) {
        toast.error('AI models temporarily unavailable. Please try again later.')
      } else if (err.message?.includes('Invalid request')) {
        toast.error('Invalid request parameters. Please try different settings.')
      } else {
        toast.error('Failed to generate content. Please try again.')
      }
      
      console.error('Content generation error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      toast.error('Please enter an image prompt')
      return
    }

    setIsGeneratingImage(true)
    try {
      const response = await fetch('/api/image-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt.trim(),
          negativePrompt: imageNegativePrompt.trim() || undefined, // Still using negativePrompt for API compatibility
          width: 1024,
          height: 1024
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate image')
      }

      const data = await response.json()
      setGeneratedImage(data.imageUrl)
      toast.success('Image generated successfully!')
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate image. Please try again.'
      toast.error(errorMessage)
      console.error('Image generation error:', err)
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const downloadImage = () => {
    if (!generatedImage) return
    
    const link = document.createElement('a')
    link.href = generatedImage
    link.download = `generated-image-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Image downloaded!')
  }

  const generateImagePromptFromContent = (content: string): string => {
    // Create a dynamic, content-specific visual prompt
    const cleanContent = content.replace(/[📊📈📉💡🤝🚨🤔💻#@]/g, '').replace(/\n+/g, ' ').trim()
    
    // Extract key concepts and themes from the actual content
    const words = cleanContent.toLowerCase().split(/\s+/)
    const keyTerms: string[] = []
    
    // Financial and business terms
    const financialTerms = ['market', 'trading', 'investment', 'portfolio', 'risk', 'profit', 'loss', 'volatility', 'data', 'analysis', 'chart', 'trend', 'forex', 'crypto', 'stock', 'bond', 'economy', 'finance', 'price', 'value']
    const conceptTerms = ['strategy', 'growth', 'success', 'innovation', 'technology', 'digital', 'future', 'management', 'decision', 'opportunity', 'challenge', 'solution', 'insight', 'education', 'learning']
    
    // Extract relevant terms that appear in content
    financialTerms.forEach(term => {
      if (words.includes(term) || words.includes(term + 's')) {
        keyTerms.push(term)
      }
    })
    conceptTerms.forEach(term => {
      if (words.includes(term) || words.includes(term + 's')) {
        keyTerms.push(term)
      }
    })
    
    // Create a dynamic prompt based on actual content themes
    let basePrompt = "Professional business illustration"
    let stylePrompt = "modern design, clean aesthetic, corporate style"
    let colorPrompt = "blue and gold color scheme"
    
    // Customize based on detected themes
    if (keyTerms.includes('chart') || keyTerms.includes('data') || keyTerms.includes('analysis')) {
      basePrompt = "Financial dashboard with charts and data visualization"
    } else if (keyTerms.includes('risk') || keyTerms.includes('volatility')) {
      basePrompt = "Abstract financial risk and market volatility concept"
      colorPrompt = "blue and red gradient colors"
    } else if (keyTerms.includes('growth') || keyTerms.includes('profit') || keyTerms.includes('success')) {
      basePrompt = "Upward trending growth and success visualization"
      colorPrompt = "green and blue professional colors"
    } else if (keyTerms.includes('technology') || keyTerms.includes('digital') || keyTerms.includes('innovation')) {
      basePrompt = "Modern technology and innovation concept"
      colorPrompt = "blue and cyan tech colors"
      stylePrompt = "futuristic digital design, sleek modern aesthetic"
    } else if (keyTerms.includes('trading') || keyTerms.includes('forex') || keyTerms.includes('crypto')) {
      basePrompt = "Trading and financial markets visualization"
    } else if (keyTerms.includes('education') || keyTerms.includes('learning')) {
      basePrompt = "Educational business and finance concept"
    }
    
    // Add specific market context if detected
    const marketTerms = keyTerms.filter(term => ['market', 'trading', 'forex', 'crypto', 'stock', 'investment'].includes(term))
    if (marketTerms.length > 0) {
      basePrompt += ` featuring ${marketTerms.join(' and ')} elements`
    }
    
    return `${basePrompt}, ${stylePrompt}, ${colorPrompt}, high quality, professional photography style`
  }

  const handleShowImageGenerator = () => {
    setIncludeImageGeneration(true)
    
    // Auto-populate with the EXACT generated content (dynamic every generation)
    if (generatedContent[previewPlatform]) {
      setImagePrompt(generatedContent[previewPlatform])
      setHasCustomImagePrompt(false) // Reset custom flag since this is auto-generated
    }
  }

  // Auto-update image prompt when platform changes (if not manually edited)
  useEffect(() => {
    if (includeImageGeneration && generatedContent[previewPlatform] && !hasCustomImagePrompt) {
      setImagePrompt(generatedContent[previewPlatform])
    }
  }, [previewPlatform, generatedContent, includeImageGeneration, hasCustomImagePrompt])

  const checkContentCompliance = async (content: string) => {
    setIsCheckingCompliance(true)
    
    try {
      const response = await fetch('/api/social/compliance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim()
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to check compliance')
      }

      const data = await response.json()
      return {
        isCompliant: data.isCompliant,
        reason: data.reason || ''
      }
    } catch (err: any) {
      console.error('Compliance check error:', err)
      toast.error('Failed to check content compliance')
      return { isCompliant: true, reason: '' } // Default to compliant if check fails
    } finally {
      setIsCheckingCompliance(false)
    }
  }

  const handleEditContent = () => {
    setIsEditing(true)
    setComplianceStatus(null)
  }

  const handleSaveEdit = async () => {
    const contentToCheck = editedContent[previewPlatform]
    
    if (!contentToCheck.trim()) {
      toast.error('Content cannot be empty')
      return
    }

    const compliance = await checkContentCompliance(contentToCheck)
    setComplianceStatus(compliance)
    
    if (compliance.isCompliant) {
      setGeneratedContent(prev => ({
        ...prev,
        [previewPlatform]: editedContent[previewPlatform]
      }))
      setIsEditing(false)
      toast.success('Content saved successfully!')
    } else {
      toast.error('Content flagged for compliance review')
    }
  }

  const fetchNewsContext = async () => {
    if (!selectedTopic) {
      toast.error('Please select a topic first')
      return
    }

    if (showNewsContext) {
      setShowNewsContext(false)
      return
    }

    setIsLoadingContext(true)
    try {
      console.log(`🔍 Frontend: Fetching context for topic: "${selectedTopic}"`)
      
      // First, try to get context from current topics state (faster)
      const localTopic = topics.find(t => t.value === selectedTopic)
      if (localTopic && localTopic.context && localTopic.context.trim()) {
        console.log(`✅ Frontend: Found context in local state (${localTopic.context.length} characters)`)
        setNewsContext(localTopic.context)
        setShowNewsContext(true)
        toast.success(`News context loaded from cache (${localTopic.context.length} characters)`)
        setIsLoadingContext(false)
        return
      }
      
      console.log('📡 Frontend: Local context not found, fetching from API...')
      
      const response = await fetch('/api/social/topics', {
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch topics - Status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log(`📊 Frontend: Received ${data.topics?.length || 0} topics from API, source: ${data.source}`)
      
      if (data.topics && Array.isArray(data.topics)) {
        console.log('🔍 Frontend: Available topic values:', data.topics.map((t: any) => t.value).slice(0, 5))
        
        const matchingTopic = data.topics.find((t: any) => t.value === selectedTopic)
        console.log(`🎯 Frontend: Matching topic found:`, matchingTopic ? 'YES' : 'NO')
        
        if (matchingTopic) {
          console.log(`📄 Frontend: Topic data:`, {
            label: matchingTopic.label,
            hasContext: !!matchingTopic.context,
            contextLength: matchingTopic.context?.length || 0,
            hasSourceNews: !!matchingTopic.sourceNews,
            sourceNewsLength: matchingTopic.sourceNews?.length || 0,
            newsSource: matchingTopic.newsSource
          })
          
          if (matchingTopic.context && matchingTopic.context.trim()) {
            console.log(`📄 Frontend: Context preview: "${matchingTopic.context.substring(0, 100)}..."`)
            setNewsContext(matchingTopic.context)
            setShowNewsContext(true)
            toast.success(`News context loaded successfully (${matchingTopic.context.length} characters)`)
          } else {
            // Fallback: try to construct context from sourceNews if available
            if (matchingTopic.sourceNews && Array.isArray(matchingTopic.sourceNews) && matchingTopic.sourceNews.length > 0) {
              console.log(`📰 Frontend: Using sourceNews as fallback (${matchingTopic.sourceNews.length} items)`)
              const fallbackContext = `CURRENT MARKET CONTEXT:\n${matchingTopic.sourceNews.map((news: any) => 
                `[${news.category?.toUpperCase() || 'NEWS'}] ${news.headline || 'Market Update'}: ${news.summary?.substring(0, 200) || 'Financial market development'}`
              ).join('\n\n')}`
              
              setNewsContext(fallbackContext)
              setShowNewsContext(true)
              toast.success('News context constructed from source data')
            } else if (matchingTopic.newsSource === 'Default Topics') {
              // Generate context for default topics
              const topicLabel = matchingTopic.label || selectedTopic.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
              const defaultContext = `GENERAL MARKET CONTEXT:\nThis is an educational topic about ${topicLabel}. Key points to consider:\n\n• Market conditions change rapidly and past performance doesn't guarantee future results\n• Multiple factors influence market movements including economic data, geopolitical events, and sentiment\n• Educational content should focus on analysis and insights rather than specific trading advice\n• Always consider risk management and do your own research\n\nThis is educational content designed to inform readers about market trends and financial concepts. Market volatility is normal and should be expected.`
              
              setNewsContext(defaultContext)
              setShowNewsContext(true)
              toast.info('Showing general educational context for default topic')
            } else {
              setNewsContext('No news context available for this topic. This may be a default topic or the context data is not yet available.')
              setShowNewsContext(true)
              toast.info('No specific news context found for this topic')
            }
          }
        } else {
          setNewsContext(`Topic "${selectedTopic}" not found in current topics list.\n\nAvailable topics: ${data.topics.map((t: any) => `${t.value} (${t.label})`).slice(0, 3).join(', ')}${data.topics.length > 3 ? '...' : ''}`)
          setShowNewsContext(true)
          toast.warning('Selected topic not found in current topics')
        }
      } else {
        throw new Error('Invalid response format from topics API')
      }
      
    } catch (error: any) {
      console.error('❌ Frontend: Failed to fetch news context:', error)
      setNewsContext(`Error loading context: ${error?.message || 'Unknown error'}\n\nThis could be due to:\n• Network connectivity issues\n• API server problems\n• Invalid topic selection\n\nPlease try refreshing the topics or selecting a different topic.`)
      setShowNewsContext(true)
      toast.error('Failed to load news context')
    } finally {
      setIsLoadingContext(false)
    }
  }

  const handleCancelEdit = () => {
    setEditedContent({
      linkedin: generatedContent.linkedin,
      twitter: generatedContent.twitter
    })
    setIsEditing(false)
    setComplianceStatus(null)
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      {/* CSS for extreme screenshot protection */}
      <style jsx>{`
        @keyframes screenshotProtection {
          0% { 
            opacity: 0.5; 
            transform: translateX(-100%) rotate(0deg); 
            filter: blur(1px);
          }
          25% { 
            opacity: 0.8; 
            transform: translateX(0%) rotate(5deg); 
            filter: blur(3px);
          }
          50% { 
            opacity: 0.3; 
            transform: translateX(50%) rotate(-3deg); 
            filter: blur(2px);
          }
          75% { 
            opacity: 0.9; 
            transform: translateX(-50%) rotate(2deg); 
            filter: blur(4px);
          }
          100% { 
            opacity: 0.6; 
            transform: translateX(100%) rotate(-1deg); 
            filter: blur(1px);
          }
        }
        @keyframes chaosInterference {
          0% { transform: skew(2deg, 1deg) scale(1); }
          20% { transform: skew(-1deg, 2deg) scale(1.02); }
          40% { transform: skew(1deg, -1deg) scale(0.98); }
          60% { transform: skew(-2deg, 1deg) scale(1.01); }
          80% { transform: skew(1deg, -2deg) scale(0.99); }
          100% { transform: skew(-1deg, 1deg) scale(1); }
        }
        @keyframes textDestroy {
          0% { 
            letter-spacing: 8px; 
            word-spacing: 20px; 
            filter: blur(2px) contrast(300%);
          }
          25% { 
            letter-spacing: 12px; 
            word-spacing: 30px; 
            filter: blur(4px) contrast(400%);
          }
          50% { 
            letter-spacing: 15px; 
            word-spacing: 40px; 
            filter: blur(6px) contrast(500%);
          }
          75% { 
            letter-spacing: 10px; 
            word-spacing: 25px; 
            filter: blur(3px) contrast(350%);
          }
          100% { 
            letter-spacing: 8px; 
            word-spacing: 20px; 
            filter: blur(2px) contrast(300%);
          }
        }
      `}</style>
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-[#FF444F]/10 border border-[#FF444F]/20">
            <Sparkles className="h-5 w-5 text-[#FF444F]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Social Studio</h1>
            <p className="text-sm text-muted-foreground">Create and manage AI-powered social content</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Content Generator */}
          <Card className="border-white/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Content Generator</CardTitle>
              <CardDescription>Configure your AI assistant to create engaging posts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Topic */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="topic">Topic</Label>
                  <div className="flex items-center gap-2">
                    {topicsLastUpdated && (
                      <span className="text-xs text-muted-foreground">
                        Updated {Math.floor((Date.now() - topicsLastUpdated) / (1000 * 60))}m ago
                      </span>
                    )}
                    <button
                      onClick={handleRefreshTopics}
                      onMouseDown={(e) => e.preventDefault()}
                      disabled={isLoadingTopics}
                      className="p-1 rounded-md hover:bg-white/10 transition-colors disabled:opacity-50"
                      title="Refresh live topics from latest financial news"
                      type="button"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${isLoadingTopics ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
                <Select value={selectedTopic} onValueChange={setSelectedTopic} disabled={isLoadingTopics}>
                  <SelectTrigger className="dark:bg-input/30">
                    <SelectValue placeholder={isLoadingTopics ? "Loading latest topics..." : "Select live topic from financial news"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-none h-auto">
                    {topics.map((topic) => (
                      <SelectItem key={topic.value} value={topic.value}>
                        <div className="flex items-start justify-between w-full min-w-0">
                          <div className="flex items-center flex-1 pr-2">
                            {(topic.newsSource === 'Live Financial News' || (topic.actualSources && topic.actualSources.length > 0)) && (
                              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 flex-shrink-0 animate-pulse" title="Live from financial news sources" />
                            )}
                            <span className="text-sm font-medium">{topic.label}</span>
                          </div>
                          <span 
                            className="text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap"
                            title={topic.actualSources && topic.actualSources.length > 0 ? 
                              `Sources: ${topic.actualSources.join(', ')}` : 
                              `Source: ${formatSourceName(topic)}`
                            }
                          >
                            ({formatSourceName(topic)} • {formatTopicDate(topic.newsReleaseDate)})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Platform */}
              <div className="space-y-2">
                <Label>Platform</Label>
                <div className="flex gap-2">
                  <Button
                    variant={selectedPlatform === 'linkedin' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setSelectedPlatform('linkedin')
                      setPreviewPlatform('linkedin')
                    }}
                    className={selectedPlatform === 'linkedin' ? 'bg-[#FF444F] hover:bg-[#E63946]' : 'border-white/10 hover:border-[#FF444F]/30'}
                  >
                    <Linkedin className="h-4 w-4 mr-1.5" />
                    LinkedIn
                  </Button>
                  <Button
                    variant={selectedPlatform === 'twitter' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setSelectedPlatform('twitter')
                      setPreviewPlatform('twitter')
                    }}
                    className={selectedPlatform === 'twitter' ? 'bg-[#FF444F] hover:bg-[#E63946]' : 'border-white/10 hover:border-[#FF444F]/30'}
                  >
                    <Twitter className="h-4 w-4 mr-1.5" />
                    X (Twitter)
                  </Button>
                </div>
              </div>

              {/* AI Persona */}
              <div className="space-y-2">
                <Label>AI Persona</Label>
                <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                  <SelectTrigger className="dark:bg-input/30">
                    <SelectValue placeholder="Select AI persona" />
                  </SelectTrigger>
                  <SelectContent className="max-h-none h-auto">
                    <SelectItem value="market-educator">The Market Educator - Educational & Informative</SelectItem>
                    <SelectItem value="data-analyst">The Data Analyst - Objective & Research-Focused</SelectItem>
                    <SelectItem value="risk-educator">The Risk Educator - Safety & Education Focused</SelectItem>
                    <SelectItem value="market-observer">The Market Observer - Neutral & Analytical</SelectItem>
                    <SelectItem value="market-jester">The Market Jester - Chaotic & Satirical</SelectItem>
                    <SelectItem value="sigma-scalper">The "Sigma Scalper" - Stoic & Ruthless</SelectItem>
                    <SelectItem value="hype-beast">The "Hype-Beast" AI Agent - Aggressive & Influential</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Emoji Switch */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="emoji-switch">Include Emojis</Label>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-muted-foreground">
                      {includeEmojis ? '😊' : '📝'}
                    </span>
                    <button
                      id="emoji-switch"
                      type="button"
                      onClick={() => setIncludeEmojis(!includeEmojis)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#FF444F] focus:ring-offset-2 focus:ring-offset-gray-900 ${
                        includeEmojis 
                          ? 'bg-[#FF444F] shadow-lg shadow-[#FF444F]/25' 
                          : 'bg-gray-600 hover:bg-gray-500'
                      }`}
                    >
                      <span className="sr-only">Toggle emojis</span>
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${
                          includeEmojis ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-sm font-medium transition-colors duration-200 ${
                      includeEmojis ? 'text-[#FF444F]' : 'text-muted-foreground'
                    }`}>
                      {includeEmojis ? 'On' : 'Off'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Add emojis to make content more engaging and visually appealing
                </p>
              </div>

              {/* Additional Content */}
              <div className="space-y-2">
                <Label htmlFor="additional">Additional Context <span className="text-xs text-muted-foreground">(Optional)</span></Label>
                <Input
                  id="additional"
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="e.g. Focus on EURUSD, mention key economic..."
                  className="dark:bg-input/30"
                />
              </div>


              {/* Generate Button */}
              <Button
                onClick={handleGenerateContent}
                disabled={isGenerating || !selectedTopic || !selectedPlatform || !selectedPersona}
                className="w-full bg-[#FF444F] hover:bg-[#E63946] text-white"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="border-white/10">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Preview</CardTitle>
                  <CardDescription>AI-generated content ready for publishing</CardDescription>
                </div>
                {(generatedContent.linkedin || generatedContent.twitter) && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setPreviewPlatform('linkedin')}
                      className={`transition-all duration-200 ${
                        previewPlatform === 'linkedin'
                          ? 'bg-[#FF444F] hover:bg-[#E63946] text-white border-0 shadow-lg scale-105'
                          : 'border border-white/20 bg-transparent text-white hover:bg-white/10 hover:scale-105'
                      }`}
                    >
                      <Linkedin className="h-3 w-3 mr-1" />
                      LinkedIn
                    </Button>
                    <Button
                      size="sm" 
                      onClick={() => setPreviewPlatform('twitter')}
                      className={`transition-all duration-200 ${
                        previewPlatform === 'twitter'
                          ? 'bg-[#FF444F] hover:bg-[#E63946] text-white border-0 shadow-lg scale-105'
                          : 'border border-white/20 bg-transparent text-white hover:bg-white/10 hover:scale-105'
                      }`}
                    >
                      <Twitter className="h-3 w-3 mr-1" />
                      X
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Author Profile */}
              <div className="flex items-center gap-3 p-3 rounded-md bg-card/50 border border-white/5">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/placeholder-avatar.jpg" />
                  <AvatarFallback className="bg-[#FF444F] text-white text-sm">CA</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {selectedPersona ? (
                      selectedPersona === 'market-educator' ? 'The Market Educator' :
                      selectedPersona === 'data-analyst' ? 'The Data Analyst' :
                      selectedPersona === 'risk-educator' ? 'The Risk Educator' :
                      selectedPersona === 'market-observer' ? 'The Market Observer' :
                      selectedPersona === 'market-jester' ? 'The Market Jester' :
                      selectedPersona === 'sigma-scalper' ? 'The "Sigma Scalper"' :
                      selectedPersona === 'hype-beast' ? 'The "Hype-Beast" AI Agent' :
                      'AI Persona'
                    ) : 'AI Persona'}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      {selectedPersona === 'market-jester' ? 'Chaotic & Satirical' :
                       selectedPersona === 'sigma-scalper' ? 'Stoic & Ruthless' :
                       selectedPersona === 'hype-beast' ? 'Aggressive & Influential' :
                       'Educational AI Assistant'}
                    </p>
                    {usedProvider && (
                      <Badge 
                        variant="outline" 
                        className={
                          usedProvider === 'Ollama' 
                            ? "border-green-500/30 bg-green-500/10 text-green-400 text-xs px-1.5 py-0.5"
                            : "border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs px-1.5 py-0.5"
                        }
                      >
                        {usedProvider}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs">
                    {previewPlatform === 'linkedin' ? 'LinkedIn' : 'X (Twitter)'}
                  </Badge>
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs">
                    {selectedTopic ? selectedTopic.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Content Topic'}
                  </Badge>
                </div>
              </div>

              {/* Generated Content */}
              <div className="space-y-3">
                {error && (
                  <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm space-y-2">
                    <p>{error}</p>
                    {(error.includes('quota') || error.includes('rate limit')) && (
                      <div className="text-xs text-red-300 space-y-1">
                        <p><strong>Check your usage:</strong></p>
                        <p>• <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-red-200">Gemini AI Studio</a> (Primary)</p>
                        <p>• Ollama (Local fallback - no usage limits)</p>
                        <p className="mt-2">The system tries Gemini first, then Ollama if needed.</p>
                      </div>
                    )}
                    {error.includes('Model not available') && (
                      <p className="text-xs text-red-300">
                        AI models are temporarily unavailable. Please try again later.
                      </p>
                    )}
                    {error.includes('API key') && (
                      <p className="text-xs text-red-300">
                        Please check your API keys in the environment configuration.
                      </p>
                    )}
                    {error.includes('Ollama server') && (
                      <div className="text-xs text-red-300 space-y-1">
                        <p><strong>Ollama Setup Required:</strong></p>
                        <p>1. Install Ollama: <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="underline hover:text-red-200">ollama.ai</a></p>
                        <p>2. Run: <code className="bg-red-900/30 px-1 rounded">ollama pull llama3.2:3b</code></p>
                        <p>3. Start: <code className="bg-red-900/30 px-1 rounded">ollama serve</code></p>
                      </div>
                    )}
                  </div>
                )}
                
                <div 
                  className={`p-4 rounded-md bg-card/30 border border-white/5 text-sm leading-relaxed min-h-[200px] transition-all duration-200 relative ${
                    complianceStatus && !complianceStatus.isCompliant ? 'overflow-hidden' : ''
                  }`}
                >
                  {/* Screenshot Protection Overlay - Only shown when flagged */}
                  {complianceStatus && !complianceStatus.isCompliant && (
                    <div className="absolute inset-0 pointer-events-none z-10">
                      {/* Extreme noise overlay to make content completely unreadable */}
                      <div 
                        className="absolute inset-0 opacity-70 bg-gradient-to-br from-red-500/50 via-red-500/30 to-red-500/50 animate-pulse"
                        style={{
                          backgroundImage: `
                            radial-gradient(circle at 25% 25%, rgba(255, 68, 79, 0.6) 8px, transparent 8px),
                            radial-gradient(circle at 75% 75%, rgba(255, 68, 79, 0.5) 10px, transparent 10px),
                            radial-gradient(circle at 50% 50%, rgba(255, 68, 79, 0.4) 6px, transparent 6px),
                            radial-gradient(circle at 10% 90%, rgba(255, 68, 79, 0.3) 12px, transparent 12px),
                            radial-gradient(circle at 90% 10%, rgba(255, 68, 79, 0.45) 7px, transparent 7px),
                            radial-gradient(circle at 33% 66%, rgba(255, 68, 79, 0.35) 9px, transparent 9px),
                            radial-gradient(circle at 66% 33%, rgba(255, 68, 79, 0.4) 11px, transparent 11px),
                            linear-gradient(45deg, rgba(255, 68, 79, 0.3) 50%, transparent 50%),
                            linear-gradient(-45deg, rgba(255, 68, 79, 0.25) 50%, transparent 50%),
                            linear-gradient(90deg, rgba(255, 68, 79, 0.2) 40%, transparent 40%),
                            linear-gradient(0deg, rgba(255, 68, 79, 0.3) 35%, transparent 35%),
                            conic-gradient(from 45deg, rgba(255, 68, 79, 0.4), transparent, rgba(255, 68, 79, 0.4))
                          `,
                          backgroundSize: '15px 15px, 18px 18px, 12px 12px, 25px 25px, 20px 20px, 22px 22px, 16px 16px, 8px 8px, 10px 10px, 6px 6px, 14px 14px, 30px 30px',
                          mixBlendMode: 'multiply'
                        }}
                      />
                      
                      {/* Additional animated interference layer */}
                      <div 
                        className="absolute inset-0 opacity-50"
                        style={{
                          backgroundImage: `
                            repeating-linear-gradient(90deg, 
                              rgba(255, 68, 79, 0.4) 0px, 
                              rgba(255, 68, 79, 0.4) 2px, 
                              transparent 2px, 
                              transparent 6px),
                            repeating-linear-gradient(0deg, 
                              rgba(255, 68, 79, 0.3) 0px, 
                              rgba(255, 68, 79, 0.3) 1px, 
                              transparent 1px, 
                              transparent 4px)
                          `,
                          animation: 'screenshotProtection 2s ease-in-out infinite alternate'
                        }}
                      />
                      
                      {/* Ultimate chaos layer - makes content completely unreadable */}
                      <div 
                        className="absolute inset-0 opacity-60"
                        style={{
                          backgroundImage: `
                            repeating-conic-gradient(from 0deg, 
                              rgba(255, 68, 79, 0.5) 0deg 30deg,
                              transparent 30deg 60deg,
                              rgba(255, 68, 79, 0.3) 60deg 90deg,
                              transparent 90deg 120deg),
                            repeating-radial-gradient(circle at 30% 70%,
                              rgba(255, 68, 79, 0.4) 0px 15px,
                              transparent 15px 30px),
                            repeating-linear-gradient(45deg,
                              rgba(255, 68, 79, 0.6) 0px 3px,
                              transparent 3px 12px,
                              rgba(255, 68, 79, 0.4) 12px 15px,
                              transparent 15px 24px)
                          `,
                          backgroundSize: '40px 40px, 60px 60px, 20px 20px',
                          animation: 'chaosInterference 1.5s linear infinite reverse',
                          mixBlendMode: 'overlay'
                        }}
                      />
                      
                      {/* Moving scan lines */}
                      <div 
                        className="absolute inset-0 opacity-40"
                        style={{
                          background: `
                            repeating-linear-gradient(0deg,
                              transparent 0px 5px,
                              rgba(255, 68, 79, 0.8) 5px 6px,
                              transparent 6px 11px,
                              rgba(255, 68, 79, 0.6) 11px 12px)
                          `,
                          animation: 'screenshotProtection 1s linear infinite'
                        }}
                      />
                      {/* Dense watermark overlays covering entire area */}
                      <div className="absolute inset-0 select-none pointer-events-none overflow-hidden">
                        <div className="absolute top-0 left-0 text-red-500/25 text-6xl font-black transform -rotate-45 animate-pulse">
                          FLAGGED CONTENT
                        </div>
                        <div className="absolute top-1/6 right-0 text-red-500/20 text-4xl font-black transform rotate-30 animate-pulse" style={{ animationDelay: '0.5s' }}>
                          DO NOT COPY
                        </div>
                        <div className="absolute top-1/3 left-1/6 text-red-500/30 text-7xl font-black transform -rotate-30 animate-pulse" style={{ animationDelay: '1s' }}>
                          RESTRICTED
                        </div>
                        <div className="absolute top-1/2 right-1/6 text-red-500/22 text-5xl font-black transform rotate-45 animate-pulse" style={{ animationDelay: '1.5s' }}>
                          COMPLIANCE
                        </div>
                        <div className="absolute top-2/3 left-0 text-red-500/28 text-6xl font-black transform -rotate-60 animate-pulse" style={{ animationDelay: '2s' }}>
                          BLOCKED
                        </div>
                        <div className="absolute bottom-1/6 right-1/3 text-red-500/18 text-4xl font-black transform rotate-60 animate-pulse" style={{ animationDelay: '2.5s' }}>
                          FLAGGED
                        </div>
                        <div className="absolute bottom-0 left-1/3 text-red-500/25 text-5xl font-black transform -rotate-15 animate-pulse" style={{ animationDelay: '3s' }}>
                          REVIEW
                        </div>
                        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 text-red-500/35 text-8xl font-black animate-pulse" style={{ animationDelay: '1.2s' }}>
                          ⚠️
                        </div>
                        <div className="absolute bottom-1/4 right-1/2 transform translate-x-1/2 text-red-500/30 text-7xl font-black transform rotate-180 animate-pulse" style={{ animationDelay: '2.8s' }}>
                          🚫
                        </div>
                        <div className="absolute top-1/8 left-3/4 text-red-500/20 text-3xl font-black transform rotate-75 animate-pulse" style={{ animationDelay: '0.8s' }}>
                          PROTECTED
                        </div>
                        <div className="absolute bottom-1/8 left-1/8 text-red-500/15 text-3xl font-black transform -rotate-75 animate-pulse" style={{ animationDelay: '3.5s' }}>
                          SECURED
                        </div>
                      </div>
                      {/* Heavy interference strips to make text completely unreadable */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="h-full w-full">
                          {/* Dense horizontal interference lines */}
                          <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-transparent via-red-500/40 to-transparent animate-pulse" />
                          <div className="absolute top-6 left-0 w-full h-2 bg-gradient-to-r from-transparent via-red-500/30 to-transparent animate-pulse" style={{ animationDelay: '0.3s' }} />
                          <div className="absolute top-12 left-0 w-full h-3 bg-gradient-to-r from-transparent via-red-500/35 to-transparent animate-pulse" style={{ animationDelay: '0.6s' }} />
                          <div className="absolute top-18 left-0 w-full h-2 bg-gradient-to-r from-transparent via-red-500/25 to-transparent animate-pulse" style={{ animationDelay: '0.9s' }} />
                          <div className="absolute top-24 left-0 w-full h-4 bg-gradient-to-r from-transparent via-red-500/45 to-transparent animate-pulse" style={{ animationDelay: '1.2s' }} />
                          <div className="absolute top-32 left-0 w-full h-2 bg-gradient-to-r from-transparent via-red-500/30 to-transparent animate-pulse" style={{ animationDelay: '1.5s' }} />
                          <div className="absolute top-40 left-0 w-full h-3 bg-gradient-to-r from-transparent via-red-500/35 to-transparent animate-pulse" style={{ animationDelay: '1.8s' }} />
                          <div className="absolute bottom-40 left-0 w-full h-4 bg-gradient-to-r from-transparent via-red-500/40 to-transparent animate-pulse" style={{ animationDelay: '2.1s' }} />
                          <div className="absolute bottom-32 left-0 w-full h-2 bg-gradient-to-r from-transparent via-red-500/28 to-transparent animate-pulse" style={{ animationDelay: '2.4s' }} />
                          <div className="absolute bottom-24 left-0 w-full h-3 bg-gradient-to-r from-transparent via-red-500/33 to-transparent animate-pulse" style={{ animationDelay: '2.7s' }} />
                          <div className="absolute bottom-16 left-0 w-full h-4 bg-gradient-to-r from-transparent via-red-500/38 to-transparent animate-pulse" style={{ animationDelay: '3s' }} />
                          <div className="absolute bottom-8 left-0 w-full h-2 bg-gradient-to-r from-transparent via-red-500/25 to-transparent animate-pulse" style={{ animationDelay: '3.3s' }} />
                          
                          {/* Dense vertical interference lines */}
                          <div className="absolute top-0 left-0 w-3 h-full bg-gradient-to-b from-transparent via-red-500/25 to-transparent animate-pulse" style={{ animationDelay: '0.4s' }} />
                          <div className="absolute top-0 left-1/6 w-2 h-full bg-gradient-to-b from-transparent via-red-500/20 to-transparent animate-pulse" style={{ animationDelay: '0.8s' }} />
                          <div className="absolute top-0 left-1/4 w-4 h-full bg-gradient-to-b from-transparent via-red-500/30 to-transparent animate-pulse" style={{ animationDelay: '1.2s' }} />
                          <div className="absolute top-0 left-1/3 w-2 h-full bg-gradient-to-b from-transparent via-red-500/18 to-transparent animate-pulse" style={{ animationDelay: '1.6s' }} />
                          <div className="absolute top-0 left-1/2 w-3 h-full bg-gradient-to-b from-transparent via-red-500/25 to-transparent animate-pulse" style={{ animationDelay: '2s' }} />
                          <div className="absolute top-0 left-2/3 w-2 h-full bg-gradient-to-b from-transparent via-red-500/22 to-transparent animate-pulse" style={{ animationDelay: '2.4s' }} />
                          <div className="absolute top-0 left-3/4 w-4 h-full bg-gradient-to-b from-transparent via-red-500/28 to-transparent animate-pulse" style={{ animationDelay: '2.8s' }} />
                          <div className="absolute top-0 right-1/6 w-2 h-full bg-gradient-to-b from-transparent via-red-500/20 to-transparent animate-pulse" style={{ animationDelay: '3.2s' }} />
                          <div className="absolute top-0 right-0 w-3 h-full bg-gradient-to-b from-transparent via-red-500/25 to-transparent animate-pulse" style={{ animationDelay: '3.6s' }} />
                          
                          {/* Heavy diagonal interference */}
                          <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-red-500/20 animate-pulse" style={{ animationDelay: '2.5s' }} />
                          <div className="absolute inset-0 bg-gradient-to-tr from-red-500/15 via-transparent to-red-500/15 animate-pulse" style={{ animationDelay: '3.2s' }} />
                          
                          {/* Chaotic interference patterns */}
                          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-red-500/25 to-red-500/10 animate-pulse" style={{ animationDelay: '1.7s', transform: 'rotate(15deg)' }} />
                          <div className="absolute inset-0 bg-gradient-to-l from-red-500/12 via-red-500/20 to-red-500/12 animate-pulse" style={{ animationDelay: '2.3s', transform: 'rotate(-10deg)' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {generatedContent.linkedin || generatedContent.twitter ? (
                    <div className="space-y-3">
                      {!isEditing ? (
                        <div 
                          className={`whitespace-pre-wrap transition-all duration-200 relative ${
                            complianceStatus && !complianceStatus.isCompliant 
                              ? 'select-none pointer-events-none filter blur-[12px] opacity-15 contrast-300 saturate-300 brightness-200 hue-rotate-30 sepia-50 invert-25 animate-pulse' 
                              : ''
                          }`}
                          style={{
                            ...(complianceStatus && !complianceStatus.isCompliant 
                              ? { 
                                  userSelect: 'none',
                                  WebkitUserSelect: 'none',
                                  MozUserSelect: 'none',
                                  msUserSelect: 'none',
                                  textShadow: '0 0 25px rgba(255, 68, 79, 1), 0 0 50px rgba(255, 68, 79, 0.8), 0 0 75px rgba(255, 68, 79, 0.6), 0 0 100px rgba(255, 68, 79, 0.4)',
                                  letterSpacing: '8px',
                                  wordSpacing: '20px',
                                  lineHeight: '4',
                                  transform: 'skew(-5deg, 3deg) scale(1.2) rotate(1deg)',
                                  filter: 'drop-shadow(5px 5px 10px rgba(255, 68, 79, 0.5)) blur(2px)',
                                  fontWeight: '100',
                                  fontSize: '0.7em',
                                  color: 'transparent',
                                  textStroke: '1px rgba(255, 68, 79, 0.3)',
                                  WebkitTextStroke: '1px rgba(255, 68, 79, 0.3)',
                                  animation: 'textDestroy 3s ease-in-out infinite, chaosInterference 2s linear infinite'
                                } 
                              : {})
                          }}
                          onKeyDown={complianceStatus && !complianceStatus.isCompliant ? handleKeyDown : undefined}
                          onContextMenu={complianceStatus && !complianceStatus.isCompliant ? handleContextMenu : undefined}
                          onMouseDown={complianceStatus && !complianceStatus.isCompliant ? (e: React.MouseEvent) => e.preventDefault() : undefined}
                          onDragStart={complianceStatus && !complianceStatus.isCompliant ? (e: React.DragEvent) => e.preventDefault() : undefined}
                          onDrop={complianceStatus && !complianceStatus.isCompliant ? (e: React.DragEvent) => e.preventDefault() : undefined}
                        >
                          {generatedContent[previewPlatform]}
                        </div>
                      ) : (
                        <textarea
                          value={editedContent[previewPlatform]}
                          onChange={complianceStatus && !complianceStatus.isCompliant ? undefined : (e) => setEditedContent(prev => ({
                            ...prev,
                            [previewPlatform]: e.target.value
                          }))}
                          disabled={!!(complianceStatus && !complianceStatus.isCompliant)}
                          className={`w-full min-h-[150px] bg-transparent border border-white/10 rounded-md p-3 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[#FF444F] focus:border-transparent ${
                            complianceStatus && !complianceStatus.isCompliant 
                              ? 'select-none pointer-events-none filter blur-[12px] opacity-15 contrast-300 saturate-300 brightness-200 hue-rotate-30 sepia-50 invert-25 cursor-not-allowed animate-pulse' 
                              : ''
                          }`}
                          style={{
                            ...(complianceStatus && !complianceStatus.isCompliant 
                              ? { 
                                  userSelect: 'none',
                                  WebkitUserSelect: 'none',
                                  MozUserSelect: 'none',
                                  msUserSelect: 'none',
                                  textShadow: '0 0 25px rgba(255, 68, 79, 1), 0 0 50px rgba(255, 68, 79, 0.8), 0 0 75px rgba(255, 68, 79, 0.6), 0 0 100px rgba(255, 68, 79, 0.4)',
                                  letterSpacing: '8px',
                                  wordSpacing: '20px',
                                  lineHeight: '4',
                                  transform: 'skew(-5deg, 3deg) scale(1.2) rotate(1deg)',
                                  filter: 'drop-shadow(5px 5px 10px rgba(255, 68, 79, 0.5)) blur(2px)',
                                  fontWeight: '100',
                                  fontSize: '0.7em',
                                  color: 'transparent',
                                  textStroke: '1px rgba(255, 68, 79, 0.3)',
                                  WebkitTextStroke: '1px rgba(255, 68, 79, 0.3)',
                                  animation: 'textDestroy 3s ease-in-out infinite, chaosInterference 2s linear infinite'
                                } 
                              : {})
                          }}
                          onKeyDown={complianceStatus && !complianceStatus.isCompliant ? handleKeyDown : undefined}
                          onContextMenu={complianceStatus && !complianceStatus.isCompliant ? handleContextMenu : undefined}
                          onMouseDown={complianceStatus && !complianceStatus.isCompliant ? (e: React.MouseEvent) => e.preventDefault() : undefined}
                          onDragStart={complianceStatus && !complianceStatus.isCompliant ? (e: React.DragEvent) => e.preventDefault() : undefined}
                          onDrop={complianceStatus && !complianceStatus.isCompliant ? (e: React.DragEvent) => e.preventDefault() : undefined}
                          onCopy={complianceStatus && !complianceStatus.isCompliant ? (e: React.ClipboardEvent) => e.preventDefault() : undefined}
                          onCut={complianceStatus && !complianceStatus.isCompliant ? (e: React.ClipboardEvent) => e.preventDefault() : undefined}
                          placeholder={complianceStatus && !complianceStatus.isCompliant ? "Content editing disabled - flagged for compliance" : "Edit your content here..."}
                        />
                      )}
                      
                      {/* Compliance Status */}
                      {complianceStatus && !complianceStatus.isCompliant && (
                        <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                            <span className="font-medium">Content Flagged</span>
                          </div>
                          <p>{complianceStatus.reason}</p>
                          <p className="text-red-300">Please edit your content to remove any direct buy/sell recommendations.</p>
                        </div>
                      )}

                      {/* Edit Mode Controls - Always clear and visible */}
                      {isEditing && (
                        <div 
                          className="flex gap-2 pt-2 border-t border-white/10 relative z-50 bg-gray-900/90 backdrop-blur-sm rounded-md p-2"
                          style={{ 
                            filter: 'none !important',
                            opacity: '1 !important',
                            transform: 'none !important',
                            animation: 'none !important'
                          }}
                        >
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={isCheckingCompliance}
                            className="bg-[#FF444F] hover:bg-[#E63946] text-white shadow-lg border border-[#FF444F]/30 relative z-50"
                            style={{ 
                              filter: 'none !important',
                              opacity: '1 !important',
                              transform: 'none !important',
                              animation: 'none !important'
                            }}
                          >
                            {isCheckingCompliance ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5" />
                                Checking...
                              </>
                            ) : (
                              <>
                                <Save className="h-3 w-3 mr-1.5" />
                                Save Changes
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={isCheckingCompliance}
                            className="border-white/20 hover:bg-white/10 shadow-lg relative z-50"
                            style={{ 
                              filter: 'none !important',
                              opacity: '1 !important',
                              transform: 'none !important',
                              animation: 'none !important'
                            }}
                          >
                            <X className="h-3 w-3 mr-1.5" />
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      {isGenerating ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#FF444F]" />
                          Generating content for both platforms...
                        </div>
                      ) : (
                        'Generated content will appear here. Configure your settings and click "Generate Content" to get started.'
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {(generatedContent.linkedin || generatedContent.twitter) && !isEditing && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      disabled={!!(complianceStatus && !complianceStatus.isCompliant)}
                      className={`${
                        complianceStatus && !complianceStatus.isCompliant
                          ? 'border-gray-500/30 text-gray-500 cursor-not-allowed'
                          : 'border-[#FF444F]/30 text-[#FF444F] hover:bg-[#FF444F]/10'
                      }`}
                      onClick={async () => {
                        if (complianceStatus && !complianceStatus.isCompliant) return
                        
                        try {
                          const contentToCopy = generatedContent[previewPlatform]
                          await navigator.clipboard.writeText(contentToCopy)
                          toast.success(`${previewPlatform === 'linkedin' ? 'LinkedIn' : 'X'} content copied to clipboard!`)
                        } catch (err) {
                          toast.error('Failed to copy content')
                        }
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1.5" />
                      {complianceStatus && !complianceStatus.isCompliant ? 'Copy Disabled' : `Copy ${previewPlatform === 'linkedin' ? 'LinkedIn' : 'X'} Text`}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-white/10 hover:border-white/20"
                      onClick={handleEditContent}
                    >
                      <Edit3 className="h-4 w-4 mr-1.5" />
                      Edit
                    </Button>
                  </div>
                )}

                {/* View News Context Button */}
                {(generatedContent.linkedin || generatedContent.twitter) && (
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <button
                      onClick={fetchNewsContext}
                      disabled={isLoadingContext}
                      className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 underline underline-offset-4 hover:no-underline transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoadingContext ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400" />
                          Loading Context...
                        </>
                      ) : showNewsContext ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Hide News Context
                        </>
                      ) : (
                        <>
                          <Info className="w-4 h-4" />
                          View News Context
                        </>
                      )}
                    </button>

                    {/* News Context Display */}
                    {showNewsContext && newsContext && (
                      <div className="mt-3 p-4 bg-gray-800/50 border border-white/10 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-blue-400" />
                          <h4 className="text-sm font-medium text-blue-400">
                            News Context for: {topics.find(t => t.value === selectedTopic)?.label || selectedTopic}
                          </h4>
                        </div>
                        <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap bg-gray-900/50 p-3 rounded border border-white/5 max-h-60 overflow-y-auto">
                          {newsContext}
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          This context is used by the AI to generate grounded, factual content based on real financial news.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Image Generation Section */}
                {(generatedContent.linkedin || generatedContent.twitter) && (
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-white">AI Image Generation</h4>
                          <p className="text-xs text-muted-foreground">Create custom visuals to enhance your post</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#FF444F]/30 text-[#FF444F] hover:bg-[#FF444F]/10"
                          onClick={() => {
                            if (!includeImageGeneration) {
                              handleShowImageGenerator()
                            } else {
                              setIncludeImageGeneration(false)
                            }
                          }}
                        >
                          <ImageIcon className="h-3 w-3 mr-1.5" />
                          {includeImageGeneration ? 'Hide' : 'Show'} Generator
                        </Button>
                      </div>

                      {includeImageGeneration && (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="image-prompt" className="text-xs">Image Prompt</Label>
                              {hasCustomImagePrompt && generatedContent[previewPlatform] && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs text-muted-foreground hover:text-[#FF444F]"
                                  onClick={() => {
                                    setImagePrompt(generatedContent[previewPlatform])
                                    setHasCustomImagePrompt(false)
                                    toast.success('Image prompt regenerated from content!')
                                  }}
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Reset
                                </Button>
                              )}
                            </div>
                            <Input
                              id="image-prompt"
                              value={imagePrompt}
                              onChange={(e) => {
                                setImagePrompt(e.target.value)
                                setHasCustomImagePrompt(true) // Mark as manually edited
                              }}
                              placeholder={generatedContent[previewPlatform] ? "Auto-generated from your content - edit if needed..." : "Generate content first to auto-populate this field..."}
                              className="dark:bg-input/30 text-sm"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="negative-prompt" className="text-xs">Other prompt <span className="text-muted-foreground">(Optional)</span></Label>
                            <Input
                              id="negative-prompt"
                              value={imageNegativePrompt}
                              onChange={(e) => setImageNegativePrompt(e.target.value)}
                              placeholder="e.g. add specific elements, style modifications, additional details..."
                              className="dark:bg-input/30 text-sm"
                            />
                          </div>

                          <Button
                            onClick={handleGenerateImage}
                            disabled={isGeneratingImage || !imagePrompt.trim()}
                            className="w-full bg-[#FF444F] hover:bg-[#E63946] text-white"
                            size="sm"
                          >
                            {isGeneratingImage ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                                Generating Image...
                              </>
                            ) : (
                              <>
                                <ImageIcon className="h-3 w-3 mr-2" />
                                Generate Image
                              </>
                            )}
                          </Button>

                          {generatedImage && (
                            <div className="space-y-3">
                              <div className="relative bg-card/20 border border-white/10 rounded-lg p-2">
                                <img 
                                  src={generatedImage} 
                                  alt="Generated image" 
                                  className="w-full rounded-lg"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={downloadImage}
                                  size="sm"
                                  className="flex-1 border border-white/20 bg-transparent text-white hover:bg-white/10"
                                >
                                  <Download className="h-3 w-3 mr-2" />
                                  Download
                                </Button>
                                <Button
                                  size="sm"
                                  className="flex-1 border border-white/20 bg-transparent text-white hover:bg-white/10"
                                  onClick={async () => {
                                    try {
                                      // Convert base64 to blob for copying
                                      const response = await fetch(generatedImage)
                                      const blob = await response.blob()
                                      await navigator.clipboard.write([
                                        new ClipboardItem({ [blob.type]: blob })
                                      ])
                                      toast.success('Image copied to clipboard!')
                                    } catch (err) {
                                      toast.error('Failed to copy image')
                                    }
                                  }}
                                >
                                  <Copy className="h-3 w-3 mr-2" />
                                  Copy Image
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
