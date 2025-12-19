import { useState, useMemo } from 'react';
import { useSpotName } from '../../contexts/LocationContext';
import { ArrowRightUp } from '@solar-icons/react';

function getSlides(spotName: string) {
  return [
    {
      number: '01',
      title: 'NIGHT_BEFORE',
      time: '20:00',
      description: 'Checks forecasts against your triggers. Be ready or sleep in.',
      image: 'https://images.unsplash.com/photo-1552918147-eb18f7613987?q=80&w=2070&auto=format&fit=crop',
      overlay: `[ALERT_PENDING] // TARGET: ${spotName.toUpperCase()} // FORECAST: 4FT @ 12S // WINDOW: 0600-0900 // ACTION: PREP_GEAR`,
      // Layout Config
      posTime: "bottom-0 right-0",
      posSticker: "bottom-6 right-6 rotate-1",
      posNoise: "top-12 right-12",
      noiseChar: "⊕",
      refText: "+ REF_X99",
    },
    {
      number: '02',
      title: 'MORNING_CHECKBOARD',
      time: '06:00',
      description: 'Live buoy confirm. Real traffic. Exact leave time.',
      image: 'https://images.unsplash.com/photo-1704320392193-247c05689e36?q=80&w=2070&auto=format&fit=crop',
      overlay: `BUOY CONFIRMED // ${spotName.toUpperCase()} // 4.2FT // CLEAN // GO NOW`,
      // Layout Config
      // Flipped: Time Top-Right, Sticker Bottom-Left
      posTime: "top-0 right-0",
      posSticker: "bottom-6 left-6 -rotate-1",
      posNoise: "bottom-24 right-12",
      noiseChar: "⏚",
      refText: "/// SYS_CHK",
    },
    {
      number: '03',
      title: 'POP_UP_ALERT',
      time: 'AUTO',
      description: 'Surprise swells. Wind switches. Immediate pulses.',
      image: 'https://images.unsplash.com/photo-1760755958496-bf5fe0b9fd13?q=80&w=3026&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      overlay: `[STATUS_CHANGE] // WIND_SHIFT: DETECTED // OFFSHORE < 5KTS // WINDOW_CLOSING: 120 MINS // GO_NOW`,
      // Layout Config
      // Flipped: Time Bottom-Left, Sticker Top-Right
      posTime: "bottom-0 left-0",
      posSticker: "top-6 right-6 rotate-2",
      posNoise: "top-24 left-12",
      noiseChar: "⚡",
      refText: "⚠ ALERT",
    },
  ];
}

export function HowItWorks() {
  const spotName = useSpotName();
  const slides = useMemo(() => getSlides(spotName), [spotName]);
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <section id="how-it-works" className="relative py-32 bg-brand-abyss overflow-hidden">
      {/* Background Chaos */}
      <div className="absolute inset-0 grunge-overlay opacity-20"></div>
      <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-acid/5 -skew-x-12 transform origin-top-right mix-blend-overlay pointer-events-none"></div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="mb-16 border-l-4 border-brand-rogue pl-6">
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-black font-display tracking-tighter text-white uppercase leading-[0.8]">
            SMART<br />
            <span className="text-brand-concrete">TRIGGERS</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Left: Sticky Navigation */}
          <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit">

            <p className="font-mono text-sm text-brand-foam/80 mb-12 border-l border-white/20 pl-4">
              <span className="inline-block bg-brand-rogue text-brand-abyss px-2 py-0.5 transform -rotate-1 mb-2 font-mono text-xs font-bold tracking-widest tape">
                // ALGORITHM: ACTIVE
              </span><br />
              We monitor the coast. You clear your schedule.
            </p>

            <div className="space-y-4">
              {slides.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIdx(idx)}
                  className={`w-full text-left group flex items-center gap-4 p-4 border transition-all duration-300 ${activeIdx === idx
                    ? 'border-brand-acid bg-brand-acid/10 translate-x-4'
                    : 'border-white/10 hover:border-white/40'
                    }`}
                >
                  <span className={`font-mono font-bold text-xl ${activeIdx === idx ? 'text-brand-acid' : 'text-brand-concrete'}`}>
                    {s.number}:
                  </span>
                  <span className="font-bold text-white tracking-widest uppercase text-sm">
                    {s.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Visual Display */}
          <div className="lg:col-span-8 relative min-h-[500px]">
            {slides.map((s, idx) => (
              <div
                key={idx}
                className={`transition-all duration-500 absolute inset-0 ${activeIdx === idx ? 'opacity-100 z-10 translate-x-0' : 'opacity-0 z-0 translate-x-12 pointer-events-none'
                  }`}
              >
                {/* Main Image Container */}
                <div className="relative group shadow-[16px_16px_0px_0px_rgba(255,51,0,0.2)] border-2 border-white/10 bg-black">

                  {/* Glitch/Xerox Overlay */}
                  <div className="absolute inset-0 grunge-overlay z-20 mix-blend-hard-light opacity-50"></div>
                  <div className="absolute inset-0 bg-brand-rogue/10 mix-blend-multiply z-20"></div>

                  <img
                    src={s.image}
                    alt={s.title}
                    className="w-full h-[400px] object-cover grayscale contrast-[1.5] brightness-75 border-b-4 border-brand-rogue"
                  />

                  {/* Corner Text - Variable Position */}
                  <div className={`absolute ${s.posTime} bg-white text-black font-black font-mono text-xl p-2 z-20 shadow-lg border border-black`}>
                    {s.time}
                  </div>

                  {/* Messy Elements / Visual Noise */}
                  <div className={`absolute ${s.posNoise} text-white/40 font-mono text-5xl pointer-events-none z-30 mix-blend-overlay rotate-[15deg]`}>
                    {s.noiseChar}
                  </div>
                  {/* Shared Stray Lines */}
                  <div className="absolute bottom-1/3 left-1/4 w-32 h-[1px] bg-brand-rogue/60 rotate-[-12deg] pointer-events-none z-30"></div>
                  <div className="absolute top-1/4 right-1/3 text-brand-acid font-mono text-xs rotate-90 pointer-events-none z-30 opacity-70">
                    {s.refText}
                  </div>

                  {/* "Sticker" Overlay - Variable Position */}
                  <div className={`absolute ${s.posSticker} bg-brand-abyss border-2 border-brand-acid p-5 max-w-sm transition-transform z-30 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] group-hover:rotate-0`}>
                    <div className="flex justify-between items-end mb-3 border-b-2 border-brand-concrete/30 pb-2 relative overflow-hidden">
                      {/* Random Stray Line */}
                      <div className="absolute top-1/2 left-0 w-full h-px bg-white/10 rotate-1"></div>

                      <span className="font-mono text-xs text-brand-acid">
                        INCOMING_TRANSMISSION
                      </span>
                      <div className="w-3 h-3 bg-brand-rogue rounded-full border border-white"></div>
                    </div>
                    <p className="font-mono text-sm text-white leading-tight uppercase tracking-wide">
                      {s.overlay}
                    </p>
                  </div>
                </div>

                {/* Description Box */}
                <div className="mt-8 ml-8 border-l-2 border-brand-acid pl-6">
                  <p className="text-lg md:text-xl text-brand-foam font-bold leading-tight uppercase font-display max-w-lg">
                    <span className="text-brand-rogue">//</span> {s.description}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-brand-acid font-mono text-xs cursor-pointer hover:underline">
                    CONFIGURE_TRIGGER <ArrowRightUp weight="Bold" size={16} />
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
