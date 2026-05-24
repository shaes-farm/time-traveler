import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types.js";
import {
  getCharacters,
  getCharacterById,
  getCharacterBySlug,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  getCharacterTimeline,
  getCharacterNetwork,
  getCharacterEvents,
  addMediaToCharacter,
  removeMediaFromCharacter,
} from "./character-service.js";

// ---------------------------------------------------------------------------
// Mock builder helpers (mirrors event-service.test.ts pattern)
// ---------------------------------------------------------------------------

function makeBuilder(result: { data: unknown; error: unknown }) {
  const terminal = vi.fn().mockResolvedValue(result);
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: terminal,
    then: (resolve: (v: unknown) => unknown) =>
      Promise.resolve(result).then(resolve),
  };
  return builder;
}

function makeClient(overrides: {
  fromResult?: { data: unknown; error: unknown };
  rpcResult?: { data: unknown; error: unknown };
  authUser?: { data: { user: unknown }; error: unknown };
}) {
  const {
    fromResult = { data: null, error: null },
    rpcResult = { data: null, error: null },
    authUser,
  } = overrides;

  const client = {
    from: vi.fn().mockReturnValue(makeBuilder(fromResult)),
    rpc: vi.fn().mockResolvedValue(rpcResult),
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue(
          authUser ?? { data: { user: { id: "user-123" } }, error: null },
        ),
    },
  };
  return client as unknown as SupabaseClient<Database>;
}

// ---------------------------------------------------------------------------
// Sample fixtures
// ---------------------------------------------------------------------------

const sampleTemporalData = {
  era: "CE",
  year: 1892,
  precision: "exact",
} as const;

const sampleCharacter = {
  id: "char-1",
  user_id: "user-123",
  slug: "sherlock-holmes",
  name: "Sherlock Holmes",
  character_type: "fictional",
  biography: "Consulting detective",
  aliases: ["The Great Detective"],
  cultural_context: null,
  physical_description: null,
  species: null,
  breed: null,
  domain: null,
  significance: "high",
  birth_temporal: sampleTemporalData,
  death_temporal: null,
  profile_data: null,
  metadata: null,
  published: false,
  published_at: null,
  search_vector: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const sampleCharacterWithRelations = {
  ...sampleCharacter,
  character_media: [],
  character_relationships: [],
};

const sampleMedia = {
  character_id: "char-1",
  media_id: "media-1",
  is_primary: false,
};

// ---------------------------------------------------------------------------
// getCharacters
// ---------------------------------------------------------------------------

describe("getCharacters", () => {
  it("returns an array of characters", async () => {
    const client = makeClient({
      fromResult: { data: [sampleCharacter], error: null },
    });
    const result = await getCharacters(client);
    expect(result).toEqual([sampleCharacter]);
  });

  it("returns empty array when data is null", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    const result = await getCharacters(client);
    expect(result).toEqual([]);
  });

  it("applies characterType filter", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getCharacters(client, { characterType: "fictional" });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("character_type", "fictional");
  });

  it("applies userId filter", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getCharacters(client, { userId: "user-abc" });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-abc");
  });

  it("applies search filter via full-text search", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getCharacters(client, { search: "detective" });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.textSearch).toHaveBeenCalledWith(
      "search_vector",
      "detective",
      { type: "websearch" },
    );
  });

  it("does not apply search filter when search is empty string", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getCharacters(client, { search: "" });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.textSearch).not.toHaveBeenCalled();
  });

  it("clamps page=0 to page=1", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getCharacters(client, { page: 0, pageSize: 10 });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.range).toHaveBeenCalledWith(0, 9);
  });

  it("clamps pageSize=0 to pageSize=1", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getCharacters(client, { page: 1, pageSize: 0 });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.range).toHaveBeenCalledWith(0, 0);
  });

  it("clamps pageSize>100 to 100", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getCharacters(client, { page: 1, pageSize: 999 });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.range).toHaveBeenCalledWith(0, 99);
  });

  it("orders results by name ascending", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getCharacters(client);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.order).toHaveBeenCalledWith("name", { ascending: true });
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "query failed" } },
    });
    await expect(getCharacters(client)).rejects.toThrow(
      "CharacterService.getCharacters: query failed",
    );
  });
});

