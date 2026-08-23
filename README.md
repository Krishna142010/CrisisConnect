# CrisisConnect - AI-Powered Disaster Response Platform

> **Real-time disaster response coordination with offline-capable AI triage, smart resource matching, and interactive crisis mapping.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-blueviolet.svg)](#offline-first-architecture)
[![AI Powered](https://img.shields.io/badge/AI-Offline%20NLP-orange.svg)](#ai-triage-engine)


## The Problem

Every year, natural disasters kill **60,000+ people** and affect **200+ million worldwide**. The #1 failure point isn't lack of resources — it's **coordination chaos**:

- Victims can't effectively signal for help during infrastructure collapse
- Volunteers and relief organizations don't know where to go
- Information is fragmented across WhatsApp, social media, and government channels
- Resources are misallocated — excess in some areas, none in others
- Cell towers go down, leaving victims completely disconnected

**No existing open-source platform solves the last-mile hyperlocal coordination gap.**


## Our Solution

**CrisisConnect** is an AI-powered web platform that acts as **mission control for disaster response**, connecting victims, volunteers, and organizations through intelligent, offline-capable coordination.

### Core Features

| Feature | Description |
|---------|-------------|
| **Live Crisis Map** | Real-time interactive map with intelligent clustering, severity-aware coloring, and multi-layer visualization |
| **Offline AI Triage** | NLP model runs **entirely in your browser** (Transformers.js) — no internet needed. Automatically classifies urgency, extracts location, and identifies medical needs |
| **Smart Resource Matching** | Multi-criteria algorithm matches volunteers to victims based on proximity, urgency, capability, and waiting time |
| **Offline-First PWA** | Full functionality without internet. Reports queue locally and sync when connection returns |
| **Analytics Dashboard** | Real-time stats: active incidents, response times, resource utilization, priority distribution |
| **External Data Feeds** | Live integration with USGS Earthquakes and NASA EONET natural disaster events |
| **Demo Simulation** | Realistic hurricane simulation mode for demonstrations and training |


## Architecture

┌─────────────────────────────────────────────────────────────────┐
│                    CrisisConnect PWA (Offline-First)             │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ MapLibre GL  │  │ Transformers │  │ Dexie.js (IndexedDB)  │ │
│  │ (WebGL Map)  │  │ .js (AI/NLP) │  │ (Offline Storage)     │ │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬───────────┘ │
│         │                 │                       │             │
│         ▼                 ▼                       ▼             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              React 19 + TypeScript Application           │   │
│  │    ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │   │
│  │    │ Crisis   │ │ Report   │ │ Resource │ │Dashboard │ │   │
│  │    │ Map      │ │ Modal    │ │ Matcher  │ │ Analytics│ │   │
│  │    └──────────┘ └──────────┘ └──────────┘ └──────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                   │
│              Service Worker (Workbox 7)                         │
│              • Map tile caching (4000+ tiles)                   │
│              • AI model caching (offline inference)             │
│              • Background sync queue                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  External APIs     │
                    │  (Online Only)     │
                    │  • USGS Earthquakes│
                    │  • NASA EONET      │
                    │  • Supabase Sync   │
                    │  • Nominatim Geo   │
                    └────────────────────┘


## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + TypeScript | Component architecture with type safety |
| **Build** | Vite 6 | Lightning-fast HMR and optimized builds |
| **Styling** | Vanilla CSS | Custom design system with glassmorphism and dark theme |
| **Map** | MapLibre GL JS | WebGL-accelerated vector maps with clustering |
| **AI/NLP** | Transformers.js (HuggingFace) | In-browser ML inference for emergency triage |
| **AI Model** | DeBERTa-v3-xsmall (NLI) | Zero-shot classification for priority/category |
| **Offline** | Dexie.js + IndexedDB | Persistent local storage with sync queue |
| **PWA** | Workbox 7 + vite-plugin-pwa | Service worker caching and installability |
| **Icons** | Lucide React | Consistent, lightweight icon system |
| **Basemap** | Carto Dark Matter | Sleek dark map tiles (free, no API key) |


## AI Triage Engine

CrisisConnect uses a **fully offline AI triage system** powered by [Transformers.js](https://huggingface.co/docs/transformers.js):

1. **Model**: `Xenova/nli-deberta-v3-xsmall` — a lightweight NLI model (~22MB quantized)
2. **Method**: Zero-shot classification via Natural Language Inference
3. **Runs in browser**: No API calls, no server, no internet needed after first model download
4. **Fallback**: Rule-based keyword matching when model hasn't loaded yet

### Triage Pipeline

Raw SOS Text → Zero-Shot Priority Classification → Category Detection
                                                  → People Count Extraction (Regex)
                                                  → Medical Condition Detection
                                                  → Location Extraction
                                                  → Tactical Summary Generation


### Priority Levels

| Priority | Label | Criteria | Response Target |
|----------|-------|----------|-----------------|
| P1 | Critical | Imminent drowning, trapped, severe bleeding | < 15 min |
| P2 | Urgent | Medical needs, vulnerable trapped, insulin/oxygen | < 2 hours |
| P3 | Supplies | Food, water, blankets, power for devices | < 12 hours |
| P4 | Info | Road closures, damage reports, general status | As available |


## Offline-First Architecture

CrisisConnect is built to work when infrastructure fails:

- **Map tiles**: Up to 4,000 tiles cached locally for offline navigation
- **AI model**: Cached in browser after first download — inference works offline
- **Reports**: Stored in IndexedDB when offline, auto-sync when connection returns
- **Google Fonts**: Cached for consistent typography
- **PWA**: Installable as a standalone app on any device


## Resource Matching Algorithm

The matching engine uses a multi-criteria scoring formula:

```
Score(i,j) = UrgencyWeight(i) - DistancePenalty(i,j) + StarvationBonus(i) + CapabilityBonus(i,j)
```

Where:
- **Urgency Weight**: P1=100, P2=60, P3=30, P4=10
- **Distance Penalty**: Haversine distance × 2.5 pts/km
- **Starvation Bonus**: min(waitingHours × 5, 25) — prevents old requests from being ignored
- **Capability Bonus**: +20 if volunteer has matching equipment (boat ↔ water rescue, etc.)


## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- A modern browser (Chrome, Firefox, Edge, Safari)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/crisisconnect.git
cd crisisconnect

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

### First Launch

1. The AI model will download automatically on first launch (~22MB)
2. Once downloaded, it's cached for fully offline use
3. Browse the map and try the simulation mode (Ctrl+Shift+D)

### Building for Production

```bash
npm run build
npm run preview
```

## Demo Simulation Mode

CrisisConnect includes a built-in **Hurricane Simulation** for demonstrations:

1. Press **Ctrl+Shift+D** to toggle Developer Mode
2. Click **"Start Simulation"** in the bottom-left panel
3. Watch as 40+ realistic SOS reports flood the map over 60 seconds
4. The AI triages each report in real-time
5. The matching algorithm dispatches volunteers automatically

### Removing for Judging

To hide the simulation controls during live judging:
- Simply press **Ctrl+Shift+D** again to toggle off
- The simulation panel disappears completely
- All simulated data can be cleared with the "Reset All Data" button before hiding


## Project Structure

```
crisisconnect/
├── public/
│   ├── favicon.svg              # App favicon (emergency cross + signal waves)
│   └── icons/                   # PWA icons
├── src/
│   ├── index.css                # Complete design system (dark glassmorphism)
│   ├── main.tsx                 # React entry point
│   ├── App.tsx                  # Root orchestrator component
│   ├── components/
│   │   ├── CrisisMap.tsx        # MapLibre GL JS interactive map
│   │   ├── MapControls.tsx      # Priority/category filter chips
│   │   ├── Header.tsx           # Navigation bar with status indicators
│   │   ├── ReportModal.tsx      # Emergency report form with AI triage
│   │   ├── Sidebar.tsx          # Incidents, dispatch, and activity panels
│   │   ├── Dashboard.tsx        # Analytics and statistics view
│   │   ├── OfflineIndicator.tsx # Online/offline status banner
│   │   └── SimulationControls.tsx # Demo hurricane simulation
│   ├── services/
│   │   ├── triageService.ts     # Offline AI triage (Transformers.js)
│   │   ├── geocodingService.ts  # Address → coordinates resolution
│   │   ├── matcherService.ts    # Multi-criteria resource matching
│   │   ├── offlineDB.ts         # IndexedDB persistence (Dexie.js)
│   │   ├── simulationService.ts # Realistic disaster simulation engine
│   │   └── externalFeeds.ts     # USGS/NASA live data integration
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces and configs
│   └── utils/
│       ├── haversine.ts         # Great-circle distance calculation
│       └── constants.ts         # App-wide configuration constants
├── vite.config.ts               # Vite + PWA configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Dependencies and scripts
├── LICENSE                      # MIT License
└── README.md                    # This file
```


## 🎯 Judging Criteria Alignment

| Criteria | How CrisisConnect Excels |
|----------|--------------------------|
| **Innovation** | First open-source platform combining in-browser AI triage + offline-first architecture + real-time resource matching for disaster response |
| **Problem Solving** | Addresses a documented life-or-death coordination gap affecting 200M+ people annually |
| **Sustainability/Scalability** | Open-source (MIT), works for any disaster type, any location. PWA runs on any device. Climate change makes this increasingly essential |
| **User Experience** | NASA mission control-inspired dark UI with glassmorphism, smooth animations, and intuitive map-first interface |
| **Exceptionality** | Life-saving potential. Fully offline AI. Multi-criteria matching algorithm with mathematical rigor |


## Future Roadmap

- [ ] WebRTC peer-to-peer device sync via QR codes (mesh networking without internet)
- [ ] Voice-to-text SOS reports using Whisper.js
- [ ] Multi-language support with offline translation

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


## Built for Reverie Hacks 2026

**Track**: Software Development  
**Theme**: Beginner Friendly | Machine Learning/AI | Open Ended


<p align="center">
  <strong>CrisisConnect</strong> - Because in a disaster, every second counts.
</p>
