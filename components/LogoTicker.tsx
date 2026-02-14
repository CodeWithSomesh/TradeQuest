"use client";

import { motion } from 'framer-motion';

const items = [
  "Works with Deriv Trader",
  "Supports Forex, Synthetics, Crypto",
  "Real-time Integration",
  "AI-Powered Analysis",
  "Social Media Ready",
];

export const LogoTicker = () => {
  return (
    <div className="bg-black text-white py-[72px] sm:py-24 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-2xl sm:text-3xl text-center font-bold text-white">
          Built for Deriv Traders
        </h2>
        <p className="text-center text-white/70 mt-3 max-w-xl mx-auto">
          Integrates seamlessly with Deriv&apos;s trading platform through a Chrome extension
        </p>

        <div className="flex overflow-hidden mt-12 before:content-[''] before:z-10 after:content-[''] after:z-10 relative before:absolute after:absolute before:h-full after:h-full before:w-16 after:w-16 before:left-0 after:right-0 before:top-0 after:top-0 before:bg-gradient-to-r before:from-[#0A0A0F] before:to-transparent after:bg-gradient-to-l after:from-[#0A0A0F] after:to-transparent">
          <motion.div
            className="flex gap-8 flex-none pr-8"
            initial={{ translateX: 0 }}
            animate={{ translateX: '-50%' }}
            transition={{ duration: 20, ease: 'linear', repeat: Infinity }}
          >
            {items.map((label) => (
              <span
                key={label}
                className="flex-none px-6 py-3 rounded-lg border border-white/20 bg-white/5 text-white/90 font-medium whitespace-nowrap"
              >
                {label}
              </span>
            ))}
            {items.map((label) => (
              <span
                key={`${label}-2`}
                className="flex-none px-6 py-3 rounded-lg border border-white/20 bg-white/5 text-white/90 font-medium whitespace-nowrap"
              >
                {label}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
