"use client";

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const placeholderItems = [
  'Live market analysis panel',
  'Behavioral insights dashboard',
  'Social content generator',
  'Trade history with AI annotations',
];

export const ProductShowcase = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end end'],
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [12, 0]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0.15, 1]);

  return (
    <div className="bg-black text-white bg-gradient-to-b from-black to-[#ea0c1b] py-[72px] sm:py-24 ">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-center text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter">
          Intelligent Interface, Effortless Insights
        </h2>
        <div className="max-w-2xl mx-auto">
          <p className="text-xl text-center text-white/70 mt-5">
            Beautiful AI companion that sits alongside your Deriv trading platform. Get instant market explanations, behavioral warnings, and content suggestions — all without leaving your trading flow.
          </p>
        </div>

        <motion.div
          ref={containerRef}
          style={{
            opacity,
            rotateX,
            transformPerspective: '800px',
          }}
          className="mt-14"
        >
          <div className="max-w-2xl mx-auto rounded-xl border-2 border-[#FF444F]/30 bg-[#1A1A1F] p-8 sm:p-12 shadow-[0_0_60px_rgba(255,68,79,0.08)]">
            <p className="text-center text-[#FF444F]/90 font-semibold text-sm uppercase tracking-wider mb-6">
              [DerivHub Extension Interface]
            </p>
            <ul className="space-y-4">
              {placeholderItems.map((item) => (
                <li key={item} className="flex items-center gap-3 text-white/80">
                  <span className="w-2 h-2 rounded-full bg-[#FF444F]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
