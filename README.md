# MtaaMap

**Mtaa Yetu.**

MtaaMap is a crowd-verified, layer-based map of your immediate surroundings — built for the questions no official map answers. Where is this kiosk's tomato price actually accurate today? What's the electricity and water situation in this estate? Where should you slow down for a pothole? MtaaMap answers these with data reported and verified by the people who actually live there — not businesses, not corporate listings.

This repo is the working demo built to pitch the full product.

## Why this exists

Big mapping platforms show you roads and buildings. They don't show you that the water gets rationed twice a week in a specific estate, that one kiosk quietly overcharges for onions, or that a "great deal" listing has flooded, unpaved access roads. That kind of ground-truth only exists in the heads of people who live there — MtaaMap gives it a permanent, structured, crowd-verified home.

## How it works

- **Layers, not one map.** Switch between what you want to see: Neighborhood quality, Prices, and (coming soon) Road issues.
- **Nothing is business-controlled.** Every price, rating, and note comes from users, not the businesses being shown. If a listed price doesn't match reality, anyone can flag it and submit the real number with a description — the crowd corrects the record, not the kiosk owner.
- **Confidence, not just data.** Every point shows who last confirmed it and how many people agree, so you can judge freshness at a glance.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Vite + React + TypeScript |
| Styling | Tailwind CSS v4 |
| Maps | MapLibre GL JS, OSM-based basemap |
| Installability | PWA (`vite-plugin-pwa`) |
| Backend *(planned)* | FastAPI |
| Database *(planned)* | PostgreSQL + PostGIS |
| Deploy *(planned)* | Render (backend) · Vercel (frontend) |

The frontend and backend live in the same repo so the demo can evolve directly into the MVP rather than being thrown away.

## Getting started

```bash
npm install --legacy-peer-deps
npm run dev
```

Open `http://localhost:5173`. Best viewed at mobile width — this is a mobile-first app.

> **Note:** `--legacy-peer-deps` is currently required due to a peer dependency conflict between `@vitejs/plugin-react` and `vite-plugin-pwa`'s Babel tooling.

## Project structure

src/
├── types.ts # Shared types: layers, map points, prices, ratings
├── data/
│ └── mockData.ts # Demo layer definitions + sample points (Kikuyu Ondiri area)
├── components/
│ ├── MapView.tsx # MapLibre map + layer-colored markers
│ ├── BrandHeader.tsx # Top wordmark
│ ├── LayerSwitcher.tsx # Bottom pill switcher between layers
│ └── PointDetailSheet.tsx # Bottom sheet: prices / neighborhood detail + verification status
└── App.tsx # Wires state + components together


## Roadmap (post-demo)

- [ ] Real backend: FastAPI + PostgreSQL/PostGIS, replacing mock data
- [ ] User accounts + report/dispute submission flow
- [ ] Road issues layer (potholes, traffic)
- [ ] Matatu/transit layer
- [ ] Monetization (business claim/verify listings) — built in, switched off until there's a real user base

## Status

Demo stage — built to illustrate the concept before full development begins.