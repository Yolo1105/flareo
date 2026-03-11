# Flareo — Enterprise

React app built from the Flareo Enterprise JSX design: Grafana-style sidebar, marketplace, module detail, pipeline, docs, community, bounties, and admin views.

## Setup

```bash
npm install
```

## Develop

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Use **Sign In** (or “Continue with GitHub”) to enter the app; the landing page is the public marketplace.

## Build

```bash
npm run build
```

Output is in `dist/`. Preview with:

```bash
npm run preview
```

## Stack

- **Vite** + **React 18**
- **Recharts** for dashboard charts
- Geist font (loaded via Google Fonts in `index.html`)
