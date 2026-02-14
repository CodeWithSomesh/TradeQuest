import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { responses } = await req.json();

    if (!responses) {
      return NextResponse.json({ error: "No responses provided" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    // Resilience: Fallback to Demo Data if API Key is missing
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not found. Returning mock data for demo.");
      const mockData = {
        preferred_product: "Forex, Crypto",
        trading_timeline: "Day Trading",
        experience_level: "Intermediate",
        primary_objective: "Generate Monthly Income",
        primary_challenge: "Execution Discipline",
        coach_profile_summary: "User shows understanding of risk but struggles with emotional execution.",
        risk_factor: "Emotional decision making",
        recommended_focus: "Psychology and automated execution rules",
      };
      
      return NextResponse.json({ 
        success: true, 
        analysis: { ...mockData, raw_onboarding_responses: responses },
        userId: "demo-user-id" // Mock ID for demo
      });
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
    
    let analysis;
    try {
        // Robust JSON extraction
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found");
        analysis = JSON.parse(jsonMatch[0]);
    } catch (e) {
        console.error("Failed to parse Gemini response", responseText);
        return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // --- Database Insertion Logic ---
    // Try to create an auth-aware server client first (binds cookies)
    let supabase: any = null;
    try {
      supabase = await createServerClient();
    } catch (e) {
      console.warn('createServerClient failed, will attempt fallback client', e);
    }

    // Fallback: create a server-side client using server env keys (service role or anon)
    if (!supabase) {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase environment variables for fallback client');
        return NextResponse.json({ error: 'Supabase env vars missing' }, { status: 500 });
      }
      supabase = createSupabaseClient(supabaseUrl, supabaseKey);
    }

    // Attempt to get current user (may not work with service role fallback)
    let userId = 'anonymous';
    try {
      const maybeUser = await supabase.auth.getUser();
      if (maybeUser?.data?.user) {
        userId = maybeUser.data.user.id;
      }
    } catch (e) {
      console.warn('supabase.auth.getUser() failed; proceeding without authenticated user', e);
    }

    // If user is authenticated, upsert into profiles. Otherwise insert into onboarding_responses table.
    try {
      if (userId !== 'anonymous') {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            full_name: responses.name || null,
            preferred_product: analysis.preferred_product,
            trading_timeline: analysis.trading_timeline,
            experience_level: analysis.experience_level,
            primary_objective: analysis.primary_objective,
            primary_challenge: analysis.primary_challenge,
            coach_profile_summary: analysis.coach_profile_summary,
            risk_factor: analysis.risk_factor,
            recommended_focus: analysis.recommended_focus,
            raw_onboarding_responses: responses,
            updated_at: new Date().toISOString(),
          });

        if (error) {
          console.error('Supabase upsert error:', error);
        }
      } else {
        // anonymous: write a record to onboarding_responses so data is persisted
        const { data: insertData, error: insertError } = await supabase
          .from('onboarding_responses')
          .insert([{ 
            user_id: null,
            full_name: responses.name || null,
            preferred_product: analysis.preferred_product,
            trading_timeline: analysis.trading_timeline,
            experience_level: analysis.experience_level,
            primary_objective: analysis.primary_objective,
            primary_challenge: analysis.primary_challenge,
            coach_profile_summary: analysis.coach_profile_summary,
            risk_factor: analysis.risk_factor,
            recommended_focus: analysis.recommended_focus,
            raw_onboarding_responses: responses,
            created_at: new Date().toISOString(),
          }]);

        if (insertError) {
          console.error('Supabase insert error (anonymous):', insertError);
        } else {
          // If insert returns an id-like reference, try to attach it
          if (insertData && Array.isArray(insertData) && insertData[0]?.id) {
            userId = `anon:${insertData[0].id}`;
          }
        }
      }
    } catch (e) {
      console.error('Error writing onboarding data to Supabase:', e);
    }

    // Append raw responses for complete record visualization in frontend
    const finalPayload = {
        ...analysis,
        raw_onboarding_responses: responses
    };

    return NextResponse.json({ success: true, analysis: finalPayload, userId });

  } catch (error) {
    console.error("Onboarding processing error:", error);
    return NextResponse.json({ error: "Failed to process onboarding" }, { status: 500 });
  }
}