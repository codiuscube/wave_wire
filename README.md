# Home Break

The invisible surf check. No apps to check. No forecasts to analyze. Just texts from your surf buddy when it's actually worth the drive.

## Vision

Home Break is a lightweight, "invisible" surf alert system that runs in the background and texts you only when your spot is actually firing. It combines real data (NOAA buoys, Open-Meteo) with a personality engine to deliver alerts that feel like a text from a local buddy.

**The Trust Metric**: Users don't double-check Surfline after receiving a Home Break alert. They just grab their keys.

## 🚀 Getting Started

This project is currently a **Frontend-only MVP**. It uses React, Vite, and Tailwind CSS.

### Prerequisites
- Node.js (v18+ recommended)
- npm

### Installation

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the development server:**
    ```bash
    npm run dev
    ```
    The site will be available at `http://localhost:5173`.

## 📂 Project Structure

The project is organized to separate the marketing site from the application logic.

```
homebreak-project/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── landing/         # Marketing site sections (Hero, Features, Pricing)
│   │   │   ├── dashboard/       # User dashboard (Sidebar, Settings)
│   │   │   └── ui/              # Shared reusable components (Buttons, Inputs)
│   │   ├── pages/               # Main page layouts
│   │   ├── utils/               # Helper functions
│   │   └── App.tsx              # Main application entry point
│   └── vite.config.ts           # Tooling configuration
└── README.md                    # This file
```

## 🛠 Maintenance & Customization

### Editing Content
- **Landing Page Text**: Most text is hardcoded in the components found in `frontend/src/components/landing/`.
  - `Hero.tsx`: Main headline and "phone" notification text.
  - `Features.tsx`: "No Bullshit" grid items.
  - `Pricing.tsx`: Donation/Tier info.
  - `Footer.tsx`: Footer links and copyright.

### Styling
- **Theme Colors**: Colors are defined in `frontend/src/index.css` (using CSS variables for Tailwind).
- **Tailwind**: Utility classes are used throughout. To change a color/spacing, edit the class directly in the React component.

### Deployment
The project is optimized for deployment on **Vercel**.
1. Push your code to GitHub.
2. Import the repo in Vercel.
3. Set the "Root Directory" to `frontend`.
4. The build command (`npm run build`) and output settings should auto-detect.

## 🏗 Tech Stack

### Current Implementation (Frontend MVP)
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4 + Lucide Icons
- **Language**: TypeScript

### Future Roadmap
- **Backend**: Serverless Functions (TBD)
- **Database**: Supabase (Postgres)
- **AI**: Claude Haiku 4.5 (for generating alert personality)
- **Weather API**: Open-Meteo Marine API
- **Buoy Data**: NOAA Raw Text Files

## How It Works (Logic)

### Smart Triggers
| Trigger | Time | Purpose |
| :--- | :--- | :--- |
| **Night Before Hype** | 8:00 PM | Checks tomorrow's forecast. Get hyped or sleep in. |
| **Morning Reality Check** | 6:00 AM | Live buoy validation + traffic check. |
| **Pop-Up Alert** | Every 2h | Catches sudden wind switches or unexpected pulses. |

### Anti-Spam Logic
- **Cooldown**: 6 hours between alerts of the same "tier".
- **Upgrade**: Alerts *can* fire if conditions upgrade (e.g. "Good" → "Epic").

## License

MIT
