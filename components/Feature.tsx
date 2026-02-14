'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';

const Feature = ({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) => {
  const offsetX = useMotionValue(-100);
  const offsetY = useMotionValue(-100);
  const maskImage = useMotionTemplate`radial-gradient(120px 120px at ${offsetX}px ${offsetY}px, black, transparent)`;
  const border = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      if (!border.current) return;
      const rect = border.current.getBoundingClientRect();
      offsetX.set(e.x - rect.x);
      offsetY.set(e.y - rect.y);
    };
    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, [offsetX, offsetY]);

  return (
    <div className="border border-white/20 px-6 py-10 rounded-xl relative bg-[#1A1A1F]/50 hover:border-[#FF444F]/30 transition-colors">
      <motion.div
        className="absolute inset-0 border-2 border-[#FF444F] rounded-xl pointer-events-none"
        ref={border}
        style={{
          WebkitMaskImage: maskImage,
          maskImage: maskImage,
        }}
      />

      <div className="inline-flex h-14 w-14 bg-[#FF444F]/20 text-3xl justify-center items-center rounded-lg border border-[#FF444F]/30">
        {icon}
      </div>

      <h3 className="mt-6 font-bold text-lg text-white">{title}</h3>
      <p className="mt-3 text-white/70 text-sm leading-relaxed">{description}</p>
    </div>
  );
};

export default Feature;
