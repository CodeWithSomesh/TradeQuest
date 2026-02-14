import { NextRequest, NextResponse } from 'next/server'

// Alternative Z-Image implementation using fal-ai directly
// This requires a fal-ai API key: https://fal.ai/
export async function POST(request: NextRequest) {
  try {
    const { prompt, negativePrompt, width = 1024, height = 1024 } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (!process.env.FAL_KEY) {
      return NextResponse.json({ 
        error: 'Fal-ai API key not configured. Add FAL_KEY to your environment variables.' 
      }, { status: 500 })
    }

    console.log('Generating image with Z-Image via fal-ai:', prompt)

    const response = await fetch('https://fal.run/fal-ai/z-image', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        negative_prompt: negativePrompt || "",
        width: Math.min(width, 2048),
        height: Math.min(height, 2048),
        guidance_scale: 4.0,
        num_inference_steps: 28,
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Fal-ai API error: ${errorText}`)
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      imageUrl: data.images[0].url, // fal-ai returns image URLs
      prompt,
      negativePrompt,
      width,
      height,
      model: 'Z-Image via fal-ai'
    })

  } catch (error: any) {
    console.error('Error generating Z-Image:', error)
    
    return NextResponse.json({ 
      error: 'Failed to generate image with Z-Image. Please try the standard endpoint instead.' 
    }, { status: 500 })
  }
}

// GET endpoint to check fal-ai Z-Image availability
export async function GET() {
  return NextResponse.json({ 
    message: 'Z-Image Generation API (fal-ai provider)',
    model: 'fal-ai/z-image',
    status: process.env.FAL_KEY ? 'configured' : 'missing-api-key',
    setup: 'Requires FAL_KEY environment variable from https://fal.ai/'
  })
}