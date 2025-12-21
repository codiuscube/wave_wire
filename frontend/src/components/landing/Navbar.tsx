import { useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../ui/Logo";
import { WaitlistModal } from "../ui";

export function Navbar() {
  const [showWaitlist, setShowWaitlist] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-brand-abyss/40 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 text-brand-acid group">
          <div className="transform -rotate-6 transition-transform group-hover:rotate-0 duration-300">
            <Logo className="w-8 h-8 sm:w-12 sm:h-12" style={{ filter: 'drop-shadow(0 0 2px rgba(226,253,92,0.5))' }} />
          </div>
          <span className="font-display font-bold text-xl tracking-wider text-white">
            WAVE_WIRE
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            to="/login"
            className="text-xs font-mono text-brand-foam/60 hover:text-brand-acid transition-colors"
          >
            <span className="block sm:hidden">LOGIN</span>
            <span className="hidden sm:block">LOGIN TO BETA</span>
          </Link>

          <button
            onClick={() => setShowWaitlist(true)}
            className="hidden sm:block font-mono text-xs border border-brand-acid/50 text-brand-acid px-4 py-1.5 hover:bg-brand-acid hover:text-brand-abyss transition-all uppercase tracking-wider"
          >
            JOIN WAITLIST
          </button>
        </div>
      </div>

      <WaitlistModal
        isOpen={showWaitlist}
        onClose={() => setShowWaitlist(false)}
      />
    </nav>
  );
}
