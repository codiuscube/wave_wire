import { Logo } from '../ui/Logo';

export function Footer() {
  return (
    <footer className="py-12 border-t border-white/10 bg-brand-abyss relative">
      {/* Tape Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-rogue text-brand-abyss px-4 py-1 font-mono text-xs font-bold tracking-widest rotate-2 shadow-lg tape z-120">
        SURF ALERTS. FREE. VIA TEXT.
      </div>

      <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2 text-brand-acid group">
            <Logo className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="font-bold font-display tracking-tighter uppercase text-xl text-white">
              WAVE_WIRE
            </span>
          </div>
          <p className="font-mono text-[10px] text-brand-foam/50 uppercase tracking-widest pl-1">
            v2.0 // EST. 2025
          </p>
        </div>

        <div className="flex gap-8 font-mono text-xs text-brand-foam/60">
          <a href="#" className="hover:text-brand-acid transition-colors uppercase decoration-brand-rogue/50 decoration-wavy hover:underline">
            Legal_Protocols
          </a>
          <a href="#" className="hover:text-brand-acid transition-colors uppercase decoration-brand-rogue/50 decoration-wavy hover:underline">
            System_Status
          </a>
        </div>

        <div className="flex flex-col gap-2 border-l border-brand-rogue/30 pl-6">
          <h4 className="font-mono text-xs text-brand-rogue font-bold mb-2">// OPERATIONAL_DOCTRINE</h4>
          <ul className="font-mono text-[10px] text-brand-foam/80 space-y-1 uppercase tracking-wider">
            <li>No Algorithmic Ratings.</li>
            <li>No Public Feeds.</li>
            <li>Local Knowledge Is King.</li>
            <li>Signal Over Noise.</li>
          </ul>
        </div>

        <div className="text-right">
          <p className="font-mono text-[10px] text-brand-concrete uppercase">
            &copy; 2025 WAVE_WIRE
          </p>
          <p className="font-mono text-[10px] text-brand-rogue uppercase mt-1">
            JUST_WAVES. NO_TROUBLE.
          </p>
        </div>
      </div>
    </footer>
  );
}
