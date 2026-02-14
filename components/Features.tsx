import Feature from './Feature';

const features = [
  {
    icon: '📊',
    title: 'Real-Time Market Analysis',
    description:
      'Instant explanations of price movements. AI analyzes news, technical patterns, and market sentiment to tell you exactly why EUR/USD just spiked — before the move is over.',
  },
  {
    icon: '🧠',
    title: 'Behavioral Coaching',
    description:
      'Detect emotional trading patterns before they cost you. AI identifies revenge trading, overleveraging, and impulsive decisions — providing supportive guidance without restricting your trades.',
  },
  {
    icon: '📱',
    title: 'Social Content Generation',
    description:
      'Turn market insights into professional social media content. AI-powered personas generate LinkedIn posts and Twitter threads that build your trading reputation and Deriv\'s community.',
  },
];

export const Features = () => {
  return (
    <div id="features" className="bg-black text-white py-[72px] sm:py-24 ">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-center font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tighter">
          Three Pillars of Trading Intelligence
        </h2>
        <div className="max-w-2xl mx-auto">
          <p className="text-center mt-5 text-lg sm:text-xl text-white/70">
            DerivHub combines market analysis, behavioral insights, and content creation to transform how you trade.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {features.map(({ icon, title, description }) => (
            <Feature key={title} icon={icon} title={title} description={description} />
          ))}
        </div>
      </div>
    </div>
  );
};
