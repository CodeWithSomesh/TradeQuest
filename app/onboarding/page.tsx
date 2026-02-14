'use client';

import React, { useState, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Calculator, 
  ArrowRight,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button'; // Assuming these exist in your project
import { cn } from '@/lib/utils';

export default function OnboardingPage() {
  const router = useRouter();
  const [view, setView] = useState<'intro' | 'onboarding' | 'completed'>('intro');
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
    }, 800);
  };

  // Phase Definitions
  const phases = [
    {
      id: 1,
      title: "Discovery",
      questions: [
        { 
          id: 'name', 
          type: 'text', 
          question: "What is your name?", 
          placeholder: "Type your name...",
          text: undefined
        },
        { 
          id: 'markets', 
          type: 'textarea', 
          question: "Which financial markets call to you?", 
          hint: "Stocks, Crypto, Forex? Tell us what draws your interest.",
          text: undefined
        },
        { 
          id: 'timeframe', 
          type: 'textarea', 
          question: "How does trading fit into your time?", 
          hint: "Are you looking for seconds (Scalping), hours (Day), or years (Investing)?",
          text: undefined
        },
        { 
          id: 'objective', 
          type: 'textarea', 
          question: "What does the ultimate win look like for you?", 
          hint: "Monthly income? Generational wealth? The thrill of the game?",
          text: undefined
        },
        { 
          id: 'challenge', 
          type: 'textarea', 
          question: "Where do you feel the most resistance?", 
          hint: "Finding the trade, pulling the trigger, or holding the winner?",
          text: undefined
        }
      ]
    },
    {
      id: 2,
      title: "Philosophy",
      questions: [
        { 
          id: 'drop_reaction', 
          type: 'textarea', 
          question: "You buy. It drops 10% immediately. Walk us through your next minute.", 
          hint: "Panic? Analysis? Acceptance? Be honest.",
          text: undefined
        },
        { 
          id: 'good_trade', 
          type: 'textarea', 
          question: "Define a 'Good Trade' without using the word 'Profit'.", 
          hint: "Think about process, execution, and discipline.",
          text: undefined
        },
        { 
          id: 'overtrading', 
          type: 'textarea', 
          question: "What does overtrading look like in your world?",
          text: undefined
        }
      ]
    },
    {
      id: 3,
      title: "Technical",
      questions: [
        { 
          id: 'three_losses', 
          type: 'textarea', 
          question: "Three losses in a row. What changes?",
          text: undefined
        },
        { 
          id: 'five_losses', 
          type: 'textarea', 
          question: "Five losses in a row. What changes now?",
          text: undefined
        },
        { 
          id: 'math_test', 
          type: 'math', 
          question: "The Risk Calculation",
          text: "Capital: RM10,000. Risk Cap: 1%. Entry: 2.50. Stop: 2.40. What is your max position size?",
          placeholder: "0"
        },
        { 
          id: 'volatility', 
          type: 'textarea', 
          question: "Volatility doubles overnight. How do you adapt?", 
          hint: "Consider stop distance, size, and frequency.",
          text: undefined
        },
        { 
          id: 'gut_feeling', 
          type: 'textarea', 
          question: "Stop Loss hit. 'Gut feeling' says buy back. What do you do?",
          text: undefined
        },
        { 
          id: 'system_comparison', 
          type: 'textarea', 
          question: "System A (60% WR, 1R) vs System B (28% WR, 3R). Choose one and defend it.",
          hint: "Analyze the expectancy.",
          text: undefined
        }
      ]
    }
  ];

  const currentPhaseData = phases[phase - 1];
  const currentQuestion = currentPhaseData?.questions[currentStep];
  const totalQuestionsInPhase = currentPhaseData?.questions.length;
  // Simplified global progress for the thin bar
  const totalSteps = phases.reduce((acc, p) => acc + p.questions.length, 0);
  const currentGlobalStep = phases.slice(0, phase - 1).reduce((acc, p) => acc + p.questions.length, 0) + currentStep;
  const globalProgress = ((currentGlobalStep) / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalQuestionsInPhase - 1) {
      setDirection('next');
      setCurrentStep(prev => prev + 1);
    } else if (phase < 3) {
      setDirection('next');
      setPhase(prev => prev + 1);
      setCurrentStep(0);
    } else {
      setView('completed');
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

  const handleComplete = () => {
    // Navigate to dashboard or process data
    router.push('/dashboard');
  };

  // View: Splash Screen
  if (view === 'intro') {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8 text-center relative overflow-hidden animate-in fade-in duration-1000">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-primary/10 blur-[150px] rounded-full opacity-50" />
        </div>
        
        <div className={`transition-all duration-1000 transform ${isExiting ? 'opacity-0 scale-95 blur-lg translate-y-10' : 'opacity-100 scale-100 blur-0 translate-y-0'}`}>
          <h1 className="text-6xl md:text-9xl font-serif font-medium mb-8 tracking-tight text-foreground drop-shadow-2xl">
            TradeQuest
          </h1>
          
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-8 opacity-50" />

          <Button 
            onClick={startJourney}
            size="lg"
            variant="outline"
            className="group relative inline-flex items-center gap-4 px-12 py-8 rounded-full text-base font-bold uppercase tracking-[0.2em] transition-all duration-500 hover:bg-primary/10 hover:border-primary/50"
          >
            Enter The Arena
            <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-2 transition-transform duration-300" />
          </Button>
        </div>
      </div>
    );
  }

  // View: Success Screen
  if (view === 'completed') {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 animate-in fade-in duration-1000">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight">Analysis Complete</h1>
          <p className="text-muted-foreground text-lg font-light">
            We have captured your profile. Your personalized curriculum is being generated.
          </p>
          
          <Button 
            onClick={handleComplete}
            variant="ghost"
            className="mt-12 text-sm font-bold uppercase tracking-[0.2em] text-primary hover:text-primary/80 hover:bg-transparent transition-colors"
          >
            Enter Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // View: Onboarding Questions
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 flex flex-col transition-colors duration-1000">
      
      {/* Cinematic Progress Bar (Top Edge) */}
      <div className="fixed top-0 left-0 w-full h-1 bg-primary/10 z-50">
        <div 
          className="h-full bg-primary shadow-[0_0_20px_rgba(var(--primary),0.5)] transition-all duration-1000 ease-out"
          style={{ width: `${globalProgress}%` }}
        />
      </div>

      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[180px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[180px] rounded-full" />
      </div>

      {/* Main Content Area - Focus Mode */}
      <div className="relative flex-1 flex flex-col justify-center max-w-4xl mx-auto px-8 w-full">
        
        {/* Phase Indicator (Minimal) */}
        <div className="absolute top-12 left-8 md:left-0 opacity-40">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
            Phase 0{phase} / {currentPhaseData.title}
          </span>
        </div>

        <main className="py-12">
          <div key={`${phase}-${currentStep}`} className={`animate-in fade-in slide-in-from-${direction === 'next' ? 'bottom-8' : 'top-8'} duration-700 ease-out`}>
            
            {/* The Question */}
            <h2 className="text-3xl md:text-5xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-foreground to-muted-foreground mb-12 leading-[1.2]">
              {currentQuestion.question}
            </h2>

            {/* The Input Area - Clean & Immersive */}
            <div className="relative group">
              {currentQuestion.type === 'text' && (
                <input 
                  type="text"
                  className="w-full bg-transparent border-b border-border py-6 text-2xl md:text-4xl text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary transition-all font-light"
                  placeholder={currentQuestion.placeholder}
                  value={responses[currentQuestion.id] || ''}
                  onChange={(e) => updateResponse(e.target.value)}
                  autoFocus
                />
              )}

              {currentQuestion.type === 'textarea' && (
                <textarea 
                  className="w-full bg-transparent border-l-2 border-border pl-6 py-2 text-xl md:text-2xl text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary transition-all min-h-[150px] resize-none leading-relaxed font-light"
                  placeholder="Type your answer here..."
                  value={responses[currentQuestion.id] || ''}
                  onChange={(e) => updateResponse(e.target.value)}
                  autoFocus
                />
              )}

              {currentQuestion.type === 'math' && (
                <div className="space-y-8">
                  <div className="p-6 border-l-2 border-primary/30 bg-primary/5">
                    <div className="flex items-center gap-3 mb-4 text-primary">
                        <Calculator className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Technical Check</span>
                    </div>
                    <p className="text-xl text-muted-foreground font-light">{currentQuestion.text}</p>
                  </div>
                  <textarea 
                      className="w-full bg-transparent border-l-2 border-border pl-6 py-2 text-xl md:text-2xl text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary transition-all min-h-[150px] resize-none leading-relaxed font-light"
                      placeholder="Type your answer here..."
                      value={responses[currentQuestion.id] || ''}
                      onChange={(e) => updateResponse(e.target.value)}
                      autoFocus
                  />
                </div>
              )}
            </div>

            {/* Dynamic Hint */}
            <div className={`mt-8 transition-all duration-500 ${responses[currentQuestion.id] ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-2'}`}>
               {currentQuestion.hint && (
                  <p className="text-sm text-muted-foreground font-medium italic">
                    <span className="text-primary not-italic mr-2">Tip:</span> 
                    {currentQuestion.hint}
                  </p>
               )}
            </div>

          </div>
        </main>

        {/* Minimal Navigation */}
        <div className="fixed bottom-12 right-12 flex gap-4">
            <Button 
                onClick={handleBack}
                disabled={phase === 1 && currentStep === 0}
                variant="outline"
                size="icon"
                className={`w-12 h-12 rounded-full border-border bg-background/50 hover:bg-background ${phase === 1 && currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-muted-foreground hover:text-foreground'}`}
            >
                <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button 
                onClick={handleNext}
                disabled={!isCurrentValid}
                className={cn(
                  "group flex items-center gap-3 px-8 py-6 rounded-full transition-all duration-300",
                  isCurrentValid ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-transparent border border-border text-muted-foreground cursor-not-allowed"
                )}
            >
                <span className="text-sm font-bold uppercase tracking-widest">
                    {phase === 3 && currentStep === totalQuestionsInPhase - 1 ? 'Finish' : 'Next'}
                </span>
                <ChevronRight className={cn("w-4 h-4 transition-transform", isCurrentValid && "group-hover:translate-x-1")} />
            </Button>
        </div>

      </div>
    </div>
  );
}