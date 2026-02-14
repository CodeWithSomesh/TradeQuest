'use client';

import React from 'react';
import { PlusIcon, MinusIcon } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';

const items = [
  {
    question: 'How does DerivHub analyze market movements?',
    answer:
      "DerivHub combines real-time news aggregation from multiple sources with technical pattern recognition. When a significant price movement occurs, our AI synthesizes recent news, economic events, and chart patterns to provide clear, actionable explanations in seconds.",
  },
  {
    question: 'Will DerivHub block my trades?',
    answer:
      "No. DerivHub is supportive, not restrictive. We provide warnings and insights about emotional trading patterns, but you always maintain full control. Our AI coaches and advises — you make the final decisions.",
  },
  {
    question: 'What trading instruments does DerivHub support?',
    answer:
      "DerivHub works with all Deriv instruments including Forex (EUR/USD, GBP/USD, etc.), Synthetic Indices (Volatility 100, Crash/Boom), Cryptocurrencies, and Commodities. The AI adapts its analysis to each instrument type.",
  },
  {
    question: 'How does the social content feature work?',
    answer:
      "Select an AI persona (Calm Analyst, Data Nerd, or Trading Coach) and DerivHub transforms market insights into platform-specific content. Get professional LinkedIn posts and concise Twitter threads ready to copy and share — building your reputation as an informed trader.",
  },
  {
    question: 'Is my trading data secure?',
    answer:
      "Absolutely. All trade analysis happens locally in your browser extension. We only send anonymized pattern data to our AI for analysis. Your account credentials and personal information never leave your device.",
  },
];

const AccordionItem = ({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div
      className="py-6 border-b border-white/20 cursor-pointer"
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="flex items-center gap-3">
        <span className="flex-1 text-base sm:text-lg font-bold text-white pr-4">
          {question}
        </span>
        <span className="text-[#FF444F] flex-shrink-0">
          {isOpen ? <MinusIcon /> : <PlusIcon />}
        </span>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: '12px' }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="text-white/80 text-sm sm:text-base leading-relaxed"
          >
            {answer}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const FAQs = () => {
  return (
    <div id="faq" className="bg-[#1A1A1F] text-white bg-gradient-to-b from-[#ea0c1b] to-black py-[72px] sm:py-24 ">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-center text-4xl sm:text-5xl font-bold tracking-tighter">
          Frequently Asked Questions
        </h2>
        <div className="mt-12">
          {items.map(({ question, answer }) => (
            <AccordionItem key={question} question={question} answer={answer} />
          ))}
        </div>
      </div>
    </div>
  );
};
