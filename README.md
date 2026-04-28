# Hawwil | حوّل

Hawwil is a cross-border remittance app designed for GCC workers sending to Arab corridors, with transparent fees, fixed FX rates, and instant payout visibility.



## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Supabase Auth (magic link + password)
- Supabase Postgres + RLS
- Zustand for transfer wizard state

## What is implemented

- Authenticated sender flow (`/login`, `/home`, `/transfer`)
- Persisted transfers with dynamic balance debiting
- Receiver lookup (`/r/<referenceId>`) and internal operations console (`/ops`)

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
- `/login` auth
- `/home` sender dashboard
- `/transfer` transfer wizard
- `/history` sender history
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