// ---------------------------------------------------------------------------
// getCharacterById
// ---------------------------------------------------------------------------

describe("getCharacterById", () => {
  it("returns a character with relations", async () => {
    const client = makeClient({
      fromResult: { data: sampleCharacterWithRelations, error: null },
    });
    const result = await getCharacterById(client, "char-1");
    expect(result).toEqual(sampleCharacterWithRelations);
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "not found" } },
    });
    await expect(getCharacterById(client, "char-1")).rejects.toThrow(
      "CharacterService.getCharacterById: not found",
    );
  });
});

// ---------------------------------------------------------------------------
// getCharacterBySlug
// ---------------------------------------------------------------------------

describe("getCharacterBySlug", () => {
  it("filters by user_id and slug", async () => {
    const client = makeClient({
      fromResult: { data: sampleCharacterWithRelations, error: null },
    });
    await getCharacterBySlug(client, "user-123", "sherlock-holmes");
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-123");
    expect(builder.eq).toHaveBeenCalledWith("slug", "sherlock-holmes");
  });

  it("returns character with relations on success", async () => {
    const client = makeClient({
      fromResult: { data: sampleCharacterWithRelations, error: null },
    });
    const result = await getCharacterBySlug(
      client,
      "user-123",
      "sherlock-holmes",
    );
    expect(result).toEqual(sampleCharacterWithRelations);
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "not found" } },
    });
    await expect(
      getCharacterBySlug(client, "user-123", "sherlock-holmes"),
    ).rejects.toThrow("CharacterService.getCharacterBySlug: not found");
  });
});

// ---------------------------------------------------------------------------
// createCharacter — helpers
// ---------------------------------------------------------------------------

function makeCreateClient(insertResult: { data: unknown; error: unknown }) {
  let callCount = 0;
  return {
    from: vi.fn().mockImplementation(() => {
      callCount++;
      // First call: fetch existing slugs — returns empty array via .then
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: (resolve: (v: unknown) => unknown) =>
            Promise.resolve({ data: [], error: null }).then(resolve),
        };
      }
      // Second call: insert — returns the provided result
      return makeBuilder(insertResult);
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      }),
    },
    rpc: vi.fn(),
  } as unknown as SupabaseClient<Database>;
}

// ---------------------------------------------------------------------------
// createCharacter — one test per character type
// ---------------------------------------------------------------------------

