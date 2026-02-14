import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface ChatRequest {
    questId: number;
    questTitle: string;
    question: string;
    selectedAnswers: Record<string, string>;
    pages: Array<{
        id: string;
        title: string;
        story: string;
        answers: Array<{
            id: string;
            text: string;
            isCorrect: boolean;
            explanation: string;
        }>;
    }>;
    previousMessages: Array<{
        role: "user" | "assistant";
        content: string;
    }>;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
    try {
        const body: ChatRequest = await request.json();
        const { questTitle, question, selectedAnswers, pages, previousMessages } = body;

        if (!question?.trim()) {
            return NextResponse.json(
                { message: "Question is required" },
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

        // Build context about the assessment
        const assessmentContext = pages
            .map((page) => {
                const selectedAnswerId = selectedAnswers[page.id];
                const answer = page.answers.find((a) => a.id === selectedAnswerId);
                return `Q: ${page.title}\n${page.story}\nSelected: ${answer?.text || "Not answered"}\nCorrect Answer: ${page.answers.find((a) => a.isCorrect)?.text || "Unknown"}`;
            })
            .join("\n\n");

        const systemPrompt = `You are an expert trading assessment analyst and educational coach. Your role is to help users understand their assessment results and trading concepts.

STRICT RULES:
1. ONLY discuss the quiz assessment, trading concepts, and explanations for the answers
2. NEVER provide trading signals, buy/sell recommendations, or market predictions
3. NEVER discuss topics outside of trading education and this specific assessment
4. Keep responses focused on why answers are correct/incorrect and related trading principles
5. Be educational, supportive, and encouraging
6. Use the assessment context to provide personalized insights
7. If asked about something unrelated, politely redirect to the assessment

ASSESSMENT CONTEXT - Quest: ${questTitle}
${assessmentContext}

Previous conversation history is provided to maintain context. Use it to understand what has been discussed.`;

        // Format conversation history for the model
        const conversationHistory = previousMessages.map((msg) => ({
            role: msg.role,
            parts: [{ text: msg.content }],
        }));

        // Add the current user question
        conversationHistory.push({
            role: "user",
            parts: [{ text: question }],
        });

        const chat = model.startChat({
            systemInstruction: systemPrompt,
            history: conversationHistory.slice(0, -1), // All but the last message (which will be sent as new message)
        });

        const result = await chat.sendMessage(question);
        const responseText = result.response.text();

        return NextResponse.json({
            message: responseText,
        });
    } catch (error) {
        console.error("Chat error:", error);
        return NextResponse.json(
            {
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to process your question",
            },
            { status: 500 }
        );
    }
}
