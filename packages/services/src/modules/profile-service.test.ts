import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import { getProfileByUsername, getProfilesByIds } from "./profile-service";

// ---------------------------------------------------------------------------
// Mock builder helpers
// ---------------------------------------------------------------------------

function makeBuilder(result: { data: unknown; error: unknown }) {
  const terminal = vi.fn().mockResolvedValue(result);
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    maybeSingle: terminal,
    then: (resolve: (v: unknown) => unknown) =>
      Promise.resolve(result).then(resolve),
  };
  return builder;
}

function makeClient(fromResult: { data: unknown; error: unknown }) {
  return {
    from: vi.fn().mockReturnValue(makeBuilder(fromResult)),
  } as unknown as SupabaseClient<Database>;
}

// ---------------------------------------------------------------------------
// Sample fixtures
// ---------------------------------------------------------------------------

const sampleProfile = {
  id: "user-123",
  first_name: "Irène",
  last_name: "Joliot-Curie",
  username: "irenejc",
  bio: null,
  avatar_url: null,
  website: null,
  social_links: null,
  role: "editor",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

// ---------------------------------------------------------------------------
// getProfileByUsername
// ---------------------------------------------------------------------------

describe("getProfileByUsername", () => {
  it("returns the matching profile row", async () => {
    const client = makeClient({ data: sampleProfile, error: null });
    const result = await getProfileByUsername(client, "irenejc");
    expect(result).toEqual(sampleProfile);
    expect(client.from).toHaveBeenCalledWith("profiles");
  });

  it("returns null when no profile matches", async () => {
    const client = makeClient({ data: null, error: null });
    const result = await getProfileByUsername(client, "nobody");
    expect(result).toBeNull();
  });

  it("throws on a query error", async () => {
    const client = makeClient({
      data: null,
      error: { message: "boom" },
    });
    await expect(getProfileByUsername(client, "irenejc")).rejects.toThrow(
      "ProfileService.getProfileByUsername: boom",
    );
  });
});

// ---------------------------------------------------------------------------
// getProfilesByIds
// ---------------------------------------------------------------------------

describe("getProfilesByIds", () => {
  it("short-circuits to [] for an empty id list without querying", async () => {
    const client = makeClient({ data: null, error: null });
    const result = await getProfilesByIds(client, []);
    expect(result).toEqual([]);
    expect(client.from).not.toHaveBeenCalled();
  });

  it("returns the matched profile rows", async () => {
    const client = makeClient({ data: [sampleProfile], error: null });
    const result = await getProfilesByIds(client, ["user-123"]);
    expect(result).toEqual([sampleProfile]);
    expect(client.from).toHaveBeenCalledWith("profiles");
  });

  it("returns [] when the query yields null data", async () => {
    const client = makeClient({ data: null, error: null });
    const result = await getProfilesByIds(client, ["user-123"]);
    expect(result).toEqual([]);
  });

  it("throws on a query error", async () => {
    const client = makeClient({
      data: null,
      error: { message: "nope" },
    });
    await expect(getProfilesByIds(client, ["user-123"])).rejects.toThrow(
      "ProfileService.getProfilesByIds: nope",
    );
  });
});
