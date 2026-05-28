# On-Demand Seed: History of Electrical Discoveries

This repository now includes a manual seed script for non-empty UI validation states.

The script does not run during `db:reset` and is safe to run on demand.

The script loads root-level `.env.local` automatically via `dotenv` before reading environment variables.

## What it seeds

- 1 timeline:
  - History of Electrical Discoveries
- 15 characters:
  - William Gilbert
  - Benjamin Franklin
  - Luigi Galvani
  - Alessandro Volta
  - Hans Christian Oersted
  - Andre-Marie Ampere
  - Georg Ohm
  - Michael Faraday
  - Samuel Morse
  - James Clerk Maxwell
  - Oliver Heaviside
  - Heinrich Hertz
  - Nikola Tesla
  - J. J. Thomson
  - Charles Proteus Steinmetz
- 16 discovery/milestone events spanning 1600-1897
- Event participation links in `event_characters`
- Chronology links in `timeline_events`

## Rerun behavior

The script uses delete-and-recreate behavior for this dataset scope:

- Deletes existing seed records with slug prefix `seed-electricity-` for the target user
- Recreates timeline, characters, events, and junction rows

## Required environment variables

- `SUPABASE_SERVICE_ROLE_KEY`: service key used for insert/delete operations

Optional:

- `SUPABASE_URL` (default `http://127.0.0.1:54321`)
- `NEXT_PUBLIC_SUPABASE_URL` used as fallback if `SUPABASE_URL` is not set
- `SEED_ADMIN_EMAIL` (default `admin@timetraveler.local`)
- `SEED_ADMIN_PASSWORD` (default `Admin123!`)

## Usage

Start Supabase first:

```bash
pnpm run db:start
```

Run seed script:

```bash
pnpm run db:seed:electricity
```

The command assumes `SUPABASE_SERVICE_ROLE_KEY` (and optionally `SUPABASE_URL`) are already defined in root `.env.local`.

You can also pass values directly as CLI args:

```bash
pnpm run db:seed:electricity -- --service-role-key=<service-role-key> --admin-email=admin@timetraveler.local --admin-password='Admin123!' --url=http://127.0.0.1:54321
```

## Notes

- The script creates `admin@timetraveler.local` if missing.
- If the admin user already exists, the script updates that account password to `Admin123!` by default.
- The script sets the matching profile role to `admin`.
- The seed dataset is tagged in `metadata` with:
  - `seed_dataset: electricity_discoveries`
  - `seed_version: v1`
  - `seed_prefix: seed-electricity`
- This script is intended for local/dev/test UI validation workflows.
