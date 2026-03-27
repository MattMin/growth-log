# Growth Log

English | [中文](README_zh.md)

A web app for recording and tracking baby growth data, supporting height, weight, and head circumference records with visualization on WHO / CDC growth charts.

## Features

- **Baby Management** — Add multiple babies with name, birth date, gender; supports corrected age for premature babies and custom avatars
- **Growth Data Recording** — Record weight (kg), height (cm), head circumference (cm); supports editing and deleting
- **Growth Charts** — Chart.js-based charts overlaid with WHO / CDC percentile references (P1–P99); P3/P50/P97 labels on the right; X-axis auto-adapts to data range
- **Growth Standards** — WHO (0–18y weight/height, 0–5y head circumference) and CDC (0–18y weight/height, 0–3y head circumference)
- **CSV Import/Export** — Bulk import historical data or export backups; format: `Date, Weight (kg), Height (cm), Head Circumference (cm)`
- **Import by ID** — Share a baby's UUID to import data on another device; supports shared-data mode and independent-copy mode
- **Dark / Light Mode** — Follows system preference or manual toggle
- **Supabase Cloud Sync** — Store data via Supabase for cross-platform sync; falls back to localStorage when not configured
- **Vercel Deployment** — One-click deploy to Vercel

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styling**: Tailwind CSS v4
- **Charts**: Chart.js + react-chartjs-2
- **Data Parsing**: PapaParse
- **Cloud Storage**: Supabase
- **Deployment**: Vercel

## Quick Start

### Install Dependencies

```bash
npm install
```

### Local Development

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

### Build

```bash
npm run build
```

## Supabase Setup (Optional)

To enable cloud storage and cross-device sync, create a project on [Supabase](https://supabase.com/) and configure environment variables:

```bash
cp .env.local.example .env.local
```

Set the following variables:

- `NEXT_PUBLIC_SUPABASE_URL` — Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Anonymous key (anon key)

### Database Schema

Run the following SQL in the Supabase SQL Editor:

```sql
-- Babies table
create table babies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  birth_date date not null,
  gender text not null check (gender in ('male', 'female')),
  premature_birth_date date,
  avatar text,
  created_at timestamptz default now()
);

-- Growth records table
create table growth_records (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies(id) on delete cascade,
  date date not null,
  weight numeric,
  height numeric,
  head_circumference numeric,
  created_at timestamptz default now()
);

create index idx_growth_records_baby_id on growth_records(baby_id);

alter table babies enable row level security;
alter table growth_records enable row level security;

create policy "Allow all access to babies" on babies for all using (true) with check (true);
create policy "Allow all access to growth_records" on growth_records for all using (true) with check (true);
```

When Supabase is not configured, the app automatically uses browser localStorage.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/
│   │   ├── baby/[id]/      # Baby detail (charts / data list)
│   │   └── page.tsx        # Baby management list
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── components/             # UI components
│   ├── BabyCard.tsx        # Baby info card (swipe to edit/delete)
│   ├── BabyForm.tsx        # Add/edit baby form
│   ├── CsvImport.tsx       # CSV data import
│   ├── GrowthChart.tsx     # Growth chart
│   ├── GrowthRecordForm.tsx # Growth data form
│   ├── GrowthRecordList.tsx # Growth data list
│   ├── Header.tsx          # Header navigation
│   ├── ImportById.tsx      # Import baby by ID
│   └── ThemeToggle.tsx     # Theme toggle button
├── contexts/               # React Context
│   ├── DataContext.tsx     # Data layer (Supabase / localStorage)
│   └── ThemeContext.tsx    # Theme management
└── lib/                    # Utilities
    ├── cloudkit.ts         # CloudKit JS wrapper (deprecated)
    ├── growth-standards.ts # WHO & CDC growth standard data
    ├── local-storage.ts    # localStorage storage
    ├── supabase.ts         # Supabase client
    └── types.ts            # TypeScript type definitions
```

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/MattMin/growth-log)

Or via CLI:

```bash
npx vercel
```

## License

MIT