describe("createCharacter", () => {
  it("creates a human character with valid profile_data", async () => {
    const client = makeCreateClient({ data: sampleCharacter, error: null });
    const result = await createCharacter(client, {
      name: "Sherlock Holmes",
      character_type: "human",
      profile_data: {
        character_type: "human",
        nationality: "British",
        occupation: "Detective",
      },
    });
    expect(result).toEqual(sampleCharacter);
  });

  it("creates an animal character with valid profile_data", async () => {
    const client = makeCreateClient({ data: sampleCharacter, error: null });
    const result = await createCharacter(client, {
      name: "Lassie",
      character_type: "animal",
      species: "Canis lupus familiaris",
      profile_data: {
        character_type: "animal",
        conservation_status: "least_concern",
      },
    });
    expect(result).toEqual(sampleCharacter);
  });

  it("creates a mythological character with valid profile_data", async () => {
    const client = makeCreateClient({ data: sampleCharacter, error: null });
    const result = await createCharacter(client, {
      name: "Heracles",
      character_type: "mythological",
      profile_data: {
        character_type: "mythological",
        mythology: "Greek",
        powers: ["superhuman strength", "immortality"],
      },
    });
    expect(result).toEqual(sampleCharacter);
  });

  it("creates a fictional character with valid profile_data", async () => {
    const client = makeCreateClient({ data: sampleCharacter, error: null });
    const result = await createCharacter(client, {
      name: "Sherlock Holmes",
      character_type: "fictional",
      profile_data: {
        character_type: "fictional",
        source_work: "A Study in Scarlet",
        author: "Arthur Conan Doyle",
        genre: "Mystery",
      },
    });
    expect(result).toEqual(sampleCharacter);
  });

  it("creates an organization character with valid profile_data", async () => {
    const client = makeCreateClient({ data: sampleCharacter, error: null });
    const result = await createCharacter(client, {
      name: "United Nations",
      character_type: "organization",
      profile_data: {
        character_type: "organization",
        org_type: "Intergovernmental",
        headquarters: "New York City, USA",
      },
    });
    expect(result).toEqual(sampleCharacter);
  });

  it("creates a divine character with valid profile_data", async () => {
    const client = makeCreateClient({ data: sampleCharacter, error: null });
    const result = await createCharacter(client, {
      name: "Zeus",
      character_type: "divine",
      domain: "Sky and thunder",
      profile_data: {
        character_type: "divine",
        pantheon: "Greek",
        worship_period: "800 BCE - 400 CE",
      },
    });
    expect(result).toEqual(sampleCharacter);
  });

  it("creates an artifact character with valid profile_data", async () => {
    const client = makeCreateClient({ data: sampleCharacter, error: null });
    const result = await createCharacter(client, {
      name: "Excalibur",
      character_type: "artifact",
      profile_data: {
        character_type: "artifact",
        artifact_type: "Sword",
        material: "Steel",
        current_location: "Lake",
      },
    });
    expect(result).toEqual(sampleCharacter);
  });

  it("creates a character without profile_data", async () => {
    const client = makeCreateClient({ data: sampleCharacter, error: null });
    const result = await createCharacter(client, {
      name: "Mystery Figure",
      character_type: "human",
    });
    expect(result).toEqual(sampleCharacter);
  });

  it("throws when no authenticated user", async () => {
    const client = makeClient({
      authUser: { data: { user: null }, error: null },
    });
    await expect(
      createCharacter(client, { name: "Test", character_type: "human" }),
    ).rejects.toThrow(
      "CharacterService.createCharacter: no authenticated user",
    );
  });

  it("throws when auth.getUser returns an error", async () => {
    const client = makeClient({
      authUser: { data: { user: null }, error: { message: "auth fail" } },
    });
    await expect(
      createCharacter(client, { name: "Test", character_type: "human" }),
    ).rejects.toThrow(
      "CharacterService.createCharacter(auth.getUser): auth fail",
    );
  });

  it("throws when profile_data fails type-specific validation", async () => {
    const client = makeCreateClient({ data: null, error: null });
    await expect(
      createCharacter(client, {
        name: "Lassie",
        character_type: "animal",
        profile_data: {
          character_type: "animal",
          conservation_status: "not-a-real-status",
        },
      }),
    ).rejects.toThrow();
  });

  it("rejects unknown keys in profile_data (strict schemas)", async () => {
    const client = makeCreateClient({ data: null, error: null });
    await expect(
      createCharacter(client, {
        name: "Arthur Conan Doyle",
        character_type: "human",
        profile_data: {
          character_type: "human",
          nationality: "Scottish",
          unknown_field: "should fail",
        },
      }),
    ).rejects.toThrow();
  });

  it("top-level character_type is authoritative even when profile_data contains a different character_type", async () => {
    // profile_data.character_type is 'animal' but the top-level type is 'human'.
    // The service must use the top-level type, so 'animal' in profile_data
    // should NOT cause it to validate as an animal profile — it should throw
    // because 'animal' inside profile_data is an unrecognised key for human.
    const client = makeCreateClient({ data: null, error: null });
    await expect(
      createCharacter(client, {
        name: "Test",
        character_type: "human",
        profile_data: {
          character_type: "animal",
          conservation_status: "extinct",
        },
      }),
    ).rejects.toThrow();
  });

  it("uses explicit slug when provided", async () => {
    const client = makeCreateClient({ data: sampleCharacter, error: null });
    const result = await createCharacter(client, {
      name: "Sherlock Holmes",
      character_type: "fictional",
      slug: "custom-slug",
    });
    expect(result).toEqual(sampleCharacter);
  });

  it("retries on 23505 unique violation and succeeds", async () => {
    let callCount = 0;
    const client = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "characters") {
          callCount++;
          // First call: fetch existing slugs
          if (callCount === 1) {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              then: (resolve: (v: unknown) => unknown) =>
                Promise.resolve({ data: [], error: null }).then(resolve),
            };
          }
          // Second call: 23505 collision
          if (callCount === 2) {
            return makeBuilder({
              data: null,
              error: { code: "23505", message: "unique violation" },
            });
          }
          // Third call: success
          return makeBuilder({ data: sampleCharacter, error: null });
        }
        return makeBuilder({ data: null, error: null });
      }),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
      rpc: vi.fn(),
    } as unknown as SupabaseClient<Database>;

    const result = await createCharacter(client, {
      name: "Sherlock Holmes",
      character_type: "fictional",
    });
    expect(result).toEqual(sampleCharacter);
  });

  it("throws after exhausting slug retries", async () => {
    let callCount = 0;
    const client = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "characters") {
          callCount++;
          if (callCount === 1) {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              then: (resolve: (v: unknown) => unknown) =>
                Promise.resolve({ data: [], error: null }).then(resolve),
            };
          }
          // All insert attempts fail with 23505
          return makeBuilder({
            data: null,
            error: { code: "23505", message: "unique violation" },
          });
        }
        return makeBuilder({ data: null, error: null });
      }),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
      rpc: vi.fn(),
    } as unknown as SupabaseClient<Database>;

    await expect(
      createCharacter(client, { name: "Test", character_type: "human" }),
    ).rejects.toThrow("unique violation");
  });
});

