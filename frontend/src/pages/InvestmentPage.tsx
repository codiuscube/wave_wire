
import { useState } from 'react';
import { Navbar, Footer } from '../components/landing';
import { Check, CircleQuestionMark } from 'lucide-react';

export function InvestmentPage() {
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
    const p2_sms_cost = p2_paid_users * textsPerUser * COST_PER_TEXT;

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
        <div className="min-h-screen bg-brand-abyss flex flex-col font-sans text-brand-foam selection:bg-brand-acid selection:text-brand-abyss relative">
            <div className="grunge-overlay opacity-20 pointer-events-none"></div>
            <Navbar />

            <main className="flex-grow pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
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
                            <span className="text-brand-rogue font-bold mb-1 uppercase tracking-wider">1 YEAR TARGET</span>
                            <span className="text-white text-xl sm:text-2xl">2,000 active users</span>
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
                        <p className="text-brand-foam/90 text-base sm:text-lg leading-relaxed mb-6 max-w-4xl">
                            Deploy a precision-engineered, low-overhead intelligence tool for core surfers. We filter raw buoy and weather data to deliver private, threshold-based alerts ("The Wire")—ensuring zero crowds and pure signal. Built primarily for the specific needs of the founding team; scaled to a capped userbase to fund operations without diluting the product's "Secret Weapon" status.
                        </p>

                        <div className="border-t border-brand-rogue/20 pt-6 mt-6">
                            <span className="inline-block bg-brand-rogue text-brand-abyss px-2 py-0.5 transform -rotate-1 font-mono text-xs font-bold tracking-widest mb-4 tape">
                                STRATEGIC VIABILITY
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                <div className="group">
                                    <strong className="text-white block mb-1 font-display tracking-wide text-base group-hover:text-brand-acid transition-colors">› BREAK-EVEN THRESHOLD</strong>
                                    <span className="text-brand-foam/80 text-base leading-relaxed block pl-4 border-l border-brand-rogue/30">System achieves self-sustainment at ~150 subscribers. Current architecture supports 50k+ users with no fixed cost increase.</span>
                                </div>
                                <div className="group">
                                    <strong className="text-white block mb-1 font-display tracking-wide text-base group-hover:text-brand-acid transition-colors">› INFINITE RUNWAY</strong>
                                    <span className="text-brand-foam/80 text-base leading-relaxed block pl-4 border-l border-brand-rogue/30">With $5/mo pricing and minimal OpEx ($25/mo base), the project funds its own growth indefinitely once Phase 2 activates.</span>
                                </div>
                                <div className="group">
                                    <strong className="text-white block mb-1 font-display tracking-wide text-base group-hover:text-brand-acid transition-colors">› SUPPLY CONSTRAINT</strong>
                                    <span className="text-brand-foam/80 text-base leading-relaxed block pl-4 border-l border-brand-rogue/30">By capping at 1,000 users, we artificially constrain supply, maintaining "Private Intel" branding and eliminating complex support overhead.</span>
                                </div>
                                <div className="group">
                                    <strong className="text-white block mb-1 font-display tracking-wide text-base group-hover:text-brand-acid transition-colors">› ASSET RETENTION</strong>
                                    <span className="text-brand-foam/80 text-base leading-relaxed block pl-4 border-l border-brand-rogue/30">The core IP (alert algorithms) remains proprietary. No external equity. 100% internal ownership.</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                        {/* Part 1 */}
                        <div className="bg-white/5 border border-brand-concrete p-6 relative group hover:border-brand-acid transition-colors shadow-[6px_6px_0px_0px_rgba(255,51,0,0.3)]">
                            <span className="absolute -top-3 -right-2 inline-block bg-brand-rogue text-brand-abyss px-2 py-0.5 transform rotate-2 font-mono text-sm font-bold tracking-widest tape">01</span>
                            <h3 className="text-white font-bold mb-2 pr-8 font-display uppercase tracking-wide text-lg sm:text-xl">PART 1: THE_INPUT</h3>
                            <div className="font-mono text-sm text-brand-rogue mb-3 uppercase tracking-wider">Seed_Fund</div>
                            <p className="text-brand-foam/80 text-base leading-relaxed">
                                Establish legal entity (DE/TX/CA). Secure $750 seed capital for initial infrastructure and accountability.
                            </p>
                        </div>

                        {/* Part 2 */}
                        <div className="bg-white/5 border border-brand-concrete p-6 relative group hover:border-brand-acid transition-colors shadow-[6px_6px_0px_0px_rgba(255,51,0,0.3)]">
                            <span className="absolute -top-3 -right-2 inline-block bg-brand-rogue text-brand-abyss px-2 py-0.5 transform -rotate-1 font-mono text-sm font-bold tracking-widest tape">02</span>
                            <h3 className="text-white font-bold mb-2 pr-8 font-display uppercase tracking-wide text-lg sm:text-xl">PART 2: THE_BUILD</h3>
                            <div className="font-mono text-sm text-brand-rogue mb-3 uppercase tracking-wider">Jan 1, 2026</div>
                            <p className="text-brand-foam/80 text-base leading-relaxed">
                                Develop MVP for internal stakeholders. Alpha testing with trusted circle. Target Launch: Jan 1, 2026.
                            </p>
                        </div>

                        {/* Part 3 */}
                        <div className="bg-white/5 border border-brand-concrete p-6 relative group hover:border-brand-acid transition-colors shadow-[6px_6px_0px_0px_rgba(255,51,0,0.3)]">
                            <span className="absolute -top-3 -right-2 inline-block bg-brand-rogue text-brand-abyss px-2 py-0.5 transform rotate-1 font-mono text-sm font-bold tracking-widest tape">03</span>
                            <h3 className="text-white font-bold mb-2 pr-8 font-display uppercase tracking-wide text-lg sm:text-xl">PART 3: THE_SCALE</h3>
                            <div className="font-mono text-sm text-brand-rogue mb-3 uppercase tracking-wider">Open Beta</div>
                            <p className="text-brand-foam/80 text-base leading-relaxed">
                                Initiate US-only Open Beta. Free tier entry via waitlist. Controlled, incremental user onboarding.
                            </p>
                        </div>

                        {/* Part 4 */}
                        <div className="bg-white/5 border border-brand-concrete p-6 relative group hover:border-brand-acid transition-colors shadow-[6px_6px_0px_0px_rgba(255,51,0,0.3)]">
                            <span className="absolute -top-3 -right-2 inline-block bg-brand-rogue text-brand-abyss px-2 py-0.5 transform -rotate-2 font-mono text-sm font-bold tracking-widest tape">04</span>
                            <h3 className="text-white font-bold mb-2 pr-8 font-display uppercase tracking-wide text-lg sm:text-xl">PART 4: CAP</h3>
                            <div className="font-mono text-sm text-brand-rogue mb-3 uppercase tracking-wider">1000 Users</div>
                            <p className="text-brand-foam/80 text-base leading-relaxed">
                                Cap active users at 1,000. Pause acquisition to integrate payment infrastructure (Stripe) and validate stability.
                            </p>
                        </div>

                        {/* Part 5 */}
                        <div className="bg-white/5 border border-brand-concrete p-6 relative group hover:border-brand-acid transition-colors shadow-[6px_6px_0px_0px_rgba(255,51,0,0.3)]">
                            <span className="absolute -top-3 -right-2 inline-block bg-brand-rogue text-brand-abyss px-2 py-0.5 transform rotate-1 font-mono text-sm font-bold tracking-widest tape">05</span>
                            <h3 className="text-white font-bold mb-2 pr-8 font-display uppercase tracking-wide text-lg sm:text-xl">PART 5: REVENUE</h3>
                            <div className="font-mono text-sm text-brand-rogue mb-3 uppercase tracking-wider">Paid Launch</div>
                            <p className="text-brand-foam/80 text-base leading-relaxed">
                                Activate monetization. $5/mo premium tier with limited freemium access. US market focus.
                            </p>
                        </div>

                        {/* Part 6 */}
                        <div className="bg-white/5 border border-brand-concrete p-6 relative group hover:border-brand-acid transition-colors shadow-[6px_6px_0px_0px_rgba(255,51,0,0.3)]">
                            <span className="absolute -top-3 -right-2 inline-block bg-brand-rogue text-brand-abyss px-2 py-0.5 transform -rotate-1 font-mono text-sm font-bold tracking-widest tape">06</span>
                            <h3 className="text-white font-bold mb-2 pr-8 font-display uppercase tracking-wide text-lg sm:text-xl">PART 6: SCALE_UP</h3>
                            <div className="font-mono text-sm text-brand-rogue mb-3 uppercase tracking-wider">5000 Users</div>
                            <p className="text-brand-foam/80 text-base leading-relaxed">
                                Expand to 5,000 users. Evaluate architecture for mass-scale (50k+) and potential contraction of external dev resources.
                            </p>
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
                                        VARIABLE AUDIT (SMS)
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

            <Footer />
        </div>
    );
}
