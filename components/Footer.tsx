import { InstaIcon, XSocialIcon, TiktokIcon, YoutubeIcon } from './Icons';

export const Footer = () => {
  return (
    <footer className="bg-black text-white/60 py-6 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div className="text-center sm:text-left">
            <span className="font-semibold text-white">Deriv</span>
            <span className="text-[#FF444F] font-semibold">Hub</span>
            <span className="ml-2">© {new Date().getFullYear()} All Rights Reserved</span>
          </div>
          <ul className="flex justify-center gap-4 [&_svg]:w-5 [&_svg]:h-5">
            <li>
              <a href="#" className="text-white/60 hover:text-[#FF444F] transition-colors" aria-label="X">
                <XSocialIcon />
              </a>
            </li>
            <li>
              <a href="#" className="text-white/60 hover:text-[#FF444F] transition-colors" aria-label="Instagram">
                <InstaIcon />
              </a>
            </li>
            <li>
              <a href="#" className="text-white/60 hover:text-[#FF444F] transition-colors" aria-label="TikTok">
                <TiktokIcon />
              </a>
            </li>
            <li>
              <a href="#" className="text-white/60 hover:text-[#FF444F] transition-colors" aria-label="YouTube">
                <YoutubeIcon />
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};
