# TurfPro ERP — Futuristic Turf Booking System

> **Production-ready MVP** · Next.js 14 · Supabase · Razorpay · Glassmorphism Dark UI · PWA

---

## Architecture

```
Browser (PWA)
    │
    ▼
Next.js 14 App Router (Vercel)
    │   ├── /app/page.tsx          → Dashboard
    │   ├── /app/calendar          → Time-grid Calendar
    │   ├── /app/bookings          → Booking Management
    │   ├── /app/pricing           → Pricing Engine
    │   ├── /app/reports           → Analytics
    │   └── /app/turfs             → Turf Management
    │
    └── /app/api/                  → Next.js API Routes
            ├── /bookings          → CRUD + conflict check
            ├── /availability      → Free slot + AI suggest
            ├── /payments/         → Razorpay order + verify
            ├── /reports/          → Revenue + utilization
            ├── /invoices          → GST invoice generation
            ├── /pricing           → Pricing rules CRUD
            ├── /turfs             → Turf CRUD
            └── /customers         → Customer lookup

Supabase (PostgreSQL + Realtime)
    ├── turfs
    ├── customers
    ├── pricing_rules
    ├── bookings       ← EXCLUDE constraint (no overlaps)
    ├── payments
    └── invoices
```

---

## Quick Start

### 1. Clone & Install
```bash
git clone <repo>
cd turf
npm install
```

### 2. Set up Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → run `supabase/migrations/001_initial_schema.sql`
3. Run `supabase/seed.sql` for demo data
4. Copy your **Project URL** and **anon key** from Settings → API

### 3. Configure Environment
```bash
cp .env.local.example .env.local
# Fill in your values:
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
# SUPABASE_SERVICE_ROLE_KEY=
# RAZORPAY_KEY_ID=
# RAZORPAY_KEY_SECRET=
```

### 4. Run Development Server
```bash
npm run dev
# Open http://localhost:3000
```

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `turfs` | Sports facilities (Turf A, Turf B) |
| `customers` | Customer records (no login) |
| `pricing_rules` | Peak/off-peak time-based pricing |
| `bookings` | All bookings with overlap prevention |
| `payments` | Razorpay + cash payment records |
| `invoices` | GST invoices with GSTIN fields |

**Key constraint:** `bookings.EXCLUDE USING GIST` prevents double-booking on same turf at same time.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST/PATCH | `/api/bookings` | Booking CRUD |
| GET | `/api/availability` | Check free slots + AI suggestions |
| POST | `/api/payments/create-order` | Create Razorpay order |
| POST | `/api/payments/verify` | Verify payment signature |
| GET | `/api/reports/revenue` | Revenue by date |
| GET | `/api/reports/utilization` | Turf utilization % |
| GET/POST | `/api/invoices` | Generate GST invoice |
| GET/POST/PATCH/DELETE | `/api/pricing` | Pricing rules |
| GET/POST/PATCH/DELETE | `/api/turfs` | Turf management |
| GET/POST | `/api/customers` | Customer records |

---

## Features

### Slot Booking
- Time-grid calendar (6 AM – 11 PM, week/day view)
- Click empty slot → opens booking form
- Supabase EXCLUDE constraint prevents overlaps at DB level
- Admin creates bookings on behalf of customers

### Pricing Engine
- Peak / Off-peak rules per turf per day-of-week
- Auto-calculates price when slot is selected
- 18% GST auto-applied

### Payments
- Razorpay online payment flow
- Pay-at-venue option
- Pending / Paid / Failed / Refunded states

### Reports
- Revenue trends (AreaChart)
- Turf utilization (PieChart + BarChart)
- AI insights (demand patterns, pricing tips)
- Date-range filtering

### GST Invoicing
- Auto-generated invoice number
- GSTIN fields for business + customer
- PDF generated client-side via jsPDF

### PWA
- `manifest.json` + Service Worker
- Offline caching for static pages
- Add to home screen on Android/iOS

---

## Day-wise Build Plan

| Day | Task |
|-----|------|
| Day 1 | Supabase setup + schema + seed data |
| Day 2 | Next.js scaffold + layout + sidebar |
| Day 3 | Dashboard page + stats cards + charts |
| Day 4 | Calendar + BookingModal |
| Day 5 | Bookings list + filters + cancel flow |
| Day 6 | Pricing engine page |
| Day 7 | Reports + analytics charts |
| Day 8 | Turf management page |
| Day 9 | Razorpay integration + payment flow |
| Day 10 | GST invoice generation + PDF download |
| Day 11 | PWA setup + offline support |
| Day 12 | Vercel deployment + env setup |
| Day 13 | Testing + bug fixes |
| Day 14 | Launch 🚀 |

---

## Deployment (Free Tier)

### Vercel (Frontend + API)
```bash
npm install -g vercel
vercel --prod
# Add all env variables in Vercel dashboard → Settings → Environment Variables
```

### Supabase (Database)
- Free tier: 500 MB DB, 2 GB bandwidth, 50,000 monthly active users
- Auto-scales, built-in connection pooling

### Custom Domain
- Add domain in Vercel dashboard
- Update DNS CNAME records

---

## UI Component Map

```
app/layout.tsx
  ├── Header.tsx         (top bar: search, quick actions, notifications)
  ├── Sidebar.tsx        (nav: Dashboard, Calendar, Bookings, Turfs, Pricing, Reports)
  └── <page>
       ...

/                → Dashboard
  ├── StatsCard      (Revenue, Bookings, Utilization, Active Turfs)
  ├── RevenueChart   (14-day area chart via Recharts)
  ├── UtilizationWidget (progress bars per turf + AI insight)
  └── RecentBookings (table of today's bookings)

/calendar        → BookingCalendar
  └── BookingModal     (create/edit booking form)

/bookings        → Bookings list + filters table
  └── BookingModal

/pricing         → Pricing rules cards
  └── PricingRuleForm (modal)

/reports         → BarChart + PieChart + utilization table

/turfs           → Turf cards grid
  └── TurfForm (modal)
```

---

## Tech Stack

| Layer | Tech | Free? |
|-------|------|-------|
| Frontend | Next.js 14 + TypeScript | ✅ |
| Styling | Tailwind CSS + custom glassmorphism | ✅ |
| Charts | Recharts | ✅ |
| Icons | Lucide React | ✅ |
| Database | Supabase PostgreSQL | ✅ |
| Auth | Supabase Auth (admin only) | ✅ |
| Payments | Razorpay (test mode) | ✅ |
| Hosting | Vercel | ✅ |
| PDF | jsPDF | ✅ |
| PWA | Custom SW + manifest | ✅ |

**Total infra cost: ₹0/month on free tiers**

---

## Environment Variables Reference

```env
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase anon key (client)
SUPABASE_SERVICE_ROLE_KEY=        # Supabase service role (server only)
RAZORPAY_KEY_ID=                  # Razorpay key ID (server)
RAZORPAY_KEY_SECRET=              # Razorpay key secret (server)
NEXT_PUBLIC_RAZORPAY_KEY_ID=      # Razorpay key ID (client, for checkout)
NEXT_PUBLIC_APP_URL=              # App base URL
NEXT_PUBLIC_BUSINESS_NAME=        # Your business name (for invoices)
NEXT_PUBLIC_BUSINESS_GSTIN=       # Your GSTIN number
NEXT_PUBLIC_GST_RATE=18           # GST rate (default 18%)
```

---

*Built with ❤️ as a production-ready MVP. Extend, clone, deploy freely.*
