import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { responses } = await req.json();

    if (!responses) {
      return NextResponse.json({ error: "No responses provided" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    // For demo purposes, we might not have the key, so we can mock if needed, 
    // but assuming you have it set up or want to see the real flow:
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not found. Returning mock data for demo.");
      // Mock data for testing without API key
      const mockData = {
        preferred_product: "Forex, Crypto",
        trading_timeline: "Day Trading",
        experience_level: "Intermediate",
        primary_objective: "Generate Monthly Income",
        primary_challenge: "Execution Discipline",
        coach_profile_summary: "User shows understanding of risk but struggles with emotional execution.",
        risk_factor: "Emotional decision making",
        recommended_focus: "Psychology and automated execution rules",
        raw_onboarding_responses: responses
      };
      return NextResponse.json({ success: true, analysis: mockData });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Prompt specifically designed to extract database columns
    const prompt = `
      Act as a Data Extraction Specialist and Trading Coach.
      
      Input Data (User Responses):
      ${JSON.stringify(responses, null, 2)}

      Your goal is to extract structured data suitable for database insertion and provide a psychological analysis.

      1. **preferred_product**: Extract the main financial instruments (e.g., "Forex", "Crypto", "Stocks"). If multiple, comma separate.
      2. **trading_timeline**: Extract the timeframe (e.g., "Scalping", "Day Trading", "Swing Trading", "Investing").
      3. **experience_level**: Analyze the technical answers (especially the math/risk questions) to determine if they are "Beginner", "Intermediate", or "Advanced".
         - Beginner: Fails math, vague logic, emotional.
         - Intermediate: Understands basic risk, some rules.
         - Advanced: Precise math, expectancy awareness, deep psychological insight.
      4. **primary_objective**: Summarize their goal (e.g., "Income", "Wealth", "Thrill").
      5. **primary_challenge**: Summarize their main hurdle.
      6. **coach_profile_summary**: A 2-sentence psychological profile of the trader.
      7. **risk_factor**: The biggest risk detected in their answers.
      8. **recommended_focus**: One short phrase for what they should study next.

      Return ONLY valid JSON with no markdown formatting:
      {
        "preferred_product": "string",
        "trading_timeline": "string",
        "experience_level": "string",
        "primary_objective": "string",
        "primary_challenge": "string",
        "coach_profile_summary": "string",
        "risk_factor": "string",
        "recommended_focus": "string"
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().replace(/```json|```/g, "").trim();
    
    let data;
    try {
        data = JSON.parse(responseText);
    } catch (e) {
        console.error("Failed to parse Gemini response", responseText);
        return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // Database insertion skipped as per instruction.
    // We are just returning the processed data.
    
    // Append raw responses for complete record visualization
    const finalPayload = {
        ...data,
        raw_onboarding_responses: responses
    };

    console.log("Processed Data for Database:", finalPayload);

    return NextResponse.json({ success: true, analysis: finalPayload });

  } catch (error) {
    console.error("Onboarding processing error:", error);
    return NextResponse.json({ error: "Failed to process onboarding" }, { status: 500 });
  }
}