// ---------------------------------------------------------------------------
// updateCharacter
// ---------------------------------------------------------------------------

describe("updateCharacter", () => {
  it("returns updated character row", async () => {
    const updated = { ...sampleCharacter, name: "Dr. John Watson" };
    const client = makeClient({ fromResult: { data: updated, error: null } });
    const result = await updateCharacter(client, "char-1", {
      name: "Dr. John Watson",
    });
    expect(result).toEqual(updated);
  });

  it("validates profile_data against character_type when both are present", async () => {
    const client = makeClient({
      fromResult: { data: sampleCharacter, error: null },
    });
    // Invalid profile_data — conservation_status value is not a valid enum member
    await expect(
      updateCharacter(client, "char-1", {
        character_type: "animal",
        profile_data: {
          character_type: "animal",
          conservation_status: "extinct-soon",
        },
      }),
    ).rejects.toThrow();
  });

  it("skips profile validation when character_type is absent", async () => {
    const updated = { ...sampleCharacter, biography: "Updated bio" };
    const client = makeClient({ fromResult: { data: updated, error: null } });
    // profile_data present but no character_type — no type-profile validation
    const result = await updateCharacter(client, "char-1", {
      biography: "Updated bio",
      profile_data: { anything: "goes" },
    });
    expect(result).toEqual(updated);
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "update failed" } },
    });
    await expect(
      updateCharacter(client, "char-1", { name: "x" }),
    ).rejects.toThrow("CharacterService.updateCharacter: update failed");
  });
});

// ---------------------------------------------------------------------------
// deleteCharacter
// ---------------------------------------------------------------------------

