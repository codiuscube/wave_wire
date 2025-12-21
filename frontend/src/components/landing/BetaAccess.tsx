import { useState } from 'react';
import { Bolt, UsersGroupRounded, Gift } from '@solar-icons/react';
import { WaitlistModal } from '../ui';

export function BetaAccess() {
  const [showWaitlist, setShowWaitlist] = useState(false);

  return (
    <section id="beta-access" className="py-32 relative bg-brand-abyss overflow-hidden">
      {/* Background Texture */}
      <div className="absolute inset-0 grunge-overlay opacity-30"></div>

      <div className="container mx-auto px-6 max-w-4xl relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-black font-display tracking-tighter text-white uppercase leading-[0.8] mb-6">
            BETA<br /><span className="text-brand-acid">ACCESS</span>
          </h2>
          <p className="font-mono text-lg md:text-xl text-brand-foam/80 max-w-lg mx-auto border-t border-white/20 pt-6">
            <span className="inline-block bg-brand-acid text-brand-abyss px-2 py-0.5 transform -rotate-1 mb-2 font-mono text-xs font-bold tracking-widest tape">
              // FREE DURING BETA
            </span><br />
            Get full access while we're in beta. No credit card required.
          </p>
        </div>

        {/* Single Beta Card */}
        <div className="max-w-md mx-auto">
          <div className="relative group transition-transform hover:scale-105 duration-300">
            {/* Glitch borders */}
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-acid to-brand-rogue opacity-50 blur-sm group-hover:opacity-80 transition-opacity"></div>

            <div className="relative bg-black border-2 border-brand-acid p-8 flex flex-col">
              <div className="absolute top-0 right-0 bg-brand-acid text-brand-abyss font-bold text-xs px-3 py-1 font-mono uppercase">
                EARLY ACCESS
              </div>

              <h3 className="text-3xl font-black font-display text-brand-acid mb-2">BETA ACCESS</h3>
              {/* <div className="text-5xl font-mono text-white mb-2">$0</div> */}
              <p className="font-mono text-sm text-brand-foam/50 mb-6">WAVE_WIRE IS FREE while in beta</p>

              <ul className="space-y-4 mb-8 font-mono text-sm text-white flex-1 relative z-10">
                <li className="flex items-center gap-3">
                  <Bolt weight="Bold" size={16} className="text-brand-acid" />
                  <span className="font-bold">Unlimited spots</span>
                </li>
                <li className="flex items-center gap-3">
                  <Bolt weight="Bold" size={16} className="text-brand-acid" />
                  <span className="font-bold">Unlimited triggers</span>
                </li>
                <li className="flex items-center gap-3">
                  <Bolt weight="Bold" size={16} className="text-brand-acid" />
                  <span className="font-bold">SMS alerts</span>
                </li>
                <li className="flex items-center gap-3">
                  <Bolt weight="Bold" size={16} className="text-brand-acid" />
                  <span className="font-bold">All features unlocked</span>
                </li>
              </ul>

              {/* Referral callout */}
              <div className="bg-brand-acid/10 border border-brand-acid/30 rounded p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <UsersGroupRounded weight="Bold" size={18} className="text-brand-acid" />
                  <span className="font-mono text-xs uppercase tracking-wider text-brand-acid font-bold">Move up the list</span>
                </div>
                <p className="font-mono text-sm text-brand-foam/70">
                  Invite friends with your referral link. More referrals = higher priority for access.
                </p>
              </div>

              {/* Decorative Barcode */}
              <div className="h-4 w-full bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAABCAYAAAD5PA/NAAAAFklEQVR42mN88f7/fwYoYAQxEAQ4gAgA7Z0K00s78+YAAAAASUVORK5CYII=')] opacity-30 mb-6 bg-repeat-x"></div>

              <button
                onClick={() => setShowWaitlist(true)}
                className="w-full py-4 bg-brand-acid text-brand-abyss hover:bg-white font-mono font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
              >
                JOIN WAITLIST
              </button>
            </div>
          </div>

          {/* Beta perks below card */}
          <div className="mt-8 grid grid-cols-2 gap-4 text-center">
            <div className="bg-white/5 border border-white/10 p-4 rounded">
              <Gift weight="Bold" size={24} className="text-brand-acid mx-auto mb-2" />
              <p className="font-mono text-xs text-brand-foam/60 uppercase tracking-wider">Early Adopter Perks</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded">
              <UsersGroupRounded weight="Bold" size={24} className="text-brand-acid mx-auto mb-2" />
              <p className="font-mono text-xs text-brand-foam/60 uppercase tracking-wider">Limited Spots</p>
            </div>
          </div>
        </div>
      </div>

      <WaitlistModal isOpen={showWaitlist} onClose={() => setShowWaitlist(false)} />
    </section>
  );
}
