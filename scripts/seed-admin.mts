import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as dotenvConfig } from "dotenv";

export type AuthAdminUser = {
  id: string;
  email?: string;
};

type AuthAdminUsersResponse = {
  users: AuthAdminUser[];
};

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: path.resolve(SCRIPT_DIR, "../.env.local") });

const DEFAULT_ADMIN_EMAIL = "admin@timetraveler.local";

function parseArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function restRequest<T>(
  baseUrl: string,
  serviceRoleKey: string,
  table: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    query?: string;
    body?: unknown;
  } = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const url = new URL(`${baseUrl.replace(/\/$/, "")}/rest/v1/${table}`);

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
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: "return=minimal",
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `PostgREST ${method} ${table} failed (${response.status} ${response.statusText}): ${text}`,
    );
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ([] as T);
}

async function authAdminRequest<T>(
  baseUrl: string,
  serviceRoleKey: string,
  path: string,
  method: "GET" | "POST" | "PUT",
  body?: unknown,
): Promise<T> {
  const url = `${baseUrl.replace(/\/$/, "")}/auth/v1/admin/${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Auth admin ${method} ${path} failed (${response.status} ${response.statusText}): ${text}`,
    );
  }

  return (await response.json()) as T;
}

/** Read-only lookup, shared with other seed scripts that need the admin's user id but must not create or mutate the account. */
export async function findAdminUser(
  baseUrl: string,
  serviceRoleKey: string,
  email: string,
): Promise<AuthAdminUser | undefined> {
  const usersResponse = await authAdminRequest<AuthAdminUsersResponse>(
    baseUrl,
    serviceRoleKey,
    "users?page=1&per_page=1000",
    "GET",
  );

  return usersResponse.users.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase(),
  );
}

async function ensureAdminUser(
  baseUrl: string,
  serviceRoleKey: string,
  email: string,
  password: string,
): Promise<AuthAdminUser> {
  const existingUser = await findAdminUser(baseUrl, serviceRoleKey, email);

  const ensuredUser = existingUser
    ? await authAdminRequest<AuthAdminUser>(
        baseUrl,
        serviceRoleKey,
        `users/${existingUser.id}`,
        "PUT",
        {
          password,
          email_confirm: true,
          user_metadata: {
            first_name: "Admin",
            last_name: "User",
          },
        },
      )
    : await authAdminRequest<AuthAdminUser>(
        baseUrl,
        serviceRoleKey,
        "users",
        "POST",
        {
          email,
          password,
          email_confirm: true,
          user_metadata: {
            first_name: "Admin",
            last_name: "User",
          },
        },
      );

  if (!ensuredUser.id) {
    throw new Error("Could not resolve admin user id from Auth Admin API.");
  }

  return ensuredUser;
}

async function main(): Promise<void> {
  const baseUrl =
    parseArg("url") ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "http://127.0.0.1:54321";
  const serviceRoleKey =
    parseArg("service-role-key") || requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const adminEmail =
    parseArg("admin-email") ||
    process.env.SEED_ADMIN_EMAIL ||
    DEFAULT_ADMIN_EMAIL;
  const adminPassword =
    parseArg("admin-password") || requiredEnv("SEED_ADMIN_PASSWORD");

  const adminUser = await ensureAdminUser(
    baseUrl,
    serviceRoleKey,
    adminEmail,
    adminPassword,
  );
  const userId = adminUser.id;

  await restRequest<unknown>(baseUrl, serviceRoleKey, "profiles", {
    method: "PATCH",
    query: `id=eq.${userId}`,
    body: {
      first_name: "Admin",
      last_name: "User",
      role: "admin",
    },
  });

  console.log("Target user:", userId);
  console.log("Target admin email:", adminEmail);
  console.log("Base URL:", baseUrl);
  console.log("Admin user ready.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Admin seed failed:", message);
    process.exitCode = 1;
  });
}
