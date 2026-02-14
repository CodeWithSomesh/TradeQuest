import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface QuestGenerationRequest {
    questId: number;
    questTitle: string;
    userProfile?: {
        tradingStyle?: string;
        riskTolerance?: string;
        instruments?: string[];
        learningStyle?: string;
        learningGoals?: string;
    };
}

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

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
    try {
        const body: QuestGenerationRequest = await request.json();
        const { questId, questTitle, userProfile } = body;

        if (!questTitle) {
            return NextResponse.json(
                { message: "Quest title is required" },
                { status: 400 }
            );
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { message: "Gemini API key not configured" },
                { status: 500 }
            );
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        // Build personalization context
        const profileContext = userProfile
            ? `
User Profile:
- Preferred Trading Style: ${userProfile.tradingStyle || "Not specified"}
- Risk Tolerance: ${userProfile.riskTolerance || "Not specified"}
- Preferred Instruments: ${(userProfile.instruments || []).join(", ") || "Not specified"}
- Learning Style: ${userProfile.learningStyle || "Not specified"}
- Learning Goals: ${userProfile.learningGoals || "Not specified"}
      `
            : "";

        const prompt = `You are an expert trading educator. Generate 5 interactive questions for a trading quest titled "${questTitle}".

${profileContext}

IMPORTANT REQUIREMENTS:
1. Create 5 realistic, SHORT trading scenarios (1-3 sentences max)
2. Each scenario should be a trading situation the user might encounter
3. Personalize based on the user's trading style, risk tolerance, and preferred instruments
4. Each question has exactly 3 multiple choice answers (keep options concise - 1 line each)
5. Only ONE answer should be correct
6. Explanations should be brief (2-3 sentences max) but educational
7. Focus on practical trading decisions
8. Questions should progress in difficulty

CONCISENESS RULES:
- Story/scenario: Maximum 3 sentences
- Answer options: 1-2 lines each
- Explanations: 2-3 lines maximum

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "pages": [
    {
      "id": "quest-${questId}-page-1",
      "title": "Short Title",
      "story": "1-2 sentence trading scenario",
      "answers": [
        {
          "id": "q1-a",
          "text": "Brief option (one line)",
          "isCorrect": true,
          "explanation": "2-3 sentence explanation of why this is correct"
        },
        {
          "id": "q1-b",
          "text": "Brief option (one line)",
          "isCorrect": false,
          "explanation": "2-3 sentence explanation of why this is incorrect"
        },
        {
          "id": "q1-c",
          "text": "Brief option (one line)",
          "isCorrect": false,
          "explanation": "2-3 sentence explanation of why this is incorrect"
        }
      ]
    }
    // ... repeat for pages 2-5
  ]
}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse JSON response
        let questData: { pages: QuestPage[] };
        try {
            questData = JSON.parse(responseText);
        } catch {
            // Try to extract JSON from markdown code blocks if present
            const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                questData = JSON.parse(jsonMatch[1]);
            } else {
                throw new Error("Invalid response format from Gemini");
            }
        }

        // Validate response structure
        if (!questData.pages || !Array.isArray(questData.pages) || questData.pages.length !== 5) {
            throw new Error("Response does not contain exactly 5 pages");
        }

        return NextResponse.json(questData);
    } catch (error) {
        console.error("Quest generation error:", error);
        return NextResponse.json(
            {
                message:
                    error instanceof Error ? error.message : "Failed to generate quest",
            },
            { status: 500 }
        );
    }
}
