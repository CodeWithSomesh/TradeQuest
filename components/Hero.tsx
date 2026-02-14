"use client";

import { ArrowWIcon } from './Icons'

const Hero = () => {
  return (
    <div className='bg-black mx-auto text-white bg-[linear-gradient(to_bottom,#000,#2A0003_50%,#5A0A0F_65%,#FF444F_82%)] py-[72px] sm:py-24 relative overflow-clip'>
      <div className="absolute h-[375px] w-[750px] sm:w-[1536px] sm:h-[768px] lg:w-[2400px] lg:h-[1200px] rounded-[100%] bg-black left-1/2 -translate-x-1/2 border border-[#B48CDE] bg-[radial-gradient(closest-side,#000_70%,#FF444F_85%,#FF7A80)]  top-[calc(100%-96px)] sm:top-[calc(100%-120px)]"></div>

      <div className="max-w-4xl mx-auto px-6 relative">
        <div className="flex items-center justify-center">
          <a href="/dashboard" className="inline-flex gap-3 border py-1 px-2 rounded-lg border-white/30 hover:border-[#FF444F]/50 transition-colors">
            <span className="text-[#FF444F]  font-medium">Your AI Trading Intelligence Companion</span>
            <span className="inline-flex items-center gap-1 text-white/80">
              <span>Learn more</span>
              <ArrowWIcon className="w-4 h-4 fill-current" />
            </span>
          </a>
        </div>

        <div className="flex justify-center mt-8">
          <div className='inline-flex relative'>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tighter text-center">
              Trade Smarter
              <br />
              <span className="text-red-500">With AI Intelligence</span>
            </h1>

            {/* <motion.div drag //dragSnapToOrigin 
              className='absolute right-[530px] top-[108px] hidden sm:inline'>
                <Image src={cursorImage} alt="" height="200" width="200" 
                className='max-w-none' draggable="false"  />
              </motion.div>

              <motion.div drag //dragSnapToOrigin
              className='absolute left-[550px] top-[56px] hidden sm:inline' >
                <Image src={messageImage} alt="" height="200" width="200" 
                className='max-w-none' draggable="false" />
              </motion.div> */}
            </div>
        </div>

        <p className="text-center text-lg sm:text-xl mt-8 max-w-2xl mx-auto text-white/80 leading-relaxed">
          Real-time market analysis, behavioral coaching, and social content generation — all powered by advanced AI to help retail traders compete like professionals.
        </p>

        <div className="flex justify-center mt-10">
          <a href='/dashboard' className="bg-[black] hover:bg-white font-bold text-white hover:text-[#FF444F] py-3 px-6 hover:font-black hover:text-lg rounded-lg transition-colors ">
            Go To Dashboard
          </a>
        </div>
      </div>
    </div>
  );
};

export default Hero;
