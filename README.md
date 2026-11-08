# FoodRush X — Next-Generation Intelligent Food Delivery & Logistics Ecosystem

FoodRush X is a production-oriented, full-stack food delivery platform and logistics command ecosystem built upon the original Food Rush project. It elevates static pages into a unified, reactive multi-role application connecting customers, kitchen managers, delivery riders, and platform administrators.

---

## 🌟 Four Connected Experiences

FoodRush X provides four fully synchronized role-based interfaces accessible from a single unified codebase with an instant top persona switcher:

### 1. 🍽️ Customer Food Ordering Application
- **Hero & Hyperlocal Discovery:** Preserves authentic branding, high-res photography (`hero.jpeg`, `paradise biriyani.avif`, `chickenbiriyani.jpg`), and location-aware recommendations.
- **Dietary & Cuisine Filtering:** Filter by Biryani, Fast Food, South Indian, Chinese, Desserts, and Kebabs with active veg/non-veg and spice tags.
- **Dish Customization Modal:** Portion sizes (Half / Full / Family Pack), optional add-ons (extra cheese, raita, sauces), allergen badges, calorie counts, and cooking instructions.
- **Server-Authoritative Cart & Multi-Restaurant Protection:** Prevents accidental multi-restaurant mixing, persists cart in localStorage, and calculates GST and delivery fees authoritatively on the backend.
- **Active Deals & Coupons:** One-click application of codes (`FIRST50`, `BIRYANI145`, `SWEET30`, `SOUTH100`, `BURGER798`, `CHICKEN453`).
- **Safe Demonstration Checkout:** Address validation, delivery instructions, and safe demo payment modes (UPI / QR, Cash on Delivery, Card, NetBanking).
- **Live Order Timeline & GPS Route Simulator:** Reactive step-by-step progress tracking (`PLACED` ➔ `CONFIRMED` ➔ `PREPARING` ➔ `READY_FOR_PICKUP` ➔ `OUT_FOR_DELIVERY` ➔ `DELIVERED`) with simulated vehicle navigation and one-click reordering.

### 2. 👨‍🍳 Restaurant Partner & Kitchen Dashboard (KDS)
- **Live Kitchen Display System (KDS):** Instant auditory/visual ticket alerts for incoming orders.
- **Kitchen Actions:** Accept / Reject tickets, transition status to "Start Cooking" (`PREPARING`) and "Pack & Seal" (`READY_FOR_PICKUP`).
- **Menu & Stock Oversight:** Instant real-time toggle between "In Stock" and "Mark Sold Out", and live price editing.
- **Daily Performance Metrics:** Today's ticket count, kitchen queue depth, and daily revenue tally.

### 3. 🛵 Delivery Partner Interface
- **Courier Profile:** Rajesh Kumar (`courier@foodrush.com`, TVS Raider 125 `TN-09-CB-4491`).
- **Online / Offline Toggle:** Switch availability to receive dispatched orders.
- **Available Orders Pool:** Claim orders waiting for courier pickup.
- **Active Navigation & Verification:** Step-by-step handoff verification ("Confirm Restaurant Pickup" ➔ "Simulate Route Progress" ➔ "Confirm Customer Delivery").

### 4. 🛡️ Platform Administrator Dashboard
- **Platform KPIs:** Gross Merchandise Value (GMV), 15% Platform Commission take rate, Average Order Value (AOV), Active Restaurants, and Courier fleet status.
- **Comprehensive Order Oversight:** Searchable transaction ledger with status filters and one-click CSV export.
- **Restaurant Onboarding & Availability:** Toggle restaurant operational status (Open / Closed).
- **System Audit Trail:** Immutable logs of every order transition, price change, and login event.

---

## 🤖 AI-Powered Food Concierge ("FoodRush X AI Genie")

Located via the glowing **AI Food Genie** button in the navigation bar, the AI Concierge enables natural language discovery:

- **Example Query:**
  > *"I need vegetarian dinner for two under ₹400, with a delivery time under 40 minutes."*
- **Capabilities:**
  - Extracts budgetary limits (e.g. ₹400), dietary requirements (`isVeg: true`), delivery speed (`<= 40m`), and party size (`for two`).
  - Queries verified restaurant database records (never hallucinates dishes or prices).
  - Automatically curates meal sets combining mains and sides within budget.
  - Explains why each combo was chosen and displays savings under budget.
  - Features a one-click **"Add Combo to Cart"** button to populate the checkout cart directly.

---

## 🏗️ Architecture & Technology Stack

```
foodrush-x/
├── server/
│   ├── index.ts                # Express REST API & SSE Event Stream
│   ├── db/
│   │   └── store.ts            # Persistent JSON/SQLite store with seed data & audit logs
│   ├── services/
│   │   ├── pricing.ts          # Server-side authoritative pricing, GST & coupon verification
│   │   ├── aiConcierge.ts      # Natural language food intent parser & recommendation engine
│   │   ├── dispatch.ts         # Smart courier assignment & simulated GPS path generator
│   │   └── events.ts           # Server-Sent Events (SSE) broadcaster for live order updates
│   └── data/
│       └── db.json             # File-backed database store
├── src/
│   ├── components/             # Reusable UI components (Navbar, Hero, Cards, Cart, Modals)
│   ├── pages/                  # Customer Home, Restaurant Catalogue, Detail, Dashboards
│   ├── context/                # AuthContext, CartContext, ToastContext
│   ├── api/client.ts           # Typed API client with SSE stream integration
│   ├── types/index.ts          # Unified TypeScript domain interfaces
│   ├── App.tsx                 # Main application controller
│   └── index.css               # Tailwind CSS 4 with custom dark obsidian & lime design tokens
├── public/assets/              # 100+ authentic food photographs, banners & icons preserved
├── tests/                      # Automated Vitest unit & integration test suites (33 tests)
├── legacy-backup/              # Exact copy of the original Food Rush HTML/CSS files
├── vite.config.ts              # Vite configuration with Tailwind CSS & API reverse proxy
└── package.json                # Project dependencies and operational scripts
```

