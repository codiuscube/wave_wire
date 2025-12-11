export function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Night Before Hype (8:00 PM)',
      description: 'Checks tomorrow\'s forecast against your "Good" tier. Helps you plan your alarm.',
    },
    {
      number: '02',
      title: 'Morning Reality Check (6:00 AM)',
      description: 'Validates live buoy data. Checks Google Traffic. Gives you a "Go/No-Go" with drive time.',
    },
    {
      number: '03',
      title: 'Pop-Up Alert',
      description: 'Runs every 2 hours. Catches wind switches or sudden pulse arrivals.',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 border-b border-border relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-6">
              The "Smart" Triggers
            </h2>
            <div className="space-y-8">
              {steps.map((step, index) => (
                <div key={step.number} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-border flex items-center justify-center text-xs font-bold font-mono">
                      {step.number}
                    </div>
                    {index < steps.length - 1 && (
                      <div className="h-full w-px bg-border my-2" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Code Block Visual */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-linear-to-r from-zinc-700 to-zinc-900 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000" />
            <div className="relative rounded-lg bg-[#0d0d0d] border border-border p-4 font-mono text-xs md:text-sm text-zinc-300 shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                <span className="ml-2 text-zinc-500">alert_logic.ts</span>
              </div>
              <div className="space-y-1">
                <p>
                  <span className="text-purple-400">const</span> checkSurf =
                  <span className="text-blue-400"> async</span> (spot) =&gt; {'{'}
                </p>
                <p className="pl-4">
                  <span className="text-zinc-500">// 1. Get Ground Truth</span>
                </p>
                <p className="pl-4">
                  <span className="text-purple-400">const</span> buoy =
                  <span className="text-blue-400"> await</span>{' '}
                  NOAA.getBuoy(spot.buoyId);
                </p>
                <p className="pl-4">
                  <span className="text-purple-400">const</span> weather =
                  <span className="text-blue-400"> await</span>{' '}
                  OpenMeteo.get(spot.lat, spot.lon);
                </p>
                <br />
                <p className="pl-4">
                  <span className="text-zinc-500">// 2. Check User Preferences</span>
                </p>
                <p className="pl-4">
                  <span className="text-purple-400">if</span> (buoy.height &gt;=
                  spot.minHeight && weather.wind ===
                  <span className="text-green-400"> 'offshore'</span>) {'{'}
                </p>
                <p className="pl-8">
                  <span className="text-zinc-500">// 3. Generate Personality</span>
                </p>
                <p className="pl-8">
                  <span className="text-purple-400">const</span> hype =
                  <span className="text-blue-400"> await</span> Claude.generate({'{'}
                </p>
                <p className="pl-12">
                  vibe: <span className="text-green-400">'stoked_local'</span>,
                </p>
                <p className="pl-12">
                  data: {'{'} wave: buoy.height, period: buoy.period {'}'}
                </p>
                <p className="pl-8">{'}'});</p>
                <p className="pl-8">
                  <span className="text-blue-400">return</span>{' '}
                  sendSMS(spot.userPhone, hype);
                </p>
                <p className="pl-4">{'}'}</p>
                <p>{'}'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
