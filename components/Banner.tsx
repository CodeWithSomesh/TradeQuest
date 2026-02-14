const Banner = () => {
  return (
    <div className="py-3 text-center text-white bg-[linear-gradient(to_right,rgba(255,68,79,0.3),#FF444F_20%,#FF444F_80%,rgba(255,68,79,0.3))]">
      <div className="mx-auto px-4">
        <p className="font-semibold">
          <span className="hidden sm:inline">Your AI Trading Intelligence Companion — </span>
          <a href="/dashboard" className="underline underline-offset-4 px-2 font-bold italic hover:opacity-90">
            Go To Dashboard
          </a>
        </p>
      </div>
    </div>
  );
};

export default Banner;
