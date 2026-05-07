# Hawwil | حوّل

Hawwil is a cross-border remittance app designed for GCC workers sending to Arab corridors, with transparent fees, fixed FX rates, and instant payout visibility.

> **Note:** This project was built as a participation in **SalamHack 2026** (Track 1: Sending & Receiving Money).

## SalamHack 2026 Sandbox Assumptions

To avoid over-engineering legal compliance during the hackathon, Hawwil operates under these provided assumptions:

1. **Virtual License:** We hold a Central Bank Regulatory Sandbox License.
2. **Verified Users:** All users have passed KYC/AML.
3. **Fixed FX Rates:** We use fixed hackathon rates (1 SAR = 140 YER / 0.19 JOD / 13 EGP / 3,400 SYP).
4. **Instant Settlement:** Cross-border settlement is instant.
5. **Pre-Funded Liquidity:** Payout pools are already funded in destination countries.

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Supabase Auth (magic link + password)
- Supabase Postgres + RLS
- Zustand for transfer wizard state
- Tailwind CSS v4 + shadcn/ui + lucide-react

## What is implemented

- Authenticated sender flow (`/login`, `/signup`, `/home`, `/transfer`)
- Self-serve user registration and email verification
- Instant P2P transfers between Hawwil accounts via email lookup and QR code scanning
- Persisted transfers with dynamic balance debiting
- Scheduled and recurring remittances (`/schedules`)
- Transfer history with PDF receipt downloads and CSV exports (`/history`)
- Real-time receiver notifications via Twilio (SMS & WhatsApp)
- Interactive receiver portal (`/r/<referenceId>`) where recipients can choose their preferred payout method
- Internal operations console (`/ops`)

## Setup

1. Copy `.env.example` to `.env.local`.
2. Fill all Supabase environment variables in `.env.local`.
3. Run migration SQL:
   - `supabase/migrations/20260429002000_phase2_core.sql`
4. Seed demo users:
   - `pnpm seed:users`
5. Start app:
   - `pnpm dev`

## Demo Credentials

- `ops@hawwil.demo` / `HawwilDemo123!` (ops admin)
- `muneeb@hawwil.demo` / `HawwilDemo123!` (sender)

## Useful Routes

- `/` welcome
- `/login` auth (password & magic link)
- `/signup` account creation
- `/home` sender dashboard
- `/transfer` transfer wizard
- `/schedules` recurring remittance manager
- `/history` sender history & exports
- `/ops` internal operations console
- `/r/<referenceId>` public receiver lookup

## Troubleshooting

- `email rate limit exceeded` on `/login`:
  - Use password sign-in with seeded users, or wait briefly before retrying magic link.
- `Could not find table public.profiles` when seeding:
  - Run migration SQL first, then rerun `pnpm seed:users`.
- Unauthenticated redirect loops:
  - Check `.env.local` values and restart `pnpm dev`.

## Scripts

- `pnpm dev` start local dev server
- `pnpm lint` run lint checks
- `pnpm build` production build check
- `pnpm seed:users` create/update demo auth users and profiles
