# On-Demand Seed: Admin User

This script creates (or updates) the local/dev admin user that other seed
scripts, such as [`db:seed:discovery`](./seeding-discovery.md), expect to
already exist. It is the only seed script that creates or mutates the admin
account.

The script loads root-level `.env.local` automatically via `dotenv` before
reading environment variables.

## What it does

- Looks up a user by email via the Supabase Auth Admin API.
- Creates the user if missing, or updates its password and confirms its
  email if it already exists.
- Sets the matching `profiles` row's `role` to `admin`.

Safe to rerun — rerunning updates the existing account rather than failing.

## Required environment variables

- `SUPABASE_SERVICE_ROLE_KEY`: service key used for the Auth Admin API and
  `profiles` update
- `SEED_ADMIN_PASSWORD`: password for the admin account. **No default** —
  the script fails fast if this isn't set (via env or `--admin-password`).

Optional:

- `SUPABASE_URL` (default `http://127.0.0.1:54321`)
- `NEXT_PUBLIC_SUPABASE_URL` used as fallback if `SUPABASE_URL` is not set
- `SEED_ADMIN_EMAIL` (default `admin@timetraveler.local`)

## Usage

Start Supabase first:

```bash
pnpm run db:start
```

Run the seed script:

```bash
pnpm run db:seed:admin
```

The command assumes `SUPABASE_SERVICE_ROLE_KEY` and `SEED_ADMIN_PASSWORD`
(and optionally `SUPABASE_URL`, `SEED_ADMIN_EMAIL`) are already defined in
root `.env.local`.

You can also pass values directly as CLI args:

```bash
pnpm run db:seed:admin -- --service-role-key=<service-role-key> --admin-email=admin@timetraveler.local --admin-password='<password>' --url=http://127.0.0.1:54321
```

## Notes

- This script is intended for local/dev/test workflows.
- Other seed scripts (e.g. `db:seed:discovery`) only look this user up by
  email — they do not create or update it. Run `db:seed:admin` first.
