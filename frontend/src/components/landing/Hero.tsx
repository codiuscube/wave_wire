import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { WaitlistModal } from "../ui";
import { useSpotName } from "../../contexts/LocationContext";

function getNotifications(spotName: string) {
  const upper = spotName.toUpperCase();
  return [
    {
      label: "DAWN_PATROL",
      message: `YO. ${upper} JUST TURNED ON. 4-6FT. GLASSY. DROP EVERYTHING.`,
    },
    {
      label: "SWELL_INTEL",
      message: `SOLID PULSE INBOUND. 5FT @ 14S. WIND SWAPPED OFFSHORE. IT'S ON.`,
    },
    {
      label: "THE_LOCAL",
      message: `DON'T SLEEP ON THIS. TIDE IS ALIGNING. GET OUT HERE.`,
    },
  ];
}

export function Hero() {
  const spotName = useSpotName();
  const notifications = useMemo(() => getNotifications(spotName), [spotName]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showWaitlist, setShowWaitlist] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % notifications.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [notifications.length]);

  return (
    <header className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-20 torn-bottom">

      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-brand-abyss/80 z-10" />
        {/* Image with filters */}
        <img
          src="https://images.unsplash.com/photo-1760755795966-8ae34c66de07?q=80&w=1982&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Surfer in the ocean"
          className="w-full h-full object-cover grayscale contrast-125 brightness-50"
        />
        <div className="absolute inset-0 grunge-overlay z-20 opacity-40 mix-blend-color-burn"></div>
      </div>

      <div className="container relative z-10 mx-auto px-4 max-w-7xl pt-12 sm:pt-0">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12 items-center">

          {/* Main Typography Layer */}
          <div className="w-full lg:col-span-8 flex flex-col items-start relative order-2 lg:order-1">

            {/* Decorative Top Label */}
            <div className="font-mono text-brand-acid text-xs tracking-[0.2em] mb-4 border-l-2 border-brand-rogue pl-4 py-1 tape">
              HARD INTEL. PRIVATE ALERTS.
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl leading-[0.8] tracking-tighter text-white font-black mix-blend-difference mb-8 glitch-text select-none font-display uppercase" data-text="SWELL">
              SWELL<br />
              <span className="text-brand-acid ml-8 sm:ml-24 block translate-x-2 sm:translate-x-4 distressed-text">INCOMING.</span>
            </h1>

            {/* Subtext Layer */}
            <div className="max-w-xl -mt-8 sm:-mt-12 ml-auto sm:ml-32 relative z-20">
              <div className="bg-brand-rogue text-brand-abyss font-bold font-mono text-xs inline-block px-2 py-1 mb-2 transform -rotate-1">
                // WIRE_RECEIVED
              </div>
              <p className="font-mono text-base sm:text-lg text-brand-foam leading-relaxed border-l-2 border-brand-acid pl-6">
                <span className="text-white font-bold text-lg">SIGNAL DETECTED. SWELL CONFIRMED.</span> We monitor the raw data—buoys, wind, tide. You set the threshold. We send the wire. No noise.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="mt-12 flex flex-col sm:flex-row gap-6">
              <button
                onClick={() => setShowWaitlist(true)}
                className="btn-brutal text-lg"
              >
                JOIN WAVE_WIRE
              </button>

              <Link to="/dashboard" className="font-mono text-brand-foam text-sm underline decoration-brand-rogue decoration-2 underline-offset-4 hover:text-white transition-colors self-center">
                [ VIEW_DEMO_MODE ]
              </Link>
            </div>
          </div>

          {/* Right Column / Tech Visuals (SMS Style) */}
          <div className="lg:col-span-4 flex flex-col w-full max-w-md mx-auto lg:mx-0 mt-8 lg:mt-0 order-1 lg:order-2">

            {/* Phone/Device container - loose box */}
            <div className="relative bg-brand-abyss/80 backdrop-blur-md border-2 border-brand-concrete p-4 sm:p-6 transform -rotate-1 hover:rotate-0 transition-transform duration-500 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] torn-bottom">

              {/* Header */}
              <div className="flex justify-between items-center mb-6 border-b-2 border-dashed border-white/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-brand-rogue animate-pulse"></div>
                  <span className="font-display font-black text-xl text-white tracking-tight uppercase">
                    [{spotName}]
                  </span>
                </div>
              </div>

              {/* Messages Area */}
              <div className="space-y-6 relative">
                {/* Vertical line connecting messages */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10 -z-10"></div>

                {notifications.map((note, idx) => (
                  <div
                    key={idx}
                    className={`relative flex flex-col gap-1 transition-all duration-500 ${idx === currentIndex
                      ? 'opacity-100 translate-x-0'
                      : 'opacity-40 translate-x-2 blur-[1px]'
                      }`}
                  >
                    {/* Avatar/Indicator */}

                    <div className={`p-3 sm:p-4 text-xs sm:text-sm font-mono leading-tight border ${idx === currentIndex
                      ? 'bg-brand-acid text-brand-abyss border-brand-acid shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)]'
                      : 'bg-transparent text-brand-foam border-white/20'
                      }`}>
                      <span className="block font-bold mb-2 text-xs tracking-widest opacity-80 uppercase border-b border-black/10 pb-1">
                        {note.label}
                      </span>
                      {note.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      <WaitlistModal
        isOpen={showWaitlist}
        onClose={() => setShowWaitlist(false)}
      />
    </header>
  );
}

