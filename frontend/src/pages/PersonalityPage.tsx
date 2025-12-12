import { useState } from "react";
import { Check, MapPin } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Switch,
} from "../components/ui";

type PersonalityId = "stoked_local" | "chill_surfer" | "data_nerd" | "hype_beast";
type TriggerCondition = "fair" | "good" | "epic";

interface Personality {
  id: PersonalityId;
  name: string;
  description: string;
  emoji: string;
}

const personalities: Personality[] = [
  {
    id: "stoked_local",
    name: "Stoked Local",
    description: "Hyped-up buddy energy",
    emoji: "🤙",
  },
  {
    id: "chill_surfer",
    name: "Chill Surfer",
    description: "Laid back, no pressure",
    emoji: "🌊",
  },
  {
    id: "data_nerd",
    name: "Data Nerd",
    description: "Just the numbers",
    emoji: "📊",
  },
  {
    id: "hype_beast",
    name: "Hype Beast",
    description: "Maximum energy",
    emoji: "🔥",
  },
];

const triggerConfig: { condition: TriggerCondition; label: string; color: string; bgColor: string; borderColor: string; description: string }[] = [
  { condition: "fair", label: "Fair", color: "text-yellow-400", bgColor: "bg-yellow-500", borderColor: "border-yellow-500", description: "Met minimum threshold" },
  { condition: "good", label: "Good", color: "text-green-400", bgColor: "bg-green-500", borderColor: "border-green-500", description: "Solid, worth the drive" },
  { condition: "epic", label: "Epic", color: "text-purple-400", bgColor: "bg-purple-500", borderColor: "border-purple-500", description: "Drop everything" },
];

