/**
 * lib/ai-provider.ts
 * Shared AI model factory with Gemini → OpenAI fallback.
 * Priority: GEMINI_API_KEY → OPENAI_API_KEY → null (fallback data)
 *
 * All API routes import this instead of directly importing provider SDKs,
 * so adding a new provider only requires changing this one file.
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import type { LanguageModel } from 'ai'

type AIProvider = 'gemini' | 'openai'

type AIModelResult = {
  model: LanguageModel
  provider: AIProvider
}

/**
 * Returns the best available AI model.
 * Prefers Gemini 2.0 Flash; falls back to GPT-4o-mini if only OpenAI key is set.
 * Returns null if no API key is configured (caller should use fallback data).
 */
export function getAIModel(): AIModelResult | null {
  if (process.env.GEMINI_API_KEY) {
    const genAI = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })
    return { model: genAI('gemini-2.5-flash'), provider: 'gemini' }
  }

  if (process.env.OPENAI_API_KEY) {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
    return { model: openai('gpt-4o-mini'), provider: 'openai' }
  }

  return null
}

/** True if any AI key is configured */
export function hasAIKey(): boolean {
  return !!(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY)
}
