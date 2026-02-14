import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // 1. SAFE LOGGING: Check environment variables immediately
  console.log("🔍 [API] Starting Onboarding Process...");
  console.log("   - Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Loaded" : "❌ MISSING");
  console.log("   - Supabase Key:", process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? "✅ Loaded" : "❌ MISSING");
  console.log("   - Gemini Key:", process.env.GEMINI_API_KEY ? "✅ Loaded" : "❌ MISSING");

  try {
    // 2. Parse Request Body
    let body;
    try {
        body = await req.json();
    } catch (e) {
        throw new Error("Invalid JSON in request body");
    }
    const { responses } = body;

    // 3. Run Gemini Analysis
    const apiKey = process.env.GEMINI_API_KEY;
    let analysis;

    if (!apiKey) {
      console.warn("⚠️ [API] No Gemini Key found. Using Mock Data.");
      analysis = {
        preferred_product: "Forex, Crypto",
        trading_timeline: "Day Trading",
        experience_level: "Intermediate",
        primary_objective: "Income",
        primary_challenge: "Discipline",
        coach_profile_summary: "Shows potential but lacks consistency.",
        risk_factor: "Emotional Execution",
        recommended_focus: "Systematic Rule Implementation"
      };
    } else {
      console.log("🤖 [API] Calling Gemini...");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Updated to 2.0-flash which is more stable
      
      const prompt = `
        Act as a Trading Coach. Extract data from these responses: ${JSON.stringify(responses)}
        Return JSON only:
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
      const text = result.response.text().replace(/```json|```/g, "").trim();
      
      try {
        analysis = JSON.parse(text);
      } catch (e) {
        console.error("❌ [API] Gemini returned invalid JSON:", text);
        throw new Error("Failed to parse AI response");
      }
    }

    // 4. Connect to Supabase
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase Environment Variables are missing. Check .env.local");
    }
    
    // Create client safely
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 5. Insert into Database
    console.log("💾 [API] Inserting into Supabase...");
    
    // Attempt to get user (optional, don't crash if fails)
    let userId = null;
    try {
        // Just leave null for now to simplify debugging
    } catch (e) {}

    const { data, error } = await supabase
      .from('user_profiles')
      .insert([{ 
        user_id: userId,
        full_name: responses.name || "Anonymous Trader",
        preferred_product: analysis.preferred_product,
        trading_timeline: analysis.trading_timeline,
        experience_level: analysis.experience_level,
        primary_objective: analysis.primary_objective,
        primary_challenge: analysis.primary_challenge,
        coach_profile_summary: analysis.coach_profile_summary,
        risk_factor: analysis.risk_factor,
        recommended_focus: analysis.recommended_focus,
        raw_onboarding_responses: responses
      }])
      .select()
      .single();

    if (error) {
      console.error("❌ [API] Supabase Insert Error:", error);
      // Return 200 with success:false so frontend can handle it gracefully instead of crashing
      return NextResponse.json({ success: false, error: error.message, details: error });
    }

    console.log("✅ [API] Success! DB ID:", data.id);
    return NextResponse.json({ 
        success: true, 
        analysis, 
        dbId: data.id 
    });

  } catch (error: any) {
    console.error("🔥 [API] CRITICAL SERVER CRASH:", error);
    // Return 500 but with JSON body so frontend 'fetch' doesn't die silently
    return NextResponse.json({ 
        success: false, 
        error: error.message || "Unknown Server Error",
        stack: error.stack 
    }, { status: 500 });
  }
}