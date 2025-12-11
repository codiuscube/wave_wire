import { Sliders, BrainCircuit, Anchor } from 'lucide-react';

const features = [
  {
    icon: Sliders,
    title: 'You define the Vibe',
    description:
      'Set your specific triggers. Define what "Fun" means to you (e.g., >3ft, <10mph wind). We monitor it so you don\'t have to.',
  },
  {
    icon: BrainCircuit,
    title: 'AI Personality',
    description:
      'Powered by Claude 4.5. No robot reports ("3ft at 9s"). You get a hyped-up text that sounds like a local buddy telling you to get out there.',
  },
  {
    icon: Anchor,
    title: 'Smart Validation',
    description:
      "We don't just trust models. We cross-reference Open-Meteo forecasts with real-time NOAA Buoy data to ensure the swell is actually in the water.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 border-b border-border bg-zinc-950/30">
      <div className="container mx-auto px-6">
        <div className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            No Bullshit. Just Waves.
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Most surf apps are cluttered with ads, social feeds, and cameras.
            Home Break is a utility that lives in the background.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group border border-border bg-card p-8 rounded-xl hover:border-zinc-700 transition-all"
            >
              <div className="h-12 w-12 rounded-lg bg-zinc-900 border border-border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="text-white w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
