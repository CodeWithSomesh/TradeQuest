import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { HfInference } from '@huggingface/inference'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
const hf = new HfInference(process.env.HUGGING_FACE_API_KEY)

// Gemini text model to craft an image prompt
// Note: `gemini-2.5-flash` is text-only (cannot return IMAGE parts).
const GEMINI_PROMPT_MODEL = 'gemini-2.5-flash'

// HF fallback (nscale provider observed working in logs)
const HF_FALLBACK_MODEL = 'stabilityai/stable-diffusion-xl-base-1.0'

function buildFullPrompt(prompt: string, otherPrompt?: string) {
  const p = String(prompt ?? '').trim()
  const o = String(otherPrompt ?? '').trim()
  return o ? `${p}\n\nOther prompt:\n${o}` : p
}

async function hfResponseToBase64DataUrl(result: any) {
  const arrayBuffer: ArrayBuffer =
    result instanceof ArrayBuffer
      ? result
      : typeof result?.arrayBuffer === 'function'
        ? await result.arrayBuffer()
        : ArrayBuffer.isView(result)
          ? result.buffer
          : (() => {
              throw new Error('Unexpected image response type from Hugging Face inference')
            })()

  const base64 = Buffer.from(arrayBuffer).toString('base64')
  return `data:image/png;base64,${base64}`
}

async function rewriteToImagePromptWithGemini(sourceText: string) {
  const response = await ai.models.generateContent({
    model: GEMINI_PROMPT_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: [
              'Convert the following social post into a high-quality text-to-image prompt for Stable Diffusion XL (SDXL).',
              '',
              'Rules:',
              '- Output ONLY the final prompt text (no quotes, no markdown, no bullet points).',
              '- The content will usually be finance-related; default to a finance visual language unless clearly not relevant.',
              '- Prefer FINANCIAL DIAGRAM / INFOGRAPHIC / DASHBOARD visuals: trading-terminal style UI, macro dashboard, line charts, candlesticks, heatmaps, correlation matrices, network graphs, risk gauge, volatility surface shapes, economic indicator panels (unlabeled), map overlays, data streams.',
              '- Avoid generating any readable text in the image (no captions, no logos, no tickers, no brand names, no watermarks). Unlabeled axes and abstract UI glyphs are OK.',
              '- Make the image impactful, insightful, creative, and innovative (use strong visual metaphors that still look like finance/markets).',
              '- Prefer clean modern composition, high detail, cinematic lighting, high contrast, premium editorial look.',
              '- Include clear subject, setting, mood, color palette, camera/shot type, and 3–6 strong visual elements.',
              '- If the post is abstract (macro, psychology, sentiment), express it as a premium finance infographic with symbolic chart elements rather than pure abstract art.',
              '- DO NOT mention “Stable Diffusion”, “SDXL”, “prompt”, or any meta instructions.',
              '',
              'Social post:',
              sourceText,
            ].join('\n'),
          },
        ],
      },
    ],
  })

  const parts: any[] = response?.candidates?.[0]?.content?.parts ?? []
  const text = parts.map((p) => p?.text).filter(Boolean).join('\n').trim()
  if (!text) throw new Error('Gemini returned empty image prompt text')
  return text
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, negativePrompt: otherPrompt, width = 1024, height = 1024 } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const combinedPrompt = buildFullPrompt(prompt, otherPrompt)

    console.log('Generating image with prompt:', combinedPrompt)

    // 1) Use Gemini (text-only) to craft an SDXL prompt (optional)
    let promptForImage = combinedPrompt
    if (process.env.GEMINI_API_KEY) {
      try {
        console.log('Trying Gemini prompt model:', GEMINI_PROMPT_MODEL)
        promptForImage = await rewriteToImagePromptWithGemini(combinedPrompt)
        console.log('✓ Gemini crafted image prompt (start)')
        console.log(promptForImage)
        console.log('✓ Gemini crafted image prompt (end)')
      } catch (geminiErr: any) {
        console.warn('Gemini prompt crafting failed, continuing with raw content:', geminiErr?.message)
        promptForImage = combinedPrompt
      }
    }

    // 2) Generate the image via Hugging Face (nscale) SDXL
    if (!process.env.HUGGING_FACE_API_KEY) {
      return NextResponse.json(
        {
          error: 'Hugging Face API key not configured for image generation.',
          details:
            'Set HUGGING_FACE_API_KEY to enable fallback with stabilityai/stable-diffusion-xl-base-1.0 (nscale provider).',
        },
        { status: 503 }
      )
    }

    console.log('Trying HF fallback model:', HF_FALLBACK_MODEL)

    const hfResult = await hf.textToImage({
      model: HF_FALLBACK_MODEL,
      inputs: promptForImage,
      parameters: {
        width: Math.min(Number(width) || 1024, 1024),
        height: Math.min(Number(height) || 1024, 1024),
        guidance_scale: 7.5,
        num_inference_steps: 30,
      },
    })

    const imageUrl = await hfResponseToBase64DataUrl(hfResult as any)

    console.log('✓ Success with HF fallback model:', HF_FALLBACK_MODEL)

    return NextResponse.json({
      success: true,
      imageUrl,
      prompt,
      otherPrompt,
      promptForImage,
      width,
      height,
      modelUsed: HF_FALLBACK_MODEL,
      provider: 'Hugging Face (nscale auto-selected)',
    })

  } catch (error: any) {
    console.error('Error generating image:', error)
    
    // Handle different types of errors
    if (error.message?.includes('rate limit')) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded. Please try again later.' 
      }, { status: 429 })
    }
    
    if (error.message?.includes('unauthorized')) {
      return NextResponse.json({ 
        error: 'Invalid API key. Please check your Gemini/Hugging Face configuration.'
      }, { status: 401 })
    }

    return NextResponse.json({ 
      error: 'Failed to generate image. Please try again.',
      details: error.message 
    }, { status: 500 })
  }
}

// GET endpoint to check API health
export async function GET() {
  return NextResponse.json({ 
    message: 'Image Generation API is running',
    primary: {
      model: GEMINI_PROMPT_MODEL,
      provider: 'Gemini (prompt crafting)',
      status: process.env.GEMINI_API_KEY ? 'configured' : 'missing-api-key',
    },
    fallback: {
      model: HF_FALLBACK_MODEL,
      provider: 'Hugging Face (nscale auto-selected)',
      status: process.env.HUGGING_FACE_API_KEY ? 'configured' : 'missing-api-key',
    },
    note: 'Gemini crafts the prompt (text-only), HF SDXL (nscale) generates the image.'
  })
}