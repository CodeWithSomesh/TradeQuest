'use client';

import React, { useState, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Activity,
  ArrowRight,
  Loader2,
  Brain,
  Terminal
} from 'lucide-react';

/**
 * Mock useRouter for environment compatibility.
 * Replace this with `import { useRouter } from 'next/navigation'` in production.
 */
import { useRouter } from 'next/navigation';

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

export default function App() {
  const router = useRouter();
  // Simplified states: No more 'completed' or 'verifying' views
  const [view, setView] = useState<'intro' | 'onboarding' | 'processing'>('intro');
  const [isExiting, setIsExiting] = useState(false);
  const [phase, setPhase] = useState(1);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<'next' | 'back'>('next');
  const [responses, setResponses] = useState<Record<string, string>>({});

  const startJourney = () => {
    setIsExiting(true);
    setTimeout(() => {
      setView('onboarding');
      setIsExiting(false);
    }, 600);
  };

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
      // 1. Process with Gemini & Insert into 'user_profiles'
      console.log("🚀 Sending responses to AI & Database...");
      const res = await fetch('/api/onboarding/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses }),
      });

      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to process onboarding");
      }

      console.group("🤖 Onboarding Processed");
      console.log("Gemini Analysis Result:", data.analysis);
      
      // 2. Verification: Use the specific ID returned by the API
      const profileId = data.dbId; 
      
      if (!profileId) {
          throw new Error("API reported success, but no Database ID was returned.");
      }


      // 3. Navigate to Dashboard (Only happens if verify passes)
      console.log("🚀 Redirecting to Dashboard...");
      router.push('/dashboard');

    } catch (error: any) {
      console.error("🚨 Critical Error:", error);
      console.groupEnd();
      
      // Alert the user so they know it failed
      alert(`Connection Error: ${error.message || "Could not save profile"}. Please check console.`);
      
      // Return to the form so they aren't stuck on the loading screen
      setView('onboarding'); 
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

  // --- Views ---

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

  if (view === 'processing') {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
          <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Synthesizing Profile</h2>
        <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-xs font-mono text-muted-foreground border border-border">
          <Terminal className="w-3 h-3" />
          <span>Processing AI Analysis & Verifying Database...</span>
        </div>
      </div>
    );
  }

  // --- Main Question View ---
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-500">
      <div className="fixed top-0 left-0 w-full h-1 bg-muted z-50">
        <div className="h-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.4)] transition-all duration-700 ease-in-out" style={{ width: `${globalProgress}%` }} />
      </div>

      <div className="relative flex-1 flex flex-col max-w-5xl mx-auto px-6 w-full">
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
            <Button 
              onClick={handleNext} 
              disabled={!isCurrentValid} 
              className="px-8 font-bold gap-2"
            >
              {phase === 3 && currentStep === totalQuestionsInPhase - 1 ? 'Complete Evaluation' : 'Next Step'}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}