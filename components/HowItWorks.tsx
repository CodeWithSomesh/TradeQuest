const steps = [
  {
    emoji: '📊',
    title: 'Market Spike Detected',
    body: 'EUR/USD jumps 0.6% in 5 minutes. DerivHub immediately fetches news, analyzes technical patterns, and explains: "ECB hints at rate pause + breakout above resistance."',
  },
  {
    emoji: '🧠',
    title: 'Behavioral Pattern Recognized',
    body: 'You open a large position. DerivHub notices: "You tend to overtrade after sudden moves. Your last 3 impulsive entries during spikes resulted in losses. Consider waiting for confirmation."',
  },
  {
    emoji: '📱',
    title: 'Content Generated',
    body: 'Want to share this insight? DerivHub\'s AI persona generates a professional LinkedIn analysis and concise Twitter thread — ready to post and build your trading reputation.',
  },
];

export const HowItWorks = () => {
  return (
    <div id="how-it-works" className="bg-black text-white py-[72px] sm:py-24 ">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-center text-4xl sm:text-5xl font-bold tracking-tighter">
          AI Intelligence, Three Ways
        </h2>
        <div className="mt-16 space-y-10">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="flex gap-6 p-6 rounded-xl border border-white/40 bg-[#1A1A1F]/50 hover:border-[#FF444F]/90 transition-colors"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#FF444F]/20 border border-[#FF444F]/30 flex items-center justify-center text-2xl">
                {step.emoji}
              </div>
              <div>
                <span className="text-xs font-semibold text-[#FF444F] uppercase tracking-wider">
                  Step {i + 1}
                </span>
                <h3 className="mt-1 font-bold text-lg text-white">{step.title}</h3>
                <p className="mt-2 text-white/70 leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
