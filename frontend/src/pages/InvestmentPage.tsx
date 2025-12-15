
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar, Footer } from '../components/landing';
import { AdminHeader } from '../components/admin';
import { Check, CircleQuestionMark } from 'lucide-react';

const timelineSlides = [
    {
        number: '01',
        title: 'SEED',
        subtitle: '$750 Capital',
        description: 'Establish legal entity. Secure seed capital for infrastructure and accountability.',
        image: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=2070&auto=format&fit=crop',
        overlay: '[INIT_SEQUENCE] // CAPITAL: $750 // ENTITY: PENDING // STATUS: READY',
    },
    {
        number: '02',
        title: 'BUILD',
        subtitle: 'Jan 1, 2026',
        description: 'Develop MVP. Alpha testing with trusted circle. Target launch: Jan 1, 2026.',
        image: 'https://images.unsplash.com/photo-1455729552865-3658a5d39692?q=80&w=2070&auto=format&fit=crop',
        overlay: '[DEV_MODE] // MVP: IN_PROGRESS // ALPHA_TESTERS: SELECTED // LAUNCH: 01-01-2026',
    },
    {
        number: '03',
        title: 'GROW',
        subtitle: '1,000 Users',
        description: 'Open beta via waitlist. Scale to 1k users. Validate product-market fit.',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2070&auto=format&fit=crop',
        overlay: '[SCALE_UP] // BETA: OPEN // CAP: 1000_USERS // STATUS: VALIDATING',
    },
    {
        number: '04',
        title: 'MONETIZE',
        subtitle: '5,000 Paid',
        description: 'Activate payments. $5/mo premium tier. Cap at 5k paid. Option to hire dev and scale beyond.',
        image: 'https://images.unsplash.com/photo-1509914398892-963f53e6e2f1?q=80&w=2070&auto=format&fit=crop',
        overlay: '[REVENUE_ON] // PAYMENTS: ACTIVE // TIER: $5/MO // CAP: 5000_PAID',
    },
];