---

## 🔑 Safe Development Demo Accounts

Switch roles instantly from the top persona bar or sign in with these credentials:

| Role | Email | Password | Details |
|---|---|---|---|
| **Customer** | `vyshnavi@foodrush.com` | `customer123` | Default customer persona (Bonasi Vyshnavi) |
| **Restaurant Partner** | `partner@paradise.com` | `partner123` | Paradise Biryani Kitchen KDS |
| **Restaurant Partner** | `partner@nawabi.com` | `partner123` | Nawabi Dum House Kitchen KDS |
| **Delivery Partner** | `courier@foodrush.com` | `courier123` | Rajesh Kumar (TVS Raider 125) |
| **Platform Admin** | `admin@foodrush.com` | `admin123` | Chief Administrator Command Center |

*(Note: Custom users can also register directly via the Sign Up form with bcrypt password hashing).*

---

## 🚀 Local Installation & Run Instructions

### Prerequisites
- Node.js `v20.x` or `v24.x`
- npm `v10.x` or `v11.x`

### 1. Setup Environment
```bash
cp .env.example .env
```
Ensure `.env` contains:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=foodrush_x_development_secret_2026
DISPATCH_SIMULATION_ENABLED=true
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Automated Tests
```bash
npm test
```
*Executes all 33 tests verifying pricing calculations, coupons, lifecycle state progression, functional workflows, and the AI concierge.*

### 4. Typecheck the Codebase
```bash
npx tsc --noEmit
```

### 5. Production Build
```bash
npm run build
```
*Produces optimized client bundle in `dist/`.*

### 6. Start the Application Locally

You must start the backend and frontend separately in two terminal windows:

**Terminal 1 — Backend API & Real-time SSE Stream:**
```bash
npm run server
```
*Starts Express server on `http://localhost:5000` (serves REST endpoints, SSE stream, and assets).*

**Terminal 2 — Frontend Client:**
```bash
npm run dev
```
*Starts Vite frontend dev server on `http://localhost:5173` with proxy routing to `http://localhost:5000`.*

---

## 🧪 Automated Test Suite Results

All 33 automated test cases execute with 100% pass rate:
- `tests/functionalAudit.test.ts` (18 tests): Comprehensive functional audit of catalog search, dish customization, server-side price protection, coupon limits, state progression, and courier dispatch.
- `tests/orderLifecycle.test.ts` (2 tests): Validates strict forward-only transitions (`PLACED` ➔ `CONFIRMED` ➔ `PREPARING` ➔ `READY_FOR_PICKUP` ➔ `OUT_FOR_DELIVERY` ➔ `DELIVERED`) and prevents illegal state rewinds.
- `tests/pricing.test.ts` (5 tests): Verifies base subtotals, 5% GST tax calculation, portion variants, optional add-ons, and multi-restaurant rejection.
- `tests/coupons.test.ts` (3 tests): Verifies discount caps for `FIRST50`, free delivery logic for `CHICKEN453`, and minimum spend rules.
- `tests/aiConcierge.test.ts` (2 tests): Verifies natural language intent parsing for budget, party size, vegetarian filters, and combo generation.
- `tests/apiIntegration.test.ts` (3 tests): Verifies end-to-end catalogue fetching and response contracts.

---

## 🔒 Security, Privacy & Authorization

- **No Secrets in Frontend:** API keys and JWT secrets are stored strictly on the server in `.env`. `.env` is ignored by Git and never committed.
- **Order Authorization:** Customer order view and cancellation endpoints strictly verify ownership (`order.userId === req.user.id`).
- **Role-Based Access Control:** Restaurant state changes require restaurant partner authorization for that specific restaurant. Courier claims require the `delivery` role. Admin metrics require the `admin` role.
- **Bcrypt Password Protection:** Registered users have passwords hashed with `bcryptjs`.
- **Zero Hallucination AI:** AI Concierge parses user criteria and returns exclusively real database items with verified catalog prices.
- **Dependency Audit:** Zero vulnerabilities detected (`npm audit` reports 0 vulnerabilities).

---

## 📦 Deployment Guidance

- **Frontend:** Host on Vercel, Netlify, or Cloudflare Pages pointing to `dist/`.
- **Backend:** Host on Render, Railway, AWS ECS, or Fly.io pointing to `server/index.ts`.
- **Database Scaling:** The current file-backed JSON database store (`server/data/db.json`) is ideal for single-instance demo or local evaluation. For multi-instance horizontal scaling, swap `db/store.ts` with PostgreSQL (Prisma or Drizzle ORM) using `DATABASE_URL`.
