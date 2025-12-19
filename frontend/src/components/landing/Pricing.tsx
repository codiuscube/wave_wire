import { useState } from 'react';
import { Bolt } from '@solar-icons/react';
import { Link } from 'react-router-dom';
import { ComingSoonModal } from '../ui';
import { isProduction } from '../../utils/environment';

export function Pricing() {
  const [showComingSoon, setShowComingSoon] = useState(false);

  return (
    <section id="pricing" className="py-32 relative bg-brand-abyss overflow-hidden">
      {/* Background Texture */}
      <div className="absolute inset-0 grunge-overlay opacity-30"></div>

      <div className="container mx-auto px-6 max-w-5xl relative z-10">
        <div className="text-center mb-24">
          {/* Tape Effect Removed */}
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-black font-display tracking-tighter text-white uppercase leading-[0.8] mb-6">
            SIMPLE<br /><span className="text-brand-concrete">PRICING</span>
          </h2>
          <p className="font-mono text-lg md:text-xl text-brand-foam/80 max-w-lg mx-auto border-t border-white/20 pt-6">
            <span className="inline-block bg-brand-rogue text-brand-abyss px-2 py-0.5 transform -rotate-1 mb-2 font-mono text-xs font-bold tracking-widest tape">
              // STATUS: OPEN_BETA
            </span><br />
            Start free. Upgrade when you need more. No hidden fees. No contracts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto px-4">
          {/* Free Tier - Brutalist Ticket Stub */}
          <div className="relative group md:rotate-2 md:mt-12 transition-transform hover:rotate-0 hover:z-20 hover:scale-105 duration-300">
            <div className="absolute inset-0 bg-white/5 transform translate-x-2 translate-y-2 border border-brand-concrete/30"></div>
            <div className="relative bg-brand-abyss border-2 border-brand-concrete p-8 h-full flex flex-col hover:border-white transition-colors shadow-2xl">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-abyss px-4 font-mono text-xs text-brand-concrete border border-brand-concrete/30">
                ENTRY_LEVEL
              </div>

              <h3 className="text-3xl font-black font-display text-white mb-2">MONITOR</h3>
              <div className="text-5xl font-mono text-brand-concrete mb-6 opacity-50">$0</div>

              <ul className="space-y-4 mb-8 font-mono text-sm text-brand-foam/60 flex-1">
                <li className="flex items-center gap-3">
                  <Bolt weight="Bold" size={16} className="text-brand-concrete" /> 1 spot
                </li>
                <li className="flex items-center gap-3">
                  <Bolt weight="Bold" size={16} className="text-brand-concrete" /> 1 trigger
                </li>
                <li className="flex items-center gap-3">
                  <Bolt weight="Bold" size={16} className="text-brand-concrete" /> 5 SMS alerts / mo
                </li>
              </ul>

              {isProduction() ? (
                <button onClick={() => setShowComingSoon(true)} className="w-full py-4 border border-brand-concrete text-brand-concrete hover:bg-brand-concrete hover:text-brand-abyss font-mono font-bold uppercase tracking-widest transition-all">
                  INITIATE
                </button>
              ) : (
                <Link to="/dashboard" className="block text-center w-full py-4 border border-brand-concrete text-brand-concrete hover:bg-brand-concrete hover:text-brand-abyss font-mono font-bold uppercase tracking-widest transition-all">
                  INITIATE
                </Link>
              )}

              {/* Torn edge decoration */}
              <div className="absolute -bottom-2 left-0 right-0 h-4 bg-brand-abyss torn-bottom transform rotate-180"></div>
            </div>
          </div>

          {/* Unlimited Tier - Hacked/Glitch Card */}
          <div className="relative group md:-rotate-2 md:-mt-8 transition-transform hover:rotate-0 hover:z-20 hover:scale-105 duration-300">
            {/* Glitch borders */}
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-acid to-brand-rogue opacity-50 blur-sm group-hover:opacity-80 transition-opacity"></div>

            <div className="relative bg-black border-2 border-brand-acid p-8 h-full flex flex-col">
              <div className="absolute top-0 right-0 bg-brand-acid text-brand-abyss font-bold text-xs px-3 py-1 font-mono uppercase">
                RECOMMENDED
              </div>

              <h3 className="text-3xl font-black font-display text-white mb-2 text-brand-acid flicker">COMMAND</h3>
              <div className="text-5xl font-mono text-white mb-6">$5<span className="text-lg text-brand-foam/50">/mo</span></div>

              <ul className="space-y-4 mb-8 font-mono text-sm text-white flex-1 relative z-10">
                <li className="flex items-center gap-3">
                  <Bolt weight="Bold" size={16} className="text-brand-acid" /> <span className="font-bold">Unlimited spots</span>
                </li>
                <li className="flex items-center gap-3">
                  <Bolt weight="Bold" size={16} className="text-brand-acid" /> <span className="font-bold">Unlimited triggers</span>
                </li>
                <li className="flex items-center gap-3">
                  <Bolt weight="Bold" size={16} className="text-brand-acid" /> <span className="font-bold">Unlimited SMS</span>
                </li>
                <li className="flex items-center gap-3">
                  <Bolt weight="Bold" size={16} className="text-brand-acid" /> <span className="font-bold">Buoy Verification</span>
                </li>
                <li className="flex items-center gap-3 opacity-60">
                  <Bolt weight="Bold" size={16} className="text-brand-acid" /> Early access features
                </li>
              </ul>

              {/* Decorative Barcode */}
              <div className="h-4 w-full bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAABCAYAAAD5PA/NAAAAFklEQVR42mN88f7/fwYoYAQxEAQ4gAgA7Z0K00s78+YAAAAASUVORK5CYII=')] opacity-30 mb-6 bg-repeat-x"></div>

              {isProduction() ? (
                <button onClick={() => setShowComingSoon(true)} className="w-full py-4 bg-brand-acid text-brand-abyss hover:bg-white font-mono font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                  GET_FULL_ACCESS
                </button>
              ) : (
                <Link to="/dashboard" className="block text-center w-full py-4 bg-brand-acid text-brand-abyss hover:bg-white font-mono font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                  GET_FULL_ACCESS
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <ComingSoonModal isOpen={showComingSoon} onClose={() => setShowComingSoon(false)} />
    </section>
  );
}
