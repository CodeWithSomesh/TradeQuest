'use client';
import helixImage from '@/assets/images/helix2.png'
import emojiStarImage from '@/assets/images/emojistar.png'
import Image from 'next/image';
import {motion} from 'framer-motion'

export const CallToAction = () => {
  return (
    <div className="bg-black text-white py-[72px] sm:py-32 text-center overflow-hidden">
      <div className="mx-auto  px max-w-xl relative">

        <motion.div  initial={{translateY: 0}}
          animate={{translateY: [0, -60, 0]}}
          transition={{
            duration: 5,
            ease: "linear",
            repeat: Infinity,
          }} >
          <Image src={helixImage} alt='' 
          className="absolute top-6 left-[calc(100%+36px)] " />
        </motion.div>

        <motion.div drag initial={{translateY: 0}}
          animate={{translateY: [0, 60, 0]}}
          transition={{
            duration: 5,
            ease: "linear",
            repeat: Infinity,
          }} >
          <Image src={emojiStarImage} alt='' 
          className="absolute -top-[120px] right-[calc(100%+24px)]" />
        </motion.div>
        <h2 className="font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tighter">
          Ready to Trade with AI Intelligence?
        </h2>
        <p className="text-lg sm:text-xl text-white/70 mt-5">
          Join traders who are turning market chaos into clarity with DerivHub.
        </p>
        <div className="mt-10">
          <a href='/dashboard' className="bg-[#FF444F] hover:bg-[#E63946] text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow-[0_0_40px_rgba(255,68,79,0.2)]">
            Get Started Free
          </a>
        </div>
      </div>
    </div>
  );
};