describe("deleteCharacter", () => {
  it("resolves without error on success", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    await expect(deleteCharacter(client, "char-1")).resolves.toBeUndefined();
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "delete failed" } },
    });
    await expect(deleteCharacter(client, "char-1")).rejects.toThrow(
      "CharacterService.deleteCharacter: delete failed",
    );
  });
});

// ---------------------------------------------------------------------------
// getCharacterTimeline
// ---------------------------------------------------------------------------

describe("getCharacterTimeline", () => {
  const sampleTimelineRow = {
    character_id: "char-1",
    character_name: "Sherlock Holmes",
    event_id: "evt-1",
    event_title: "The Final Problem",
    role: "protagonist",
    significance: "primary",
    sort_order_years: 1891,
    temporal_data: { era: "CE", year: 1891, precision: "exact" },
    timeline_title: "Victorian Era",
  };

  it("returns timeline view rows for a character", async () => {
    const client = makeClient({
      fromResult: { data: [sampleTimelineRow], error: null },
    });
    const result = await getCharacterTimeline(client, "char-1");
    expect(result).toEqual([sampleTimelineRow]);
  });

  it("returns empty array when data is null", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    const result = await getCharacterTimeline(client, "char-1");
    expect(result).toEqual([]);
  });

  it("filters by character_id", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getCharacterTimeline(client, "char-1");
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("character_id", "char-1");
  });

  it("orders by sort_order_years ascending", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getCharacterTimeline(client, "char-1");
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.order).toHaveBeenCalledWith("sort_order_years", {
      ascending: true,
    });
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "view error" } },
    });
    await expect(getCharacterTimeline(client, "char-1")).rejects.toThrow(
      "CharacterService.getCharacterTimeline: view error",
    );
  });
});

// ---------------------------------------------------------------------------
// getCharacterNetwork
// ---------------------------------------------------------------------------

describe("getCharacterNetwork", () => {
  const sampleNetworkRow = {
    depth: 1,
    rel_type: "ally",
    source_id: "char-1",
    source_name: "Sherlock Holmes",
    target_id: "char-2",
    target_name: "Dr. Watson",
  };

  it("calls the character_network RPC with character ID", async () => {
    const client = makeClient({
      rpcResult: { data: [sampleNetworkRow], error: null },
    });
    const result = await getCharacterNetwork(client, "char-1");
    expect(result).toEqual([sampleNetworkRow]);
    expect(client.rpc).toHaveBeenCalledWith("character_network", {
      p_character_id: "char-1",
    });
  });

  it("passes depth when provided", async () => {
    const client = makeClient({
      rpcResult: { data: [], error: null },
    });
    await getCharacterNetwork(client, "char-1", 3);
    expect(client.rpc).toHaveBeenCalledWith("character_network", {
      p_character_id: "char-1",
      p_depth: 3,
    });
  });

  it("does not pass p_depth when depth is undefined", async () => {
    const client = makeClient({ rpcResult: { data: [], error: null } });
    await getCharacterNetwork(client, "char-1");
    expect(client.rpc).toHaveBeenCalledWith("character_network", {
      p_character_id: "char-1",
    });
  });

  it("clamps depth above MAX_NETWORK_DEPTH (5) to 5", async () => {
    const client = makeClient({ rpcResult: { data: [], error: null } });
    await getCharacterNetwork(client, "char-1", 99);
    expect(client.rpc).toHaveBeenCalledWith("character_network", {
      p_character_id: "char-1",
      p_depth: 5,
    });
  });

  it("clamps depth below 1 to 1", async () => {
    const client = makeClient({ rpcResult: { data: [], error: null } });
    await getCharacterNetwork(client, "char-1", 0);
    expect(client.rpc).toHaveBeenCalledWith("character_network", {
      p_character_id: "char-1",
      p_depth: 1,
    });
  });

  it("floors a float depth value", async () => {
    const client = makeClient({ rpcResult: { data: [], error: null } });
    await getCharacterNetwork(client, "char-1", 2.9);
    expect(client.rpc).toHaveBeenCalledWith("character_network", {
      p_character_id: "char-1",
      p_depth: 2,
    });
  });

  it("returns empty array when data is null", async () => {
    const client = makeClient({ rpcResult: { data: null, error: null } });
    const result = await getCharacterNetwork(client, "char-1");
    expect(result).toEqual([]);
  });

  it("throws on RPC error", async () => {
    const client = makeClient({
      rpcResult: { data: null, error: { message: "rpc failed" } },
    });
    await expect(getCharacterNetwork(client, "char-1")).rejects.toThrow(
      "CharacterService.getCharacterNetwork: rpc failed",
    );
  });
});

