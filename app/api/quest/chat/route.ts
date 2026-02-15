import { generateText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { getAIModel } from '@/lib/ai-provider'

interface ChatRequest {
  questId?: number
  questTitle: string
  question: string
  selectedAnswers: Record<string, string>
  pages: Array<{
    id: string
    title: string
    story: string
    answers: Array<{
      id: string
      text: string
      isCorrect: boolean
      explanation: string
    }>
  }>
  previousMessages: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { questTitle, question, selectedAnswers, pages, previousMessages } = body

    if (!question?.trim()) {
      return NextResponse.json({ message: 'Question is required' }, { status: 400 })
    }

    const aiModel = getAIModel()
    if (!aiModel) {
      return NextResponse.json({ message: 'No AI API key configured. Add GEMINI_API_KEY or OPENAI_API_KEY to .env.local.' }, { status: 500 })
    }

    // Build assessment context
    const assessmentContext = pages
      .map((page) => {
        const selectedAnswerId = selectedAnswers[page.id]
        const userAnswer = page.answers.find((a) => a.id === selectedAnswerId)
        const correctAnswer = page.answers.find((a) => a.isCorrect)
        return `Q: ${page.title}\n${page.story}\nUser selected: ${userAnswer?.text || 'Not answered'}\nCorrect answer: ${correctAnswer?.text || 'Unknown'}\nExplanation: ${correctAnswer?.explanation || ''}`
      })
      .join('\n\n')

    // Build conversation history for context
    const historyText = previousMessages
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n')

    const { text } = await generateText({
      model: aiModel.model,
      prompt: `You are an expert trading assessment analyst and educational coach. Help the user understand their assessment results and trading concepts.

STRICT RULES:
1. ONLY discuss the quiz assessment, trading concepts, and explanations for the answers
2. NEVER provide trading signals, buy/sell recommendations, or market predictions
3. Keep responses focused on why answers are correct/incorrect and related trading principles
4. Be educational, supportive, and encouraging
5. If asked something unrelated, politely redirect to the assessment topic

ASSESSMENT CONTEXT — Quest: ${questTitle}
${assessmentContext}

${historyText ? `CONVERSATION HISTORY:\n${historyText}\n` : ''}
User's current question: ${question}

Provide a helpful, educational response about the assessment content.`,
    })

    return NextResponse.json({ message: text })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to process your question' },
      { status: 500 }
    )
  }
}
