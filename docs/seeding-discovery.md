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
pnpm run db:seed:discovery
```

The command assumes `SUPABASE_SERVICE_ROLE_KEY` (and optionally `SUPABASE_URL`) are already defined in root `.env.local`.

You can also pass values directly as CLI args:

```bash
pnpm run db:seed:discovery -- --service-role-key=<service-role-key> --admin-email=admin@timetraveler.local --admin-password='Admin123!' --url=http://127.0.0.1:54321
```

## Notes

- The script creates `admin@timetraveler.local` if missing.
- If the admin user already exists, the script updates that account password to `Admin123!` by default.
- The script sets the matching profile role to `admin`.
- The seed dataset is tagged in `metadata` with:
  - `seed_dataset: scientific_discoveries`
  - `seed_version: v2`
  - `seed_prefix: seed-electricity`
- This script is intended for local/dev/test UI validation workflows.
