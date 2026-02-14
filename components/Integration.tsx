const bullets = [
  'One-click installation',
  'Works with Deriv Trader',
  'Real-time synchronization',
  'Lightweight and fast',
];

export const Integration = () => {
  return (
    <div className="bg-[linear-gradient(to_bottom,#ea0c1b_20%,#2A0003_64%,#5A0A0F_75%,#000)]  text-white py-[72px] sm:py-24 border-t border-white/5">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter">
          Seamless Chrome Extension
        </h2>
        <p className="mt-5 text-lg sm:text-xl text-white/70 max-w-2xl mx-auto">
          DerivHub lives alongside your Deriv trading platform. No separate apps, no context switching — just intelligent insights exactly when you need them.
        </p>
        <ul className="mt-12 flex flex-wrap justify-center gap-4">
          {bullets.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 px-5 py-3 rounded-lg bg-black border border-white/50 text-white/90"
            >
              <span className="w-2 h-2 rounded-full bg-[#FF444F]" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