// ---------------------------------------------------------------------------
// getCharacterEvents
// ---------------------------------------------------------------------------

describe("getCharacterEvents", () => {
  const sampleEventCharacter = {
    character_id: "char-1",
    event_id: "evt-1",
    role: "protagonist",
    significance: "primary",
    description: null,
  };

  it("returns event_characters rows for a character", async () => {
    const client = makeClient({
      fromResult: { data: [sampleEventCharacter], error: null },
    });
    const result = await getCharacterEvents(client, "char-1");
    expect(result).toEqual([sampleEventCharacter]);
  });

  it("returns empty array when data is null", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    const result = await getCharacterEvents(client, "char-1");
    expect(result).toEqual([]);
  });

  it("filters by character_id", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getCharacterEvents(client, "char-1");
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("character_id", "char-1");
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "query failed" } },
    });
    await expect(getCharacterEvents(client, "char-1")).rejects.toThrow(
      "CharacterService.getCharacterEvents: query failed",
    );
  });
});

// ---------------------------------------------------------------------------
// addMediaToCharacter
// ---------------------------------------------------------------------------

describe("addMediaToCharacter", () => {
  it("inserts and returns the junction row", async () => {
    const client = makeClient({
      fromResult: { data: sampleMedia, error: null },
    });
    const result = await addMediaToCharacter(client, "char-1", "media-1");
    expect(result).toEqual(sampleMedia);
  });

  it("passes is_primary=true when specified", async () => {
    const primaryMedia = { ...sampleMedia, is_primary: true };
    const client = makeClient({
      fromResult: { data: primaryMedia, error: null },
    });
    const result = await addMediaToCharacter(client, "char-1", "media-1", true);
    expect(result).toEqual(primaryMedia);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.insert).toHaveBeenCalledWith({
      character_id: "char-1",
      media_id: "media-1",
      is_primary: true,
    });
  });

  it("defaults is_primary to false", async () => {
    const client = makeClient({
      fromResult: { data: sampleMedia, error: null },
    });
    await addMediaToCharacter(client, "char-1", "media-1");
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.insert).toHaveBeenCalledWith({
      character_id: "char-1",
      media_id: "media-1",
      is_primary: false,
    });
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "insert failed" } },
    });
    await expect(
      addMediaToCharacter(client, "char-1", "media-1"),
    ).rejects.toThrow("CharacterService.addMediaToCharacter: insert failed");
  });
});

// ---------------------------------------------------------------------------
// removeMediaFromCharacter
// ---------------------------------------------------------------------------

describe("removeMediaFromCharacter", () => {
  it("resolves without error on success", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    await expect(
      removeMediaFromCharacter(client, "char-1", "media-1"),
    ).resolves.toBeUndefined();
  });

  it("filters by character_id and media_id", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    await removeMediaFromCharacter(client, "char-1", "media-1");
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("character_id", "char-1");
    expect(builder.eq).toHaveBeenCalledWith("media_id", "media-1");
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "delete failed" } },
    });
    await expect(
      removeMediaFromCharacter(client, "char-1", "media-1"),
    ).rejects.toThrow(
      "CharacterService.removeMediaFromCharacter: delete failed",
    );
  });
});
