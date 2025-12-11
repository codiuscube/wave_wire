import { ArrowRight, Database, Bot, Zap, Waves, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui';

export function Hero() {
  return (
    <header className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden border-b border-border">
      <div className="absolute inset-0 grid-bg -z-10 opacity-30" />
      <div className="scanline" />

      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          {/* Hero Text */}
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" />
              v1.0 Ready to Build
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[1.1] glow-text">
              The Invisible <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-white to-zinc-500">
                Surf Check.
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
              No ads. No social feeds. No noise. Just a personalized AI buddy
              that texts you when your spot is actually firing.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/dashboard">
                <Button size="lg">
                  Set Your Break
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="pt-8 flex items-center gap-4 text-xs text-muted-foreground font-mono">
              <div className="flex items-center gap-2">
                <Database className="w-3 h-3" /> NOAA Data
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="flex items-center gap-2">
                <Bot className="w-3 h-3" /> Claude 4.5 Haiku
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3" /> Real-time
              </div>
            </div>
          </div>

          {/* Hero Visual (The Notification) */}
          <div className="flex-1 relative w-full max-w-sm">
            {/* Glow effect behind */}
            <div className="absolute -inset-1 bg-linear-to-r from-blue-500 to-purple-600 rounded-2xl blur-3xl opacity-20" />

            {/* Phone Mockup Container */}
            <div className="relative bg-zinc-950 border border-border rounded-[2rem] p-4 shadow-2xl">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-950 rounded-b-xl border-b border-l border-r border-border z-20" />

              {/* Screen */}
              <div className="bg-zinc-900/50 rounded-2xl overflow-hidden h-[500px] flex flex-col relative">
                {/* Wallpaper/Map */}
                <div className="absolute inset-0 bg-zinc-900">
                  <img
                    src="https://images.unsplash.com/photo-1517627043994-b991abb62fc8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                    className="w-full h-full object-cover opacity-20 grayscale"
                    alt="Ocean map"
                  />
                </div>

                {/* Notification Element */}
                <div className="mt-20 mx-4 z-10 space-y-4">
                  {/* Actual Notification */}
                  <div className="glass-panel p-4 rounded-xl shadow-lg animate-[slideIn_1s_ease-out]">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-black">
                        <Waves className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-semibold text-sm">Home Break</h4>
                          <span className="text-[10px] text-muted-foreground">Now</span>
                        </div>
                        <p className="text-sm text-zinc-200 leading-snug">
                          {' '}<span className="font-bold text-white">OMFG Alert:</span>{' '}
                          Surfside is firing. 5ft sets and offshore wind. Go now.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Morning Reality Check */}
                  <div className="glass-panel p-4 rounded-xl shadow-lg opacity-60 scale-95 origin-top">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                        <Check className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-semibold text-xs text-zinc-400">06:00 AM Check</h4>
                        </div>
                        <p className="text-xs text-zinc-500 font-mono">
                          Buoy: 4ft @ 11s (NW)<br />
                          Traffic: 45m drive.<br />
                          Verdict: Green Light.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom UI */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-zinc-950 to-transparent">
                  <div className="flex justify-center">
                    <div className="h-1 w-12 bg-zinc-700 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