export function InvestmentPage() {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');
    const [activeSlide, setActiveSlide] = useState(0);
    const [textsPerUser, setTextsPerUser] = useState(4); // Default 4 texts/user/month
    const [donations, setDonations] = useState(5); // Default to $5
    const [p1Users, setP1Users] = useState(100); // Default 100
    const [p2Users, setP2Users] = useState(2000); // Phase 2 Users, default 2000
    const [conversionRate, setConversionRate] = useState(0.30); // Default 30%

    // Constants
    const COST_PER_TEXT = 0.0106;
    const PRICE_PER_MONTH = 5.00;

    // Phase 1 Calculations
    const p1_revenue = donations;
    const p1_infrastructure = 4.40;
    const p1_sms_cost = p1Users * textsPerUser * COST_PER_TEXT;
    const p1_processing = 0;
    const p1_net_profit = p1_revenue - p1_infrastructure - p1_sms_cost - p1_processing;

    // Phase 1 Runway (Seed Fund $750)
    const p1_runway_days = p1_net_profit < 0 ? Math.floor(750 / Math.abs(p1_net_profit / 30)) : "INFINITE";

    // Phase 2 Calculations
    const p2_paid_users = p2Users * conversionRate;
    const p2_revenue = p2_paid_users * PRICE_PER_MONTH;

    // Costs
    const p2_infrastructure = 24.40;
    const TRAFFIC_REQ_COST = 0.01; // $10/1000 requests
    const REQS_PER_TEXT = 3;
    const TRAFFIC_COST_PER_TEXT = TRAFFIC_REQ_COST * REQS_PER_TEXT;
    const p2_sms_cost = p2_paid_users * textsPerUser * (COST_PER_TEXT + TRAFFIC_COST_PER_TEXT);

    // Stripe: 2.9% + $0.30 per txn
    const p2_processing = (p2_revenue * 0.029) + (p2_paid_users * 0.30);

    const p2_net_profit = p2_revenue - p2_infrastructure - p2_sms_cost - p2_processing;
    const p2_payoff = p2_net_profit * 0.33;
    const roi_days = p2_payoff > 0 ? Math.ceil(250 / (p2_payoff / 30)) : "NEVER";

    const roi_10x_days = p2_payoff > 0 ? Math.ceil(2500 / (p2_payoff / 30)) : "NEVER";

    // Format currency helper
    const formatCurrency = (val: number) => {
        const sign = val < 0 ? "-" : (val > 0 ? "+" : "");
        return `${sign}$${Math.abs(val).toFixed(2)} `;
    };

    return (
        <div className={`min-h-screen flex flex-col font-sans selection:bg-brand-acid selection:text-brand-abyss relative ${isAdminRoute ? 'bg-background text-foreground' : 'bg-brand-abyss text-brand-foam'}`}>
            {!isAdminRoute && <div className="grunge-overlay opacity-20 pointer-events-none"></div>}
            {!isAdminRoute && <Navbar />}

            <main className={`flex-grow pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full ${isAdminRoute ? 'pt-6' : 'pt-24'}`}>
                {isAdminRoute && <AdminHeader />}

                {/* Header Section */}
                <div className="mb-12 border-b-2 border-dashed border-white/10 pb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
                        <div>
                            <span className="inline-block bg-brand-rogue text-brand-abyss px-2 py-0.5 transform -rotate-1 font-mono text-xs font-bold tracking-widest mb-3 tape">
                                CONFIDENTIAL // INTERNAL USE ONLY
                            </span>
                            <h1 className="text-5xl md:text-7xl font-black text-white font-display tracking-tight uppercase glitch-text" data-text="INTERNAL DEAL SHEET">
                                INTERNAL DEAL SHEET
                            </h1>
                        </div>
                        <div className="text-right hidden md:block">
                            <div className="font-mono text-base text-brand-acid">financial_model_v2.exe</div>
                            <div className="font-mono text-sm text-brand-foam/60">LAST UPDATED: 2024-12-14</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 font-mono text-sm border-t border-white/10 pt-6">
                        <div className="flex flex-col">
                            <span className="text-brand-rogue font-bold mb-1 uppercase tracking-wider">PARTNERSHIP</span>
                            <span className="text-white text-xl sm:text-2xl">3 Partners</span>
                        </div>
                        <div className="flex flex-col md:items-center">
                            <span className="text-brand-rogue font-bold mb-1 uppercase tracking-wider">SPLIT</span>
                            <span className="text-white text-xl sm:text-2xl">33% Each</span>
                        </div>
                        <div className="flex flex-col md:items-center">
                            <span className="text-brand-rogue font-bold mb-1 uppercase tracking-wider">CAPITAL NEEDED</span>
                            <span className="text-white text-xl sm:text-2xl">$750</span>
                        </div>
                        <div className="flex flex-col md:items-end">
                            <span className="text-brand-rogue font-bold mb-1 uppercase tracking-wider">6 MONTH TARGET</span>
                            <span className="text-white text-xl sm:text-2xl">1k MAU (Beta)</span>
                        </div>
                    </div>
                </div>

                {/* Financial Core Section */}
                <div className="mb-16">
                    <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-6 flex items-center gap-3 uppercase tracking-tight">
                        <span className="w-2 h-2 bg-brand-acid"></span>
                        GO-TO-MARKET:
                    </h2>

                    {/* Summary */}
                    <div className="bg-brand-rogue/10 border border-brand-rogue/30 p-6 sm:p-8 mb-8 relative">
                        <span className="absolute top-0 right-0 -translate-y-1/2 translate-x-2 inline-block bg-brand-rogue text-brand-abyss px-2 py-0.5 transform rotate-1 font-mono text-xs font-bold tracking-widest tape">
                            // MISSION_PROFILE
                        </span>
                        <h3 className="font-bold text-white mb-4 text-xl sm:text-2xl font-display">SUMMARY</h3>
                        <p className="text-brand-foam/90 text-base sm:text-lg leading-relaxed mb-6 max-w-3xl">
                            We're building Wave_Wire because we're tired of missing windows. It’s a tool that watches the buoys and models 24/7, then texts you when it’s actually on. No social feeds, no noise.
                        </p>
                        <p className="text-brand-foam/90 text-base sm:text-lg leading-relaxed mb-6 max-w-3xl">
                            <strong>The Plan:</strong> We're opening it up to a limited crew on a donation basis to cover server costs. Once we validate the concept, we'll introduce a simple commercial tier. The goal remains simple: score more waves, spend less time checking apps.
                        </p>
                        <p className="text-brand-foam/90 text-base sm:text-lg leading-relaxed mb-6 max-w-3xl font-medium">
                            $750 in, break-even at 6 subscribers, self-funding thereafter. 100% founder-owned with no debt. Cap it at 5k paid users and collect passive income—or double down and scale.
                        </p>
                        <div className="border-t border-brand-rogue/20 pt-6 mt-6">
                            <span className="inline-block bg-brand-rogue text-brand-abyss px-2 py-0.5 transform -rotate-1 font-mono text-xs font-bold tracking-widest mb-4 tape">
                                STRATEGIC VIABILITY
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                <div className="group">
                                    <strong className="text-white block mb-1 font-display tracking-wide text-base group-hover:text-brand-acid transition-colors">› BREAK-EVEN THRESHOLD</strong>
                                    <span className="text-brand-foam/80 text-base leading-relaxed block pl-4 border-l border-brand-rogue/30">In Phase 2, Wave_Wire achieves self-sustainment at just ~6 paid subscribers (~20 total users at 30% conversion).</span>
                                </div>
                                <div className="group">
                                    <strong className="text-white block mb-1 font-display tracking-wide text-base group-hover:text-brand-acid transition-colors">› SELF-SUSTAINING</strong>
                                    <span className="text-brand-foam/80 text-base leading-relaxed block pl-4 border-l border-brand-rogue/30">At $5/mo with ~$25 OpEx, the project funds itself. Architecture scales to 5k+ users at no extra fixed cost.</span>
                                </div>
                                <div className="group">
                                    <strong className="text-white block mb-1 font-display tracking-wide text-base group-hover:text-brand-acid transition-colors">› SUPPLY CONSTRAINT</strong>
                                    <span className="text-brand-foam/80 text-base leading-relaxed block pl-4 border-l border-brand-rogue/30">Hard cap: 1,000 free users, 5,000 paid subscribers. Artificial scarcity maintains exclusivity and keeps support manageable.</span>
                                </div>
                                <div className="group">
                                    <strong className="text-white block mb-1 font-display tracking-wide text-base group-hover:text-brand-acid transition-colors">› ZERO DILUTION</strong>
                                    <span className="text-brand-foam/80 text-base leading-relaxed block pl-4 border-l border-brand-rogue/30">No VCs, no board, no external investors. 100% founder-owned. Once break-even, minimal maintenance = near-passive recurring revenue.</span>
                                </div>
                                <div className="group">
                                    <strong className="text-white block mb-1 font-display tracking-wide text-base group-hover:text-brand-acid transition-colors">› LOW RISK</strong>
                                    <span className="text-brand-foam/80 text-base leading-relaxed block pl-4 border-l border-brand-rogue/30">$750 total exposure. No debt, no loans, no personal guarantees. Walk away clean if needed.</span>
                                </div>
                                <div className="group">
                                    <strong className="text-white block mb-1 font-display tracking-wide text-base group-hover:text-brand-acid transition-colors">› EXIT OPTIONALITY</strong>
                                    <span className="text-brand-foam/80 text-base leading-relaxed block pl-4 border-l border-brand-rogue/30">Keep it as passive income, sell the subscriber base, or scale up. All options stay open.</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Carousel */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

                        {/* Left: Navigation */}
                        <div className="lg:col-span-4">
                            <div className="space-y-3">
                                {timelineSlides.map((slide, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveSlide(idx)}
                                        className={`w-full text-left group flex items-center gap-4 p-4 border transition-all duration-300 ${activeSlide === idx
                                            ? 'border-brand-acid bg-brand-acid/10 lg:translate-x-4'
                                            : 'border-white/10 hover:border-white/40'
                                            }`}
                                    >
                                        <span className={`font-mono font-bold text-xl ${activeSlide === idx ? 'text-brand-acid' : 'text-brand-concrete'}`}>
                                            {slide.number}:
                                        </span>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-white tracking-widest uppercase text-sm">
                                                {slide.title}
                                            </span>
                                            <span className="font-mono text-xs text-brand-foam/60">
                                                {slide.subtitle}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right: Visual Display */}
                        <div className="lg:col-span-8 relative min-h-[400px]">
                            {timelineSlides.map((slide, idx) => (
                                <div
                                    key={idx}
                                    className={`transition-all duration-500 absolute inset-0 ${activeSlide === idx ? 'opacity-100 z-10 translate-x-0' : 'opacity-0 z-0 translate-x-12 pointer-events-none'
                                        }`}
                                >
                                    {/* Main Image Container */}
                                    <div className="relative group shadow-[12px_12px_0px_0px_rgba(255,51,0,0.2)] border-2 border-white/10 bg-black">

                                        {/* Overlays */}
                                        <div className="absolute inset-0 grunge-overlay z-20 mix-blend-hard-light opacity-50"></div>
                                        <div className="absolute inset-0 bg-brand-rogue/10 mix-blend-multiply z-20"></div>

                                        <img
                                            src={slide.image}
                                            alt={slide.title}
                                            className="w-full h-[300px] object-cover grayscale contrast-[1.3] brightness-75 border-b-4 border-brand-rogue"
                                        />

                                        {/* Corner Number */}
                                        <div className="absolute top-0 right-0 bg-white text-black font-black font-mono text-xl p-2 z-20 shadow-lg border border-black">
                                            {slide.number}
                                        </div>

                                        {/* Sticker Overlay */}
                                        <div className="absolute bottom-6 left-6 bg-brand-abyss border-2 border-brand-acid p-4 max-w-sm z-30 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] -rotate-1">
                                            <div className="flex justify-between items-end mb-2 border-b border-brand-concrete/30 pb-2">
                                                <span className="font-mono text-xs text-brand-acid">
                                                    PHASE_{slide.number}
                                                </span>
                                                <div className="w-2 h-2 bg-brand-rogue rounded-full"></div>
                                            </div>
                                            <p className="font-mono text-xs text-white leading-tight uppercase tracking-wide">
                                                {slide.overlay}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Description Box */}
                                    <div className="mt-6 ml-6 border-l-2 border-brand-acid pl-6">
                                        <p className="text-lg text-brand-foam font-bold leading-tight uppercase font-display max-w-lg">
                                            <span className="text-brand-rogue">//</span> {slide.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>

                {/* Roles Section */}
                <div className="mb-16">
                    <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-6 flex items-center gap-3 uppercase tracking-tight">
                        <span className="w-2 h-2 bg-brand-acid"></span>
                        THE 33% SPLIT
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                        {/* SHAUN */}
                        <div className="bg-white/5 border border-brand-concrete p-6 hover:border-brand-acid transition-colors group relative shadow-[6px_6px_0px_0px_rgba(255,51,0,0.3)]">
                            <div className="mb-4">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-2xl sm:text-3xl font-bold text-white group-hover:text-brand-acid transition-colors font-display tracking-tight">SHAUN</h3>
                                    <Check className="text-white mt-1 bg-brand-rogue p-1 rounded-full font-bold" />
                                </div>
                                <span className="inline-block bg-brand-rogue text-brand-abyss px-2 py-0.5 transform -rotate-1 font-mono text-xs font-bold tracking-widest mt-2 tape">OPS & COMPLIANCE</span>
                            </div>
                            <ul className="space-y-3 text-brand-foam/80 text-base">
                                <li className="flex items-start gap-2">
                                    <span className="text-brand-acid mt-1">›</span> User Support & Community
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-brand-acid mt-1">›</span> Verify Surf Spot Data
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-brand-acid mt-1">›</span> Tax, Legal & Compliance
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-brand-acid mt-1">›</span> Non-Profit Partnerships
                                </li>
                            </ul>
                        </div>

                        {/* CODY */}
                        <div className="bg-white/5 border border-brand-concrete p-6 hover:border-brand-acid transition-colors group relative shadow-[6px_6px_0px_0px_rgba(255,51,0,0.3)]">
                            <div className="mb-4">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-2xl sm:text-3xl font-bold text-white group-hover:text-brand-acid transition-colors font-display tracking-tight">CODY</h3>
                                    <Check className="text-white mt-1 bg-brand-rogue p-1 rounded-full font-bold" />
                                </div>
                                <span className="inline-block bg-brand-rogue text-brand-abyss px-2 py-0.5 transform rotate-1 font-mono text-xs font-bold tracking-widest mt-2 tape">TECHNICAL LEAD</span>
                            </div>
                            <ul className="space-y-3 text-brand-foam/80 text-base">
                                <li className="flex items-start gap-2">
                                    <span className="text-brand-acid mt-1">›</span> Build & Maintain App
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-brand-acid mt-1">›</span> Manage Database and Architecture
                                </li>
                            </ul>
                        </div>

                        {/* PARTNER 3 */}
                        <div className="bg-white/5 border border-brand-concrete p-6 hover:border-brand-acid transition-colors group relative shadow-[6px_6px_0px_0px_rgba(255,51,0,0.3)]">
                            <div className="mb-4">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-2xl sm:text-3xl font-bold text-white group-hover:text-brand-acid transition-colors font-display tracking-tight">PARTNER 3</h3>
                                    <CircleQuestionMark className="text-white mt-1 bg-brand-rogue/50 p-1 rounded-full font-bold" />
                                </div>
                                <span className="inline-block bg-brand-rogue text-brand-abyss px-2 py-0.5 transform -rotate-1 font-mono text-xs font-bold tracking-widest mt-2 tape">MARKETING LEAD</span>
                            </div>
                            <ul className="space-y-3 text-brand-foam/80 text-base">
                                <li className="flex items-start gap-2">
                                    <span className="text-brand-acid mt-1">›</span> Instagram Content (Hype Texts)
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-brand-acid mt-1">›</span> Brand Partnerships
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Live Ledger Table */}
                <div className="mb-12">
                    <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-6 flex items-center gap-3 uppercase tracking-tight">
                        <span className="w-2 h-2 bg-brand-acid"></span>
                        LIVE LEDGER
                    </h2>
                    <div className="mb-4">
                        <span className="inline-block bg-brand-rogue text-brand-abyss px-2 py-0.5 transform -rotate-1 font-mono text-xs font-bold tracking-widest tape">
                            ADJUST ASSUMPTIONS
                        </span>
                    </div>

                    <div className="overflow-x-auto border border-brand-concrete">
                        <table className="w-full text-left font-mono text-sm">
                            <thead className="bg-white/5 text-brand-rogue uppercase tracking-wider border-b border-brand-concrete">
                                <tr>
                                    <th className="p-4 font-bold border-r border-brand-concrete/30 w-1/4">Line Item</th>
                                    <th className="p-4 font-bold border-r border-brand-concrete/30 w-1/3">
                                        Phase 1: Beta
                                        <span className="block text-sm text-brand-foam normal-case mt-1 opacity-80">Donation Model</span>
                                    </th>
                                    <th className="p-4 font-bold w-1/3">
                                        Phase 2: Launch
                                        <span className="block text-sm text-brand-foam normal-case mt-1 opacity-80">Freemium Model</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-concrete/30 text-sm sm:text-base">

                                {/* REVENUE SECTION HEADER */}
                                <tr className="bg-brand-concrete/20 border-b border-brand-concrete">
                                    <td colSpan={3} className="p-2 pl-4">
                                        <span className="inline-block bg-brand-acid text-brand-abyss px-2 py-0.5 transform -rotate-1 font-mono text-xs font-bold tracking-widest tape">INCOMES</span>
                                    </td>
                                </tr>

                                {/* Users Row */}
                                <tr className="hover:bg-white/5 transition-colors border-b border-brand-concrete/10">
                                    <td className="p-6 font-bold text-white border-r border-brand-concrete/30 align-middle">
                                        ACTIVE USERS
                                        <span className="block text-xs text-brand-foam/60 font-normal mt-1 uppercase tracking-wide">Server Load Impact</span>
                                    </td>
                                    <td className="p-6 border-r border-brand-concrete/30 align-middle">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-brand-acid font-bold">{p1Users.toLocaleString()} Users</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1000"
                                                step="50"
                                                value={p1Users}
                                                onChange={(e) => setP1Users(parseInt(e.target.value))}
                                                className="w-full h-1 bg-brand-concrete rounded-lg appearance-none cursor-pointer accent-brand-acid"
                                            />
                                        </div>
                                    </td>
                                    <td className="p-6 align-middle">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-brand-acid font-bold">{p2Users.toLocaleString()} Users</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="1000"
                                                max="5000"
                                                step="100"
                                                value={p2Users}
                                                onChange={(e) => setP2Users(parseInt(e.target.value))}
                                                className="w-full h-1 bg-brand-concrete rounded-lg appearance-none cursor-pointer accent-brand-acid"
                                            />
                                        </div>
                                    </td>
                                </tr>

                                {/* Revenue Input Row */}
                                <tr className="hover:bg-white/5 transition-colors border-b border-brand-concrete/10">
                                    <td className="p-6 font-bold text-white border-r border-brand-concrete/30 align-middle">
                                        REVENUE MODEL
                                        <span className="block text-xs text-brand-foam/60 font-normal mt-1 uppercase tracking-wide">Gross Incomes</span>
                                    </td>
                                    <td className="p-6 border-r border-brand-concrete/30 align-middle">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs uppercase text-brand-rogue tracking-wider">Donations</span>
                                                <span className="text-white font-bold">{formatCurrency(p1_revenue)}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                step="5"
                                                value={donations}
                                                onChange={(e) => setDonations(parseInt(e.target.value))}
                                                className="w-full h-1 bg-brand-concrete rounded-lg appearance-none cursor-pointer accent-brand-acid"
                                            />
                                            <span className="text-xs text-brand-foam/60 text-right uppercase tracking-wide">Est. Monthly</span>
                                        </div>
                                    </td>
                                    <td className="p-6 align-middle">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs uppercase text-brand-rogue tracking-wider">Paid Rate</span>
                                                <span className="text-white font-bold">{formatCurrency(p2_revenue)}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0.01"
                                                max="0.50"
                                                step="0.01"
                                                value={conversionRate}
                                                onChange={(e) => setConversionRate(parseFloat(e.target.value))}
                                                className="w-full h-1 bg-brand-concrete rounded-lg appearance-none cursor-pointer accent-brand-acid"
                                            />
                                            <div className="flex justify-between text-xs text-brand-foam/60 uppercase tracking-wide">
                                                <span>{(conversionRate * 100).toFixed(0)}% Conv.</span>
                                                <span>{Math.round(p2_paid_users)} Subs</span>
                                            </div>
                                        </div>
                                    </td>
                                </tr>

                                {/* Gross Revenue Row */}
                                <tr className="bg-white/5 font-bold border-b border-brand-concrete">
                                    <td className="p-6 text-white border-r border-brand-concrete/30 align-middle">
                                        GROSS REVENUE
                                        <span className="block text-xs text-brand-foam/60 font-normal mt-1 uppercase tracking-wide">Pre-Expense Totals</span>
                                    </td>
                                    <td className="p-6 text-brand-acid border-r border-brand-concrete/30 align-middle text-lg">
                                        {formatCurrency(p1_revenue)}
                                    </td>
                                    <td className="p-6 text-brand-acid align-middle text-lg">
                                        {formatCurrency(p2_revenue)}
                                    </td>
                                </tr>

                                {/* EXPENSES SECTION HEADER */}
                                <tr className="bg-brand-concrete/20 border-b border-brand-concrete">
                                    <td colSpan={3} className="p-2 pl-4">
                                        <span className="inline-block bg-red-500 text-white px-2 py-0.5 transform rotate-1 font-mono text-xs font-bold tracking-widest tape">EXPENSES</span>
                                    </td>
                                </tr>

                                {/* Variable SMS Row (Interactive) */}
                                <tr className="hover:bg-white/5 transition-colors border-b border-brand-concrete/10 bg-brand-rogue/5">
                                    <td className="p-6 font-bold text-white border-r border-brand-concrete/30 align-middle">
                                        VARIABLE AUDIT (SMS + TRAFFIC)
                                        <span className="block text-xs text-brand-foam/60 font-normal mt-1 uppercase tracking-wide">Messaging Volume</span>
                                    </td>
                                    <td className="p-6 border-r border-brand-concrete/30 align-middle">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex justify-between items-center text-red-300">
                                                <span>{formatCurrency(-p1_sms_cost)}</span>
                                                <span className="text-xs text-brand-foam/60 uppercase tracking-wide">{textsPerUser} txts/mo</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="1"
                                                max="30"
                                                step="1"
                                                value={textsPerUser}
                                                onChange={(e) => setTextsPerUser(parseInt(e.target.value))}
                                                className="w-full h-1 bg-brand-concrete rounded-lg appearance-none cursor-pointer accent-brand-rogue"
                                            />
                                        </div>
                                    </td>
                                    <td className="p-6 align-middle">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex justify-between items-center text-red-300">
                                                <span>{formatCurrency(-p2_sms_cost)}</span>
                                                <span className="text-xs text-brand-foam/60 uppercase tracking-wide">{textsPerUser} txts/mo</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="1"
                                                max="30"
                                                step="1"
                                                value={textsPerUser}
                                                onChange={(e) => setTextsPerUser(parseInt(e.target.value))}
                                                className="w-full h-1 bg-brand-concrete rounded-lg appearance-none cursor-pointer accent-brand-rogue"
                                            />
                                        </div>
                                    </td>
                                </tr>

                                {/* Infrastructure Row */}
                                <tr className="hover:bg-white/5 transition-colors border-b border-brand-concrete/10">
                                    <td className="p-6 font-medium text-brand-foam border-r border-brand-concrete/30 align-middle">
                                        Infrastructure
                                        <span className="block text-xs text-brand-foam/60 mt-1 uppercase tracking-wide">Vercel, Twilio, Supabase</span>
                                    </td>
                                    <td className="p-6 text-red-400 border-r border-brand-concrete/30 align-middle">-$4.40</td>
                                    <td className="p-6 text-red-400 align-middle">-$24.40</td>
                                </tr>

                                {/* Processing Row */}
                                <tr className="hover:bg-white/5 transition-colors border-b border-brand-concrete">
                                    <td className="p-6 font-medium text-brand-foam border-r border-brand-concrete/30 align-middle">
                                        Payment Processing
                                        <span className="block text-xs text-brand-foam/60 mt-1 uppercase tracking-wide">Stripe Fees (2.9% + 30¢)</span>
                                    </td>
                                    <td className="p-6 text-brand-foam/50 border-r border-brand-concrete/30 align-middle">$0.00</td>
                                    <td className="p-6 text-red-400 align-middle">-${p2_processing.toFixed(2)}</td>
                                </tr>

                                {/* PROFIT SECTION HEADER */}
                                <tr className="bg-brand-acid/20 border-b border-brand-acid">
                                    <td colSpan={3} className="p-2 pl-4">
                                        <span className="inline-block bg-brand-acid text-brand-abyss px-2 py-0.5 transform -rotate-1 font-mono text-xs font-bold tracking-widest tape">NET OUTCOME</span>
                                    </td>
                                </tr>

                                {/* Net Profit (Result) */}
                                <tr className="bg-white/10 transition-colors font-bold border-b border-brand-concrete">
                                    <td className="p-6 text-white border-r border-brand-concrete/30 align-middle text-base">Net Profit (Monthly)</td>
                                    <td className={`p-6 border-r border-brand-concrete/30 align-middle text-xl sm:text-2xl ${p1_net_profit >= 0 ? 'text-brand-acid' : 'text-red-400'}`}>
                                        <div className="flex flex-row gap-1 justify-between items-center">
                                            {formatCurrency(p1_net_profit)}
                                            {p1_net_profit < 0 && (
                                                <div className="text-sm text-brand-foam/60 uppercase tracking-wide">
                                                    RUNWAY: <span className="text-white font-bold">{p1_runway_days} days</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className={`p-6 align-middle text-xl sm:text-2xl ${p2_net_profit >= 0 ? 'text-brand-acid' : 'text-red-400'}`}>{formatCurrency(p2_net_profit)}</td>
                                </tr>

                                {/* Payoff (Result) */}
                                <tr className="bg-brand-acid/10 hover:bg-brand-acid/20 transition-colors">
                                    <td className="p-6 font-black text-brand-acid border-r border-brand-concrete/30 uppercase align-middle text-base">Your Payoff (33%)</td>
                                    <td className="p-6 text-brand-foam/30 border-r border-brand-concrete/30"></td>
                                    <td className="p-6 align-middle">
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-black text-brand-acid text-2xl sm:text-3xl">{formatCurrency(p2_payoff)}</span>
                                            <span className="text-sm font-normal text-brand-foam uppercase">/ MO</span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 font-mono text-base sm:text-lg text-brand-rogue border-t border-dashed border-white/10 pt-6">
                        <span className="inline-block bg-brand-rogue text-brand-abyss px-2 py-0.5 transform rotate-1 font-mono text-xs font-bold tracking-widest mb-2 tape w-fit">
                            ROI ANALYSIS
                        </span>
                        {p2_payoff > 0 ? (
                            <ul className="space-y-2 list-none">
                                <li className="flex gap-2">
                                    <span className="text-brand-acid">›</span>
                                    <span>At Phase 2 scale, you earn back your initial $250 investment in <span className="text-white font-bold">{roi_days} days</span>.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-brand-acid">›</span>
                                    <span>You will earn 10x your capital investment ($2,500) in <span className="text-white font-bold">{roi_10x_days} days</span>.</span>
                                </li>
                            </ul>
                        ) : (
                            <p className="text-red-400">At current Phase 2 settings, you do not earn back your investment (negative cashflow).</p>
                        )}
                    </div>
                </div>

                {/* Strategic Analysis (Static) */}

            </main>

            {!isAdminRoute && <Footer />}
        </div>
    );
}
