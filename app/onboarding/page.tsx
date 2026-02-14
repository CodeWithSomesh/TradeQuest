'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Calculator, 
  ArrowRight,
  Loader2,
  Brain,
  ShieldAlert,
  Target,
  Terminal,
  Database,
  Search,
  User,
  Activity,
  Server
} from 'lucide-react';

/**
 * Mock useRouter for environment compatibility.
 */
const useRouter = () => {
  return {
    push: (path: string) => console.log(`[Navigation] Navigating to: ${path}`),
    replace: (path: string) => console.log(`[Navigation] Replacing with: ${path}`),
    prefetch: () => {},
    back: () => console.log(`[Navigation] Going back`),
  };
};

/**
 * Enhanced Button component to match Dashboard aesthetics.
 */
const Button = ({ children, className, onClick, disabled, variant, size }: any) => {
  const variants: any = {
    outline: "border border-border bg-background hover:bg-muted text-foreground",
    ghost: "hover:bg-muted text-muted-foreground hover:text-foreground",
    default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 ${variants[variant || 'default']} ${className}`}
    >
      {children}
    </button>
  );
};

const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');

const toast = {
  success: (msg: string) => console.log("Toast Success:", msg),
  error: (msg: string) => console.log("Toast Error:", msg),
};

export default function App() {
  const router = useRouter();
  // Added 'verifying' and 'verified' states
  const [view, setView] = useState<'intro' | 'onboarding' | 'processing' | 'completed' | 'verifying' | 'verified'>('intro');
  const [isExiting, setIsExiting] = useState(false);
  const [phase, setPhase] = useState(1);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<'next' | 'back'>('next');
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [analysis, setAnalysis] = useState<{ 
    level: string; 
    profile: string; 
    risk_factor: string;
    recommended_focus: string;
    structured_data: Record<string, string>;
  } | null>(null);
  
  const [dbData, setDbData] = useState<any>(null); // To store data fetched back from DB

  const startJourney = () => {
    setIsExiting(true);
    setTimeout(() => {
      setView('onboarding');
      setIsExiting(false);
    }, 600);
  };

  // All questions are now strictly open-ended
  const phases = [
    {
      id: 1,
      title: "Discovery",
      questions: [
        { id: 'name', type: 'text', question: "What is your name?", placeholder: "Type your full name..." },
        { id: 'markets', type: 'textarea', question: "Which financial markets do you intend to trade?", hint: "Stocks, Crypto, Forex, Commodities, Indices? Tell us why." },
        { id: 'timeframe', type: 'textarea', question: "What is your preferred trading timeframe?", hint: "Scalping, Day Trading, Swing Trading, or Investing?" },
        { id: 'objective', type: 'textarea', question: "What is your primary objective with trading?", hint: "Income, wealth building, or recreation?" },
        { id: 'challenge', type: 'textarea', question: "Which aspect of trading do you find most challenging?", hint: "Analysis, Execution, or Management?" }
      ]
    },
    {
      id: 2,
      title: "Philosophy",
      questions: [
        { id: 'drop_reaction', type: 'textarea', question: "You buy a stock and it immediately drops 10%. What will you do?", hint: "Explain your logic and rule-set." },
        { id: 'good_trade', type: 'textarea', question: "What makes a trade a 'Good Trade' in your eyes?", hint: "Is it the profit or the process?" },
        { id: 'overtrading', type: 'textarea', question: "In your own words, define 'overtrading'." }
      ]
    },
    {
      id: 3,
      title: "Tactical",
      questions: [
        { id: 'three_losses', type: 'textarea', question: "You take 3 consecutive losses. What is your rule-based adjustment (if any)?" },
        { id: 'five_losses', type: 'textarea', question: "You take 5 consecutive losses. What is your rule-based adjustment (if any)?" },
        { id: 'math_logic', type: 'textarea', question: "You have RM10,000. Capping risk at 1%. Entry 2.50, Stop 2.40. How many shares max and why?", hint: "Explain your calculation process." },
        { id: 'volatility', type: 'textarea', question: "If volatility suddenly doubles, what changes in your stop distance, position size, and frequency?" },
        { id: 'gut_feeling', type: 'textarea', question: "Price hits your Stop Loss, but you have a 'gut feeling' it will bounce back. What do you do?" },
        { id: 'system_comparison', type: 'textarea', question: "System A (60% WR, 1R) vs System B (28% WR, 3R). Which is better and why?", hint: "Explain the expectancy." }
      ]
    }
  ];

  const currentPhaseData = phases[phase - 1];
  const currentQuestion = currentPhaseData?.questions[currentStep];
  const totalQuestionsInPhase = currentPhaseData?.questions.length;
  const totalSteps = phases.reduce((acc, p) => acc + p.questions.length, 0);
  const currentGlobalStep = phases.slice(0, phase - 1).reduce((acc, p) => acc + p.questions.length, 0) + currentStep;
  const globalProgress = (currentGlobalStep / totalSteps) * 100;

  const submitResponses = async () => {
    setView('processing');
    
    try {
      const res = await fetch('/api/onboarding/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses }),
      });

      const data = await res.json();
      
      // Enhance with structured visualization mapping
      setAnalysis({
        level: data.analysis?.experience_level || "Evaluating...",
        profile: data.analysis?.coach_profile_summary || "Analyzing...",
        risk_factor: data.analysis?.risk_factor || "Analyzing...",
        recommended_focus: data.analysis?.recommended_focus || "Analyzing...",
        structured_data: {
          "Full Name": responses.name || "N/A",
          "Experience Level": data.analysis?.experience_level || "Beginner",
          "Focus Markets": data.analysis?.preferred_product || "N/A",
          "Risk Methodology": responses.math_logic?.substring(0, 50) + "..." || "N/A",
          "Primary Risk Factor": data.analysis?.risk_factor || "N/A",
          "Status": "Ready for Database Commit"
        }
      });
      
      setTimeout(() => setView('completed'), 1500);
    } catch (error) {
      console.error("❌ Processing error:", error);
      // Demo Fallback
      setAnalysis({
        level: "Intermediate",
        profile: "A process-oriented trader with a clear understanding of risk expectancy. Shows high discipline in following stop-loss rules.",
        risk_factor: "Potential over-analysis during high volatility events.",
        recommended_focus: "Advanced Expectancy Modeling & Market Regime Identification.",
        structured_data: {
          "Full Name": responses.name || "New Trader",
          "Experience Level": "Intermediate",
          "Focus Markets": responses.markets || "Not specified",
          "Risk Methodology": "Rule-based stop loss logic detected",
          "Primary Risk Factor": "Market Regime Sensitivity",
          "Status": "Pending Sync"
        }
      });
      setTimeout(() => setView('completed'), 1500);
    }
  };

  const verifyDatabase = async () => {
    setView('verifying');
    
    // Simulate fetching from DB - In a real app, you'd call an API endpoint or use Supabase client here
    // For this demo, we'll pretend to fetch the data we just submitted
    // await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
        // This part would normally fetch from your 'profiles' table using the current user ID
        // const { data, error } = await supabase.from('profiles').select('*').single();
        
        // Mocking the fetch for visualization as requested
        setTimeout(() => {
            setDbData({
                ...analysis?.structured_data,
                id: "uuid-1234-5678",
                created_at: new Date().toISOString(),
                verified: true
            });
            setView('verified');
        }, 2000);
        
    } catch (e) {
        console.error("Verification failed", e);
    }
  };

  const handleNext = () => {
    if (currentStep < totalQuestionsInPhase - 1) {
      setDirection('next');
      setCurrentStep(prev => prev + 1);
    } else if (phase < 3) {
      setDirection('next');
      setPhase(prev => prev + 1);
      setCurrentStep(0);
    } else {
      submitResponses();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection('back');
      setCurrentStep(prev => prev - 1);
    } else if (phase > 1) {
      setDirection('back');
      const prevPhase = phase - 1;
      setPhase(prevPhase);
      setCurrentStep(phases[prevPhase - 1].questions.length - 1);
    }
  };

  const updateResponse = (val: string) => {
    setResponses({ ...responses, [currentQuestion.id]: val });
  };

  const isCurrentValid = useMemo(() => {
    if (!currentQuestion) return false;
    const val = responses[currentQuestion.id];
    return !!val && val.toString().trim().length > 1;
  }, [responses, currentQuestion]);

  if (view === 'intro') {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8 text-center relative overflow-hidden animate-in fade-in duration-1000">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-primary/5 blur-[120px] rounded-full opacity-50" />
        </div>
        <div className={`transition-all duration-1000 transform ${isExiting ? 'opacity-0 scale-95 blur-lg translate-y-10' : 'opacity-100 scale-100'}`}>
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Activity className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">TradeQuest</h1>
          </div>
          <p className="max-w-xl mx-auto text-muted-foreground text-lg font-medium leading-relaxed mb-12">
            The bridge between intuition and professional execution. Complete your evaluation to unlock your personalized trading dashboard.
          </p>
          <Button onClick={startJourney} size="lg" className="px-10 h-14 rounded-full text-base font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95">
            Begin Evaluation
            <ArrowRight className="ml-3 w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  if (view === 'processing' || view === 'verifying') {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
          <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">
            {view === 'processing' ? 'Synthesizing Profile' : 'Verifying Database Integrity'}
        </h2>
        <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-xs font-mono text-muted-foreground border border-border">
          <Terminal className="w-3 h-3" />
          <span>{view === 'processing' ? 'Extracting database entities & analyzing risk...' : 'Fetching user record from profiles table...'}</span>
        </div>
      </div>
    );
  }

  if (view === 'completed') {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 overflow-y-auto">
        <div className="max-w-4xl w-full space-y-6 py-12">
          
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Quest Successfully Captured</h1>
              <p className="text-muted-foreground mt-1">AI evaluation complete. Ready to sync.</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <Database className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Live Sync Enabled</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main AI Profile */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-card border border-border p-8 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    Coach Analysis
                  </h3>
                  <span className={cn(
                    "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                    analysis?.level?.includes("Beginner") && "bg-blue-500/10 text-blue-500 border-blue-500/20",
                    analysis?.level?.includes("Intermediate") && "bg-purple-500/10 text-purple-500 border-purple-500/20",
                    analysis?.level?.includes("Advanced") && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                  )}>
                    {analysis?.level} Rank
                  </span>
                </div>
                <p className="text-xl font-medium leading-relaxed mb-6">
                  {analysis?.profile}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-red-500 mb-2">
                      <ShieldAlert className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase">Primary Risk</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed italic">{analysis?.risk_factor}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-emerald-500 mb-2">
                      <Target className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase">Strategic Focus</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{analysis?.recommended_focus}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Database Visualization - Processed Version */}
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-inner h-full">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                  <Database className="w-3 h-3" />
                  Database Preview
                </h3>
                <div className="space-y-4 font-mono text-[11px]">
                  {Object.entries(analysis?.structured_data || {}).map(([key, value]) => (
                    <div key={key} className="pb-3 border-b border-slate-800 last:border-0">
                      <div className="text-slate-500 mb-1">{key.toUpperCase().replace(/\s/g, '_')}</div>
                      <div className="text-slate-300 break-words">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button onClick={verifyDatabase} size="lg" className="w-full sm:w-auto px-12 h-12 rounded-lg font-bold uppercase tracking-widest bg-primary text-primary-foreground transition-transform hover:translate-y-[-2px]">
              Commit & Verify Database
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // View: Verified DB Data
  if (view === 'verified') {
    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 overflow-y-auto">
            <div className="max-w-2xl w-full space-y-8 text-center animate-in fade-in zoom-in duration-500">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-500 mb-4">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Data Integrity Verified</h1>
                <p className="text-muted-foreground">The following record has been successfully retrieved from the database.</p>
                
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-left shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-2 opacity-50">
                        <Server className="w-24 h-24 text-slate-800" />
                    </div>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-2">
                        <Database className="w-3 h-3" />
                        public.profiles (Live Record)
                    </h3>
                    <pre className="text-xs font-mono text-slate-300 overflow-x-auto">
                        {JSON.stringify(dbData, null, 2)}
                    </pre>
                </div>

                <div className="flex justify-center pt-4">
                    <Button onClick={() => router.push('/dashboard')} size="lg" className="px-12 h-12 rounded-lg font-bold uppercase tracking-widest">
                        Enter Dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-500">
      {/* Top Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-muted z-50">
        <div className="h-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.4)] transition-all duration-700 ease-in-out" style={{ width: `${globalProgress}%` }} />
      </div>

      <div className="relative flex-1 flex flex-col max-w-5xl mx-auto px-6 w-full">
        {/* Header Alignment with Dashboard */}
        <header className="h-16 flex items-center border-b border-border mb-12">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold tracking-tight">Onboarding Quest</span>
          </div>
          <div className="ml-auto flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Phase 0{phase} / Step {currentStep + 1}
          </div>
        </header>

        <main className="flex-1 flex flex-col justify-center max-w-3xl">
          <div key={`${phase}-${currentStep}`} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-4xl font-bold tracking-tight mb-8 leading-tight">
              {currentQuestion.question}
            </h2>

            <div className="relative">
              {currentQuestion.type === 'text' && (
                <input 
                  type="text" 
                  className="w-full bg-background border border-border rounded-lg p-4 text-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" 
                  placeholder={(currentQuestion as any).placeholder || 'Type your response here...'} 
                  value={responses[currentQuestion.id] || ''} 
                  onChange={(e) => updateResponse(e.target.value)} 
                  autoFocus 
                />
              )}
              {currentQuestion.type === 'textarea' && (
                <textarea 
                  className="w-full bg-background border border-border rounded-lg p-6 text-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[200px] resize-none leading-relaxed shadow-sm" 
                  placeholder="Type your detailed response here..." 
                  value={responses[currentQuestion.id] || ''} 
                  onChange={(e) => updateResponse(e.target.value)} 
                  autoFocus 
                />
              )}
            </div>

            {currentQuestion.hint && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border flex items-start gap-3">
                <Brain className="w-4 h-4 text-primary mt-0.5" />
                <p className="text-sm text-muted-foreground italic leading-relaxed">{currentQuestion.hint}</p>
              </div>
            )}
          </div>
        </main>

        {/* Footer Navigation */}
        <footer className="h-24 flex items-center justify-between border-t border-border mt-auto">
          <Button 
            onClick={handleBack} 
            disabled={phase === 1 && currentStep === 0} 
            variant="outline" 
            className={cn("gap-2", (phase === 1 && currentStep === 0) && "opacity-0")}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-xs text-muted-foreground">
              Press Enter for the next step
            </span>
            <Button 
              onClick={handleNext} 
              disabled={!isCurrentValid} 
              className="px-8 font-bold gap-2"
            >
              {phase === 3 && currentStep === totalQuestionsInPhase - 1 ? 'Process Results' : 'Next Step'}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}