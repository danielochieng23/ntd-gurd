# NTD GURD — Environmental Health Intelligence

> **Detect. Prevent. Deliver.**

NTD GURD is an AI-powered environmental and community health early-warning platform that identifies localized disease-risk signals BEFORE they become visible as large outbreaks.

---

## ⚠️ Important Disclaimer

This is a **prototype** for fellowship/investor demonstration purposes only.

- All data is **synthetically generated** — not real measurements
- The risk model is a **prototype** — not clinically or epidemiologically validated
- This platform **does not diagnose individuals**
- **Not for clinical or public-health decision making**
- Requires prospective epidemiological validation before operational use

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ (installed at `C:\Program Files\nodejs\`)
- npm v9+

### Setup

```bash
cd aquasentinel
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

### Production Build

```bash
npm run build
npm start
```

The build is a static export (`out/`) so GitHub Pages can host it. Dispatch
messages are simulated in the browser on static hosts.

### GitHub Pages

Pushes to `main` deploy via `.github/workflows/pages.yml`.

Live demo: **https://danielochieng23.github.io/ntd-gurd/**

### Environment variables

Copy `.env.example` to `.env.local`. Everything in it is **optional** — the app runs
fully without any key.

| Variable | Needed for | Without it |
|---|---|---|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Live Google Map | Paste the key into the map screen at runtime |
| *(none)* | Weather & flood data | Open-Meteo is keyless and free |
| `MAJISENSE_SMS_LIVE`, `AFRICASTALKING_*`, `MAJISENSE_SMS_RECIPIENTS`, `MAJISENSE_DISPATCH_SECRET` | Sending real SMS | Every dispatch is simulated |

---

## 🌧️ Live weather & hydrology (no API key)

**Environmental Intelligence** pulls real observations from
[Open-Meteo](https://open-meteo.com), which is free for non-commercial use and needs
no registration. Three endpoints are used:

| Endpoint | Purpose |
|---|---|
| Forecast API | 7 days observed + 7 days forecast rainfall, precipitation hours, temperature |
| Flood API (GloFAS) | Daily river discharge, when the point sits on a resolved reach |
| Historical/ERA5 archive | 5 years of reanalysis, used to compute the seasonal baseline |

The **rainfall anomaly is a genuine calculation**, not a hard-coded figure: the
trailing 7-day mean is compared against the mean daily rainfall for the same ±10-day
calendar window averaged over the five most recent complete years of ERA5. The derived
flood risk score blends rainfall load, forward outlook, anomaly and — where a river
reach exists — the ratio of current discharge to its 14-day mean.

Busia town centre sits off any major GloFAS reach, so the river-discharge tile usually
reports "no significant reach" and the flood score falls back to rainfall alone. That
degradation is surfaced in the UI and in the PDF rather than hidden.

Responses are cached for 15 minutes. Everything else on that screen — water quality,
symptoms, composite risk — remains synthetic, and the screen says so.

---

## 📄 PDF reports (Reports & Export)

Four report types, generated entirely in the browser with `jspdf` + `jspdf-autotable`,
so no document ever leaves the device:

| Report | Contents |
|---|---|
| **District Situation Report** | Executive summary, live weather, all 18 communities ranked, active alerts, water points, response actions, model weights |
| **Alert Evidence Package** | Risk banner, component breakdown, primary drivers, recommendations, community profile, live weather, response tracking |
| **Water Quality Report** | Network status, points needing attention, latest readings, threshold reference |
| **Response Coordination Report** | Delivery summary, completion rate, actions grouped by alert |

Each document carries the NTD GURD masthead, a slim continuation header on spill-over
pages, page numbering, a "prepared by" line and a standing disclaimer separating
synthetic figures from live ones. Preview renders in an iframe; download saves a dated,
descriptively named file (e.g. `NTD_GURD_Alert_A001_2026-09-03.pdf`).

An **↓ Export Evidence PDF** button also sits directly on the Alert Management screen.

Smoke test the generator without a browser:

```bash
npm run test:pdf
```

---

## 📢 Early Warning Dispatch

Composes and sends multi-channel early-warning messages to the affected area.

- **6 message templates** — boil water advisory, cholera prevention, flood warning,
  water point closure, VHT mobilisation order, district escalation brief
- **3 languages** — English, Kiswahili, and Lusamia. Lusamia is flagged `DRAFT` in the
  UI because it has not been checked by a native speaker; health messaging must be
  unambiguous before it goes anywhere near a real community
- **5 channels** — SMS, WhatsApp, voice/IVR, community radio script, email
- **6 audiences** — community members, village health teams, LC1 leaders, health
  facilities, WASH/water utility, district health team. Sizes are derived from the
  affected community's actual population
- **Real GSM-7 / UCS-2 segment costing**, so you can see a message quietly become two
  segments and double the bill
- **Outbox** with per-channel delivery counts; delivery rates differ by channel because
  they genuinely do in rural districts

Placeholders (`{community}`, `{risk}`, `{level}`, `{driver}`, `{waterpoints}`, `{date}`)
are filled from the selected alert. You can edit the body freely and reset to the template.

### Simulated vs live sending

Delivery is **simulated by default** — live SMS needs a paid gateway account. The
adapter for [Africa's Talking](https://africastalking.com) (covers Uganda, has a free
sandbox) is written and wired up in `app/api/dispatch/route.ts`.

Real SMS costs money and reaches real phones, so **credentials alone are deliberately
not enough**. Five separate conditions must hold before a single message goes out, and
the gates live in `lib/dispatchGuards.ts`:

| Gate | Why |
|---|---|
| `MAJISENSE_SMS_LIVE=true` | Explicit opt-in, so credentials left in an env file don't silently arm the endpoint |
| Provider credentials | `AFRICASTALKING_USERNAME` + `AFRICASTALKING_API_KEY` |
| `MAJISENSE_SMS_RECIPIENTS` | Live SMS goes **only** to this roster, never to numbers from the request, so a demo can't message a real community |
| `MAJISENSE_DISPATCH_SECRET` | Callers must present it as `x-majisense-dispatch-key`, compared in constant time. Stops a reachable deployment being used to send on your account |
| Same-origin + rate limits | Blocks cross-site POSTs; caps live sends at 3/min per IP and authorization *attempts* at 10 per 5 min per IP |

Two details that matter more than they look:

- The **attempt budget is spent before the secret is compared**, so failed guesses
  cost the attacker their quota. Without that ordering, a wrong secret would never
  reach the limiter and could be brute-forced indefinitely.
- **Which gate failed is logged server-side only.** Clients get a single generic
  `live send not authorized`, because naming the gate would confirm live mode is armed
  and tell an attacker exactly what to bypass. Configuration gaps are the exception —
  those are shown, since nothing is armed yet and the operator needs to see them.

Any gate failing degrades to simulation rather than erroring, so the demo never breaks.
Every outbox entry is stamped `SIMULATED` or `SENT LIVE`.

The route also bounds untrusted input: message body ≤ 2,000 chars, ≤ 10 channels,
≤ 20 audiences, and ≤ 100,000 recipients per leg.

Verify the gates without a server or a gateway — the guards are pure functions:

```bash
npm run test:guards
```

---

## 🎬 Investor Demo Mode

**This is the centerpiece of the fellowship pitch.**

1. Open the app at `http://localhost:3000`
2. Click **"▶ Investor Demo Mode"** in the top bar (or "Run Outbreak Simulation" on the landing page)
3. Click **"▶ Next Step"** to advance through 8 simulated events:
   - Heavy rainfall detected → Busia Zone 4
   - Flood exposure increases
   - Water quality deteriorates (E. coli spike)
   - Community symptoms escalate (+340%)
   - Risk score jumps 47 → 82 (CRITICAL)
   - Response team assigned
   - Water testing deployed
   - Risk trajectory improving

**The demo answer three questions in 60 seconds:**
- **WHERE?** — Busia Zone 4 (Uganda) is at CRITICAL risk
- **WHY?** — Rainfall +68%, E. coli 340 CFU, symptom surge
- **WHAT?** — Deploy Field Team 03, inspect water points, issue prevention messaging

---

## 📱 All 15 Screens

| Screen | Description |
|--------|-------------|
| Overview (Landing) | Platform introduction, three core questions |
| Early Warning Dashboard | KPIs, risk distribution, top-risk communities |
| Risk Map | Live Google Map of all 18 Busia communities + sensors |
| Alert System | Alert details with Why Engine, response tracking, PDF export |
| Water Quality | Sensor network, parameter grid, historical trends |
| Environmental Intelligence | **Live** Open-Meteo rainfall & flood, causal chain visualization |
| Predictive Intelligence | 7-day projections, confidence, validation roadmap |
| Community Reports | CHW offline-first reporting interface |
| Response Coordination | Intervention assignment + pipeline tracking |
| Early Warning Dispatch | Multi-channel, multi-language alert messaging + outbox |
| Reports & Export | Four branded PDF report types with preview and download |
| Impact Dashboard | Demo metrics, alert timeline, business model |
| System Architecture | Data flow, tech stack, data schemas |
| Privacy & Security | Privacy by Design principles, regulatory alignment |
| Future Roadmap | 6-phase development + validation pathway + fellowship ask |

---

## 🏗️ Project Structure

```
aquasentinel/
├── app/
│   ├── api/dispatch/route.ts  # Alert dispatch — simulated or live SMS
│   ├── layout.tsx          # Root layout (fonts, metadata)
│   ├── page.tsx            # Main app shell + screen router
│   ├── icon.svg            # NTD GURD favicon
│   └── globals.css         # Global styles + Tailwind
├── components/
│   ├── Logo.tsx            # Brand mark — pulse + water waves
│   ├── Sidebar.tsx         # Navigation sidebar (Deep Lake #063B46)
│   ├── Topbar.tsx          # Top bar + Demo Mode controls
│   ├── Toast.tsx           # Notification toasts
│   ├── RiskBadge.tsx       # Risk level badges + bars
│   └── ui.tsx              # Shared layout primitives + spacing tokens
├── lib/
│   ├── data.ts             # Synthetic dataset (18 communities, 90 days)
│   ├── store.ts            # Zustand global state + Demo Mode
│   ├── googleMaps.ts       # Google Maps JS API loader
│   ├── weather.ts          # Open-Meteo forecast / flood / ERA5 client
│   ├── useWeather.ts       # React hook wrapping the weather client
│   ├── pdf.ts              # Branded PDF report builders (jsPDF)
│   ├── messaging.ts        # Templates, targeting, GSM segment costing
│   └── dispatchGuards.ts   # Gates protecting the live-SMS path
├── scripts/
│   ├── test-pdf.ts         # Build every report kind, assert valid PDF bytes
│   ├── test-weather.ts     # Exercise the live Open-Meteo pipeline
│   ├── test-dispatch-guards.ts # Assert every live-SMS gate blocks correctly
│   └── render-letterhead.ts # Rasterise page 1 to PNG to check the letterhead
└── screens/
    ├── LandingScreen.tsx
    ├── DashboardScreen.tsx
    ├── MapScreen.tsx
    ├── AlertsScreen.tsx
    ├── WaterQualityScreen.tsx
    ├── EnvironmentalScreen.tsx
    ├── PredictiveScreen.tsx
    ├── CommunityReportScreen.tsx
    ├── ResponseScreen.tsx
    ├── DispatchScreen.tsx
    ├── ReportsScreen.tsx
    ├── ImpactScreen.tsx
    ├── ArchitectureScreen.tsx
    ├── PrivacyScreen.tsx
    └── RoadmapScreen.tsx
```

### Verification scripts

These run headlessly, without a browser:

```bash
npm run test:pdf            # generates all 4 report types, asserts valid PDF output
npm run test:weather        # hits Open-Meteo live, validates the anomaly maths
npm run test:guards         # asserts every live-SMS gate blocks (no network, no server)
npm run preview:letterhead  # renders page 1 to scripts/letterhead-p1.png
```

---

## 🔬 Risk Algorithm

**Prototype Risk Model** (requires epidemiological validation):

```
Risk Score (0–100) =
  0.25 × Water Quality Risk
+ 0.20 × Rainfall/Flood Risk
+ 0.20 × Symptom Signal
+ 0.15 × Sanitation Risk
+ 0.10 × Historical Disease Risk
+ 0.10 × Population Vulnerability
```

Weights are configurable. All variables normalized to 0–100.

| Risk Level | Score Range |
|------------|-------------|
| LOW        | 0–34        |
| MODERATE   | 35–54       |
| HIGH       | 55–74       |
| CRITICAL   | 75–100      |

---

## 📊 Synthetic Dataset

- **50 communities** across Kenya and Uganda (East Africa)
- **90 days** of temporal data (June 5 – September 3, 2026)
- **Crisis scenarios** seeded in 7 communities (C002, C003, C004, C008, C009, C038, C040)
- **8 water sensor** readings with realistic parameters
- **5 alerts** with full WHY Engine + intervention tracking
- **Deterministic generation** (seeded RNG) — demo always works identically

---

## 🎨 Brand

| Token | Hex |
|-------|-----|
| Deep Lake | `#063B46` |
| Maji Teal | `#087F8C` |
| Signal Gold | `#F2B84B` |
| Outbreak Coral | `#EB5D5D` |
| Mist | `#F4F8F7` |
| Charcoal | `#102A2E` |

**Fonts:** Manrope (headings) · IBM Plex Sans (body) · IBM Plex Mono (data)

---

## 🔒 Tech Stack

- **Frontend:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS (inline styles for component isolation)
- **Charts:** Recharts
- **Maps:** Leaflet + react-leaflet
- **State:** Zustand
- **Fonts:** Google Fonts (next/font)
- **Data:** Purely synthetic (seeded RNG in `lib/data.ts`)

---

## ⚡ Known Limitations (Prototype)

- Risk model is a weighted prototype — no epidemiological validation
- Map uses CartoDB tiles (requires internet)
- No real-time sensor data integration
- No backend API (state is client-side only)
- No authentication (add before any real deployment)
- Community reports don't persist across sessions

---

## 🗺️ Next Steps

1. **Retrospective validation** — access historical cholera outbreak data
2. **Partner with public health institutions** (KEMRI, Makerere SPH, etc.)
3. **IRB ethics review** for prospective data collection
4. **Real sensor integration** — affordable IoT water quality sensors
5. **Field pilot** — 3–5 communities with CHW feedback

---

*NTD GURD — Prototype v0.1 · Fellowship Demo · Not for clinical use*
