# On-Demand Seed: Age of Scientific Discovery

This repository includes a manual seed script for non-empty UI validation states.

The script does not run during `db:reset` and is safe to run on demand.

The script loads root-level `.env.local` automatically via `dotenv` before reading environment variables.

## What it seeds

- 1 parent period:
  - The Age of Scientific Discovery (1500–1955 CE)
- 3 timelines:
  - History of Electrical Discoveries
  - History of Physics
  - History of Astronomy
- 37 characters spanning all three disciplines:
  - **Electricity:** William Gilbert, Benjamin Franklin, Luigi Galvani, Alessandro Volta, Hans Christian Oersted, Andre-Marie Ampere, Georg Ohm, Michael Faraday, Samuel Morse, James Clerk Maxwell, Oliver Heaviside, Heinrich Hertz, Nikola Tesla, J. J. Thomson, Charles Proteus Steinmetz
  - **Physics:** Paracelsus, Galileo Galilei, Isaac Newton, Antoine Lavoisier, Johann Wolfgang von Goethe, Sadi Carnot, James Prescott Joule, Rudolf Clausius, Ludwig Boltzmann, Max Planck, Albert Einstein, Niels Bohr
  - **Astronomy:** Nicolaus Copernicus, Tycho Brahe, Johannes Kepler, Edmond Halley, William Herschel, Urbain Le Verrier, Annie Jump Cannon, Henrietta Swan Leavitt, Karl Schwarzschild, Edwin Hubble
- 44 discovery/milestone events spanning 1543–1929 CE
- Event participation links in `event_characters`
- Chronology links in `timeline_events`

## Rerun behavior

The script uses delete-and-recreate behavior for this dataset scope:

- Deletes existing seed records with slug prefix `seed-electricity-` for the target user
- Recreates the parent period, all timelines, characters, events, and junction rows

> **Note:** The slug prefix `seed-electricity-` is intentionally preserved from v1 so that re-running the script cleans up the original electricity-only dataset as well.

## Prerequisite: the admin user must already exist

This script no longer creates or updates the admin account — it only looks
one up by email and seeds data under that user's id. Run
[`pnpm db:seed:admin`](./seeding-admin.md) first. If the lookup fails, the
script exits with an error telling you to do so.

## Required environment variables

- `SUPABASE_SERVICE_ROLE_KEY`: service key used for insert/delete operations

Optional:

- `SUPABASE_URL` (default `http://127.0.0.1:54321`)
- `NEXT_PUBLIC_SUPABASE_URL` used as fallback if `SUPABASE_URL` is not set
- `SEED_ADMIN_EMAIL` (default `admin@timetraveler.local`) — used only to look
  up the existing admin user, not to create one

## Usage

Start Supabase first:

```bash
pnpm run db:start
```

Ensure the admin user exists (see [seeding-admin.md](./seeding-admin.md)):

```bash
pnpm run db:seed:admin
```

Run seed script:

```bash
pnpm run db:seed:discovery
```

The command assumes `SUPABASE_SERVICE_ROLE_KEY` (and optionally `SUPABASE_URL`) are already defined in root `.env.local`.

You can also pass values directly as CLI args:

```bash
pnpm run db:seed:discovery -- --service-role-key=<service-role-key> --admin-email=admin@timetraveler.local --url=http://127.0.0.1:54321
```

## Notes

- This script expects the admin user to already exist — run
  `pnpm db:seed:admin` first. It no longer creates or updates the admin
  account or its password.
- The seed dataset is tagged in `metadata` with:
  - `seed_dataset: scientific_discoveries`
  - `seed_version: v2`
  - `seed_prefix: seed-electricity`
- This script is intended for local/dev/test UI validation workflows.