export function PersonalityPage() {
  // Active condition being configured
  const [activeCondition, setActiveCondition] = useState<TriggerCondition>("good");

  // Personality per trigger condition
  const [personalityByCondition, setPersonalityByCondition] = useState<Record<TriggerCondition, PersonalityId>>({
    fair: "data_nerd",
    good: "stoked_local",
    epic: "hype_beast",
  });

  const [includeEmoji, setIncludeEmoji] = useState(true);
  const [includeBuoyData, setIncludeBuoyData] = useState(false);
  const [includeTraffic, setIncludeTraffic] = useState(true);

  // User's home location for local flavor
  const userRegion = "Texas Gulf Coast";

  const updatePersonalityForCondition = (personality: PersonalityId) => {
    setPersonalityByCondition(prev => ({ ...prev, [activeCondition]: personality }));
  };

  // Generate preview message
  const getPreviewMessage = () => {
    const data = {
      spot: "Surfside",
      forecast: { height: "4.2ft", period: "12s", dir: "SE" },
      wind: { speed: "8mph", dir: "NW" },
      buoy: { id: "42035", height: "3ft", period: "15s", time: "6am" },
      water: "72°F",
      drive: { time: "45min", traffic: "heavy" },
    };

    const localFlavor = {
      traffic: ["I-45's already packed", "traffic on 288 ain't bad", "Galveston causeway clear"],
    };

    const selectedPersonality = personalityByCondition[activeCondition];

    // STOKED LOCAL
    if (selectedPersonality === "stoked_local") {
      if (activeCondition === "epic") {
        let msg = includeEmoji ? "🤙🔥 " : "";
        msg += `DUDE! ${data.spot} is FIRING - rare Texas glass! ${data.forecast.height} @ ${data.forecast.period} from the ${data.forecast.dir}, ${data.wind.speed} ${data.wind.dir} keeping it CLEAN.`;
        if (includeBuoyData) msg += ` Buoy ${data.buoy.id}: ${data.buoy.height} @ ${data.buoy.period} at ${data.buoy.time} - building! ${data.water}.`;
        if (includeTraffic) msg += ` ${data.drive.time}, ${localFlavor.traffic[0]} but WHO CARES!`;
        msg += includeEmoji ? " Get there before the Houston crowd! 🏄‍♂️" : " Get there before Houston!";
        return msg;
      } else if (activeCondition === "good") {
        let msg = includeEmoji ? "🤙 " : "";
        msg += `${data.spot}'s looking good! Gulf's cooperating - ${data.forecast.height} @ ${data.forecast.period} ${data.forecast.dir}, ${data.wind.speed} ${data.wind.dir}.`;
        if (includeBuoyData) msg += ` Buoy ${data.buoy.id}: ${data.buoy.height} @ ${data.buoy.period}. ${data.water}.`;
        if (includeTraffic) msg += ` ${data.drive.time}, ${data.drive.traffic} traffic on 288.`;
        msg += " Worth the drive!";
        return msg;
      } else {
        let msg = includeEmoji ? "🤷 " : "";
        msg += `${data.spot}'s okay - nothing special but hey, it's Texas. ${data.forecast.height} @ ${data.forecast.period} ${data.forecast.dir}.`;
        if (includeBuoyData) msg += ` Buoy ${data.buoy.id}: ${data.buoy.height} @ ${data.buoy.period}. ${data.water}.`;
        if (includeTraffic) msg += ` ${data.drive.time} if ${localFlavor.traffic[1]}.`;
        msg += " Could scratch the itch.";
        return msg;
      }
    }

    // CHILL SURFER
    if (selectedPersonality === "chill_surfer") {
      if (activeCondition === "epic") {
        let msg = `Hey - ${data.spot}'s actually really nice. ${data.forecast.height} @ ${data.forecast.period} ${data.forecast.dir}, ${data.wind.speed} ${data.wind.dir}. Clean for the Gulf.`;
        if (includeBuoyData) msg += ` Buoy ${data.buoy.id}: ${data.buoy.height} @ ${data.buoy.period}. ${data.water}.`;
        if (includeTraffic) msg += ` ${data.drive.time} down there.`;
        msg += " Definitely worth it.";
        return msg;
      } else if (activeCondition === "good") {
        let msg = `${data.spot}'s looking fun. ${data.forecast.height} @ ${data.forecast.period} ${data.forecast.dir}, ${data.wind.speed} ${data.wind.dir}.`;
        if (includeBuoyData) msg += ` Buoy ${data.buoy.id}: ${data.buoy.height} @ ${data.buoy.period}. ${data.water}.`;
        if (includeTraffic) msg += ` About ${data.drive.time}.`;
        msg += " Could be a nice session.";
        return msg;
      } else {
        let msg = `${data.spot}'s meh. ${data.forecast.height} @ ${data.forecast.period}, ${data.wind.speed} ${data.wind.dir}.`;
        if (includeBuoyData) msg += ` Buoy ${data.buoy.id}: ${data.buoy.height} @ ${data.buoy.period}. ${data.water}.`;
        if (includeTraffic) msg += ` ${data.drive.time}.`;
        msg += " Up to you.";
        return msg;
      }
    }

    // DATA NERD
    if (selectedPersonality === "data_nerd") {
      const status = activeCondition.charAt(0).toUpperCase() + activeCondition.slice(1);
      let msg = `${data.spot.toUpperCase()}: ${data.forecast.height} @ ${data.forecast.period} ${data.forecast.dir} | Wind: ${data.wind.speed} ${data.wind.dir}`;
      if (includeBuoyData) msg += ` | Buoy ${data.buoy.id}: ${data.buoy.height} @ ${data.buoy.period} (${data.buoy.time}) | ${data.water}`;
      if (includeTraffic) msg += ` | ETA: ${data.drive.time}`;
      msg += ` | ${status}`;
      return msg;
    }

    // HYPE BEAST
    if (selectedPersonality === "hype_beast") {
      if (activeCondition === "epic") {
        let msg = includeEmoji ? "🚨🚨🚨 " : "";
        msg += `THIS IS NOT A DRILL!! ${data.spot.toUpperCase()} IS GOING OFF - BEST GULF SWELL THIS YEAR!! ${data.forecast.height} @ ${data.forecast.period} ${data.forecast.dir}!! ${data.wind.speed} ${data.wind.dir} = GLASS!!`;
        if (includeBuoyData) msg += ` BUOY ${data.buoy.id}: ${data.buoy.height} @ ${data.buoy.period} AND BUILDING!! ${data.water}!!`;
        if (includeTraffic) msg += ` ${data.drive.time} - BEAT THE HOUSTON TRAFFIC!!`;
        msg += includeEmoji ? " CALL IN SICK!! 🏄‍♂️🔥🔥🔥" : " CALL IN SICK!!";
        return msg;
      } else if (activeCondition === "good") {
        let msg = includeEmoji ? "🚨 " : "";
        msg += `${data.spot.toUpperCase()} IS PUMPING!! ${data.forecast.height} @ ${data.forecast.period} ${data.forecast.dir}!! ${data.wind.speed} ${data.wind.dir}!!`;
        if (includeBuoyData) msg += ` Buoy ${data.buoy.id}: ${data.buoy.height} @ ${data.buoy.period}!! ${data.water}!!`;
        if (includeTraffic) msg += ` ${data.drive.time} - GO GO GO!!`;
        msg += includeEmoji ? " 🏄‍♂️🔥" : "";
        return msg;
      } else {
        let msg = includeEmoji ? "👀 " : "";
        msg += `${data.spot} hit Fair - ${data.forecast.height} @ ${data.forecast.period} ${data.forecast.dir}, ${data.wind.speed} ${data.wind.dir}.`;
        if (includeBuoyData) msg += ` Buoy ${data.buoy.id}: ${data.buoy.height} @ ${data.buoy.period}. ${data.water}.`;
        if (includeTraffic) msg += ` ${data.drive.time}.`;
        msg += " Not epic but waves are waves!";
        return msg;
      }
    }

    return "";
  };

  const activeConfig = triggerConfig.find(t => t.condition === activeCondition)!;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Message Personality</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Different vibes for different conditions
        </p>
      </div>

      {/* Condition Tabs - Large, Primary Navigation */}
      <div className="flex gap-2 mb-4">
        {triggerConfig.map(({ condition, label, bgColor }) => {
          const isActive = activeCondition === condition;
          const emoji = personalities.find(p => p.id === personalityByCondition[condition])?.emoji;
          return (
            <button
              key={condition}
              onClick={() => setActiveCondition(condition)}
              className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl font-medium transition-all text-sm sm:text-base ${isActive
                ? `${bgColor} text-white shadow-lg`
                : `bg-muted text-muted-foreground hover:bg-accent border-2 border-transparent`
                }`}
            >
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <span>{label}</span>
                <span className="text-base sm:text-lg">{emoji}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Preview - Prominent, Updates Live */}
      <Card className={`mb-4 sm:mb-6 border-2 ${activeConfig.borderColor} bg-card`}>
        <CardContent className="pt-3 sm:pt-4">
          {/* iOS Messages Style */}
          <div className="bg-muted rounded-2xl p-3 sm:p-4">
            <div className="text-center mb-3 pb-2 border-b border-border">
              <p className="text-[10px] text-muted-foreground uppercase">Text Message</p>
              <p className="font-semibold text-sm text-foreground">Home Break (512) 555-0123</p>
            </div>

            <div className="flex justify-start">
              <div className="bg-[#34C759] text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl rounded-bl-md shadow-sm max-w-[98%] sm:max-w-[95%]">
                <p className="text-[13px] sm:text-[14px] leading-snug">{getPreviewMessage()}</p>
              </div>
            </div>

            <div className="text-center mt-2">
              <span className="text-[11px] text-muted-foreground">Just now</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personality Selection for Active Condition */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="pb-3 px-4 sm:px-6">
          <CardTitle className="text-sm sm:text-base flex flex-wrap items-center gap-1 sm:gap-2">
            <span className={activeConfig.color}>When {activeConfig.label}:</span>
            <span className="text-muted-foreground font-normal text-xs sm:text-sm">use this voice</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {personalities.map((personality) => {
              const isSelected = personalityByCondition[activeCondition] === personality.id;
              return (
                <button
                  key={personality.id}
                  onClick={() => updatePersonalityForCondition(personality.id)}
                  className={`p-3 sm:p-4 rounded-xl border-2 text-left transition-all ${isSelected
                    ? `${activeConfig.borderColor} bg-accent/50`
                    : "border-border hover:border-muted-foreground"
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl sm:text-2xl">{personality.emoji}</span>
                    {isSelected && <Check className={`w-4 h-4 ${activeConfig.color}`} />}
                  </div>
                  <p className="font-medium text-xs sm:text-sm">{personality.name}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{personality.description}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Message Options */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="pb-3 px-4 sm:px-6">
          <CardTitle className="text-sm sm:text-base">Include in Messages</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            <div className={`flex items-center justify-between p-3 rounded-lg border ${includeEmoji ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <span className="text-sm font-medium">Emoji</span>
              <Switch checked={includeEmoji} onChange={setIncludeEmoji} />
            </div>
            <div className={`flex items-center justify-between p-3 rounded-lg border ${includeBuoyData ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <span className="text-sm font-medium">Buoy Data</span>
              <Switch checked={includeBuoyData} onChange={setIncludeBuoyData} />
            </div>
            <div className={`flex items-center justify-between p-3 rounded-lg border ${includeTraffic ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <span className="text-sm font-medium">Traffic</span>
              <Switch checked={includeTraffic} onChange={setIncludeTraffic} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Context - Small Footer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 shrink-0" />
          <span>Local flavor tuned for <span className="text-foreground">{userRegion}</span></span>
        </div>
        <Button size="lg" className="w-full sm:w-auto">Save Settings</Button>
      </div>
    </div>
  );
}
