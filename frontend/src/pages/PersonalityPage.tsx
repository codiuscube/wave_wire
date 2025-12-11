import { useState } from 'react';
import { MessageSquare, Sparkles, Check } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
} from '../components/ui';

interface Personality {
  id: string;
  name: string;
  description: string;
  emoji: string;
  example: string;
}

const personalities: Personality[] = [
  {
    id: 'stoked_local',
    name: 'Stoked Local',
    description: 'Your hyped-up buddy who gets way too excited about any swell.',
    emoji: '🤙',
    example:
      "DUDE. Surfside is FIRING right now. 5ft sets rolling through, offshore wind, and it's gonna be glassy until 10. Get your ass in the car. NOW. Don't even shower.",
  },
  {
    id: 'chill_surfer',
    name: 'Chill Surfer',
    description: 'Laid back vibes. Never too hyped, never too bummed.',
    emoji: '🌊',
    example:
      "Hey, looking pretty nice out there. 4ft @ 11s, light offshore. Should be a fun one if you can make it. No rush, but conditions are holding.",
  },
  {
    id: 'data_nerd',
    name: 'Data Nerd',
    description: 'Just the facts. Numbers, periods, directions. Pure data.',
    emoji: '📊',
    example:
      "Alert: Conditions met. Buoy 42035 reading 4.2ft @ 12s (SE 145°). Wind: 8mph NW (offshore). Water: 72°F. Forecast: Holding through 1400. Traffic: 47min.",
  },
  {
    id: 'hype_beast',
    name: 'Hype Beast',
    description: 'Maximum energy. Every swell is the swell of the century.',
    emoji: '🔥',
    example:
      "🚨 EMERGENCY SURF ALERT 🚨 THIS IS NOT A DRILL. THE OCEAN IS LITERALLY PERFECT RIGHT NOW. 5FT BOMBS. OFFSHORE. NOBODY OUT. YOUR BOSS WILL UNDERSTAND. GOOOOOO!!!",
  },
];

export function PersonalityPage() {
  const [selectedPersonality, setSelectedPersonality] = useState('stoked_local');

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">AI Personality</h1>
        <p className="text-muted-foreground mt-1">
          Choose how your surf buddy talks to you. Powered by Claude 4.5.
        </p>
      </div>

      {/* Current Preview */}
      <Card className="mb-8 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Message Preview
          </CardTitle>
          <CardDescription>
            This is what your alerts will sound like
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="glass-panel p-4 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-black shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-semibold text-sm">Home Break</h4>
                  <span className="text-[10px] text-muted-foreground">Just now</span>
                </div>
                <p className="text-sm text-zinc-200 leading-relaxed">
                  {personalities.find((p) => p.id === selectedPersonality)?.example}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personality Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {personalities.map((personality) => (
          <Card
            key={personality.id}
            className={`cursor-pointer transition-all hover:border-zinc-600 ${
              selectedPersonality === personality.id ? 'border-primary' : ''
            }`}
            onClick={() => setSelectedPersonality(personality.id)}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{personality.emoji}</span>
                  <div>
                    <h3 className="font-bold">{personality.name}</h3>
                  </div>
                </div>
                {selectedPersonality === personality.id && (
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {personality.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Settings */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Message Settings</CardTitle>
          <CardDescription>Fine-tune your notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
            <div>
              <p className="font-medium">Include Emoji</p>
              <p className="text-sm text-muted-foreground">
                Add emoji to make messages pop
              </p>
            </div>
            <Badge variant="success">On</Badge>
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
            <div>
              <p className="font-medium">Include Buoy Data</p>
              <p className="text-sm text-muted-foreground">
                Show raw numbers alongside the vibe (only for spots with buoys)
              </p>
            </div>
            <Badge variant="secondary">Off</Badge>
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
            <div>
              <p className="font-medium">Include Traffic</p>
              <p className="text-sm text-muted-foreground">
                Show drive time in alerts (requires home address)
              </p>
            </div>
            <Badge variant="success">On</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="mt-8 flex justify-end">
        <Button size="lg">Save Personality</Button>
      </div>
    </div>
  );
}
