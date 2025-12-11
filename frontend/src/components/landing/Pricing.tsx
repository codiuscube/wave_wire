import { Check } from 'lucide-react';
import { Button } from '../ui';

export function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight">
            Simple Financial Model
          </h2>
          <p className="text-muted-foreground mt-2">
            Built for the community. Costs covered by supporters.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Supporter Tier */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-8 flex flex-col relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 bg-white text-black text-[10px] font-bold px-2 py-1 uppercase tracking-wide">
              Most Popular
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white">Supporter</h3>
              <div className="text-3xl font-bold mt-2 text-white">
                Donate
                <span className="text-sm font-normal text-zinc-400"> / coffee</span>
              </div>
              <p className="text-sm text-zinc-400 mt-2">
                Covers SMS API costs (~$0.0079/text).
              </p>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm text-white">
                <Check className="w-4 h-4 text-green-400" />
                <span className="font-bold">Instant SMS Alerts</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-white">
                <Check className="w-4 h-4 text-green-400" />
                Pop-Up Real-time Alerts
              </li>
              <li className="flex items-center gap-3 text-sm text-white">
                <Check className="w-4 h-4 text-green-400" />
                Support Server Costs
              </li>
            </ul>
            <Button className="w-full bg-white text-black hover:bg-zinc-200">
              Become a Supporter
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
