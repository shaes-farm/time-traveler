// ============================================================================
// scripts/lib/seed-common.mts
//
// Shared plumbing for the on-demand seed scripts (seed-discovery.mts and
// seed-human-discovery-of-time.mts). These scripts write curated datasets to a
// local Supabase stack via the PostgREST + Auth Admin REST APIs using the
// service-role key (which bypasses RLS), so every inserted row must set its
// owning `user_id` explicitly. See docs/seeding-discovery.md and
// docs/seeding-human-discovery-of-time.md.
//
// This module deliberately talks to REST directly rather than reusing
// @repo/services: every `create*` service function derives user_id from
// `auth.getUser()` and throws without an authenticated session, which a
// service-role client does not have.
// ============================================================================

import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as dotenvConfig } from "dotenv";

// ─── Temporal type (mirrors packages/services/src/schemas/temporal.ts) ───────
//
// A superset of the fields the seed scripts use. `year` must be a whole
// integer — the sort_order generated columns cast it to BIGINT and fractional
// years (e.g. 13.8 BYA → use 14) would fail. Prehistoric eras (KYA/MYA/BYA)
// must omit month/day. Absent end dates are SQL NULL, never `{}` (the column
// default was dropped in migration 00020).

export type Era = "CE" | "BCE" | "KYA" | "MYA" | "BYA";

export type Precision =
  | "exact"
  | "circa"
  | "approximate"
  | "estimated"
  | "geological";

export type DisplayFormat =
  | "standard"
  | "scientific"
  | "geological"
  | "cosmological";

export type ConfidenceLevel = "high" | "medium" | "low";

export type TemporalData = {
  year: number;
  era: Era;
  precision: Precision;
  month?: number;
  day?: number;
  uncertainty?: number;
  geological_period?: string;
  geological_epoch?: string;
  cosmological_epoch?: string;
  display_format?: DisplayFormat;
  dating_method?: string;
  confidence_level?: ConfidenceLevel;
  source?: string;
};

export type InsertedRow = { id: string; slug: string };

export type RestRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: string;
  body?: unknown;
  returnRepresentation?: boolean;
};

export type AuthAdminUser = {
  id: string;
  email?: string;
};

type AuthAdminUsersResponse = {
  users: AuthAdminUser[];
};

export type SeedConfig = {
  baseUrl: string;
  serviceRoleKey: string;
  adminEmail: string;
  adminPassword: string;
};

const DEFAULT_ADMIN_EMAIL = "admin@timetraveler.local";
const DEFAULT_ADMIN_PASSWORD = "Admin123!";

// ─── Environment + arg helpers ───────────────────────────────────────────────

/**
 * Load the repo-root `.env.local` (resolved relative to this file, which lives
 * at scripts/lib/), so seed scripts pick up SUPABASE_SERVICE_ROLE_KEY etc.
 * without the caller needing to know the repo layout.
 */
export function loadRootEnv(): void {
  const libDir = path.dirname(fileURLToPath(import.meta.url));
  dotenvConfig({ path: path.resolve(libDir, "../../.env.local") });
}

export function parseArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Resolve connection + admin config from CLI args, then env, then defaults —
 * the precedence used by both seed scripts.
 */
export function resolveSeedConfig(): SeedConfig {
  return {
    baseUrl:
      parseArg("url") ||
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      "http://127.0.0.1:54321",
    serviceRoleKey:
      parseArg("service-role-key") ||
      requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    adminEmail:
      parseArg("admin-email") ||
      process.env.SEED_ADMIN_EMAIL ||
      DEFAULT_ADMIN_EMAIL,
    adminPassword:
      parseArg("admin-password") ||
      process.env.SEED_ADMIN_PASSWORD ||
      DEFAULT_ADMIN_PASSWORD,
  };
}

export function assertTemporalData(value: TemporalData): void {
  if (!Number.isInteger(value.year)) {
    throw new Error(
      `Temporal year must be an integer. Received: ${value.year}`,
    );
  }
}

/**
 * PostgREST expects an in-list as `("a","b")`. Slugs here are seed-controlled
 * (no embedded quotes), so simple wrapping is sufficient.
 */
export function encodeIn(values: string[]): string {
  return `(${values.map((value) => `"${value}"`).join(",")})`;
}

// ─── REST + Auth Admin transport ─────────────────────────────────────────────

export async function restRequest<T>(
  config: SeedConfig,
  table: string,
  options: RestRequestOptions = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const url = new URL(
    `${config.baseUrl.replace(/\/$/, "")}/rest/v1/${table}`,
  );

  if (options.query) {
    for (const piece of options.query.split("&")) {
      const [key, ...rest] = piece.split("=");
      url.searchParams.set(key, rest.join("="));
    }
  }

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      Prefer: options.returnRepresentation
        ? "return=representation"
        : "return=minimal",
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `PostgREST ${method} ${table} failed (${response.status} ${response.statusText}): ${text}`,
    );
  }

  if (response.status === 204) {
    return [] as T;
  }

  const text = await response.text();
  if (!text) {
    return [] as T;
  }

  return JSON.parse(text) as T;
}

async function authAdminRequest<T>(
  config: SeedConfig,
  apiPath: string,
  method: "GET" | "POST" | "PUT",
  body?: unknown,
): Promise<T> {
  const url = `${config.baseUrl.replace(/\/$/, "")}/auth/v1/admin/${apiPath}`;
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Auth admin ${method} ${apiPath} failed (${response.status} ${response.statusText}): ${text}`,
    );
  }

  return (await response.json()) as T;
}

/**
 * Create the seed admin user if missing (or refresh its password if present),
 * then set its profile role to `admin` so the dataset is owned by an admin
 * account. The profiles row itself is provisioned by the handle_new_user
 * trigger (migration 00004) when the auth user is created.
 */
export async function ensureAdminUser(
  config: SeedConfig,
): Promise<AuthAdminUser> {
  const usersResponse = await authAdminRequest<AuthAdminUsersResponse>(
    config,
    "users?page=1&per_page=1000",
    "GET",
  );

  const existingUser = usersResponse.users.find(
    (user) => user.email?.toLowerCase() === config.adminEmail.toLowerCase(),
  );

  const userMetadata = { first_name: "Admin", last_name: "User" };

  const ensuredUser = existingUser
    ? await authAdminRequest<AuthAdminUser>(
        config,
        `users/${existingUser.id}`,
        "PUT",
        {
          password: config.adminPassword,
          email_confirm: true,
          user_metadata: userMetadata,
        },
      )
    : await authAdminRequest<AuthAdminUser>(config, "users", "POST", {
        email: config.adminEmail,
        password: config.adminPassword,
        email_confirm: true,
        user_metadata: userMetadata,
      });

  if (!ensuredUser.id) {
    throw new Error("Could not resolve admin user id from Auth Admin API.");
  }

  // Promote the profile to admin (the trigger creates it as 'editor').
  await restRequest<unknown>(config, "profiles", {
    method: "PATCH",
    query: `id=eq.${ensuredUser.id}`,
    body: { first_name: "Admin", last_name: "User", role: "admin" },
  });

  return ensuredUser;
}
