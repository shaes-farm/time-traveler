import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types.js";
import {
  getRelationships,
  getRelationshipById,
  createRelationship,
  updateRelationship,
  deleteRelationship,
  getSharedEvents,
  getCharacterNetwork,
  getMutualRelationships,
} from "./character-relationship-service.js";

// ---------------------------------------------------------------------------
// Mock builder helpers
// ---------------------------------------------------------------------------

function makeBuilder(result: { data: unknown; error: unknown }) {
  const terminal = vi.fn().mockResolvedValue(result);
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
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

// Proper RFC 4122 v4 UUIDs (version nibble = 4, variant nibble in [89ab])
const UUID_A = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"; // char-1
const UUID_B = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22"; // char-2

const sampleRelationship = {
  id: "rel-1",
  user_id: "user-123",
  character_id: UUID_A,
  related_character_id: UUID_B,
  relationship_type: "friendship",
  description: "old friends",
  start_temporal: null,
  end_temporal: null,
  metadata: {},
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

// Shape matching character_network_view (includes both character names)
const sampleRelationshipView = {
  relationship_id: "rel-1",
  character_id: UUID_A,
  character_name: "Alice",
  related_id: UUID_B,
  related_name: "Bob",
  relationship_type: "friendship",
  description: "old friends",
  start_temporal: null,
  end_temporal: null,
};

const sampleEvent = {
  id: "event-1",
  user_id: "user-123",
  slug: "battle-of-waterloo",
  title: "Battle of Waterloo",
  event_type: "battle",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const sampleNetworkNode = {
  source_id: "char-1",
  target_id: "char-2",
  rel_type: "friendship",
  source_name: "Alice",
  target_name: "Bob",
  depth: 1,
};

// ---------------------------------------------------------------------------
// getRelationships
// ---------------------------------------------------------------------------

describe("getRelationships", () => {
  it("returns relationships for a character", async () => {
    const client = makeClient({
      fromResult: { data: [sampleRelationship], error: null },
    });
    const result = await getRelationships(client, UUID_A);
    expect(result).toEqual([sampleRelationship]);
  });

  it("throws when characterId is not a valid UUID", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await expect(getRelationships(client, "not-a-uuid")).rejects.toThrow(
      "CharacterRelationshipService: characterId is not a valid UUID",
    );
  });

  it("queries with OR filter covering both column positions", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getRelationships(client, UUID_A);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.or).toHaveBeenCalledWith(
      `character_id.eq.${UUID_A},related_character_id.eq.${UUID_A}`,
    );
  });

  it("applies relationshipType filter", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getRelationships(client, UUID_A, { relationshipType: "enemy" });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("relationship_type", "enemy");
  });

  it("returns empty array when no results", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    const result = await getRelationships(client, UUID_A);
    expect(result).toEqual([]);
  });

  it("throws on query error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "db error" } },
    });
    await expect(getRelationships(client, UUID_A)).rejects.toThrow(
      "CharacterRelationshipService.getRelationships: db error",
    );
  });
});

// ---------------------------------------------------------------------------
// getRelationshipById
// ---------------------------------------------------------------------------

describe("getRelationshipById", () => {
  it("returns the relationship with character details from the view", async () => {
    const client = makeClient({
      fromResult: { data: sampleRelationshipView, error: null },
    });
    const result = await getRelationshipById(client, "rel-1");
    expect(result).toEqual(sampleRelationshipView);
    expect(client.from).toHaveBeenCalledWith("character_network_view");
  });

  it("filters by relationship_id", async () => {
    const client = makeClient({
      fromResult: { data: sampleRelationshipView, error: null },
    });
    await getRelationshipById(client, "rel-1");
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("relationship_id", "rel-1");
  });

  it("throws on error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "not found" } },
    });
    await expect(getRelationshipById(client, "rel-1")).rejects.toThrow(
      "CharacterRelationshipService.getRelationshipById: not found",
    );
  });
});

// ---------------------------------------------------------------------------
// createRelationship
// ---------------------------------------------------------------------------

const validInput = {
  character_id: UUID_A,
  related_character_id: UUID_B,
  relationship_type: "friendship" as const,
};

function makeCreateClient(insertResult: { data: unknown; error: unknown }) {
  const insertBuilder = {
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(insertResult),
  };
  const builder = {
    ...makeBuilder({ data: [], error: null }),
    insert: vi.fn().mockReturnValue(insertBuilder),
  };
  const client = {
    from: vi.fn().mockReturnValue(builder),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      }),
    },
  };
  return client as unknown as SupabaseClient<Database>;
}

describe("createRelationship", () => {
  it("creates and returns a new relationship", async () => {
    const client = makeCreateClient({ data: sampleRelationship, error: null });
    const result = await createRelationship(client, validInput);
    expect(result).toEqual(sampleRelationship);
  });

  it("rejects self-relationships before calling Supabase", async () => {
    const client = makeCreateClient({ data: null, error: null });
    const selfInput = {
      ...validInput,
      related_character_id: UUID_A,
    };
    await expect(createRelationship(client, selfInput)).rejects.toThrow(
      "a character cannot have a relationship with itself",
    );
    expect(client.from).not.toHaveBeenCalled();
  });

  it("throws when auth errors", async () => {
    const client = makeCreateClient({ data: null, error: null });
    (client.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { user: null },
      error: { message: "auth error" },
    });
    await expect(createRelationship(client, validInput)).rejects.toThrow(
      "CharacterRelationshipService.createRelationship.getUser: auth error",
    );
  });

  it("throws when user is null despite no auth error", async () => {
    const client = makeCreateClient({ data: null, error: null });
    (client.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });
    await expect(createRelationship(client, validInput)).rejects.toThrow(
      "CharacterRelationshipService.createRelationship: no authenticated user",
    );
  });

  it("throws a descriptive error on duplicate relationship (23505)", async () => {
    const client = makeCreateClient({
      data: null,
      error: { code: "23505", message: "unique violation" },
    });
    await expect(createRelationship(client, validInput)).rejects.toThrow(
      "a friendship relationship between these characters already exists",
    );
  });

  it("throws a descriptive error on CHECK violation (23514)", async () => {
    const client = makeCreateClient({
      data: null,
      error: { code: "23514", message: "check violation" },
    });
    await expect(createRelationship(client, validInput)).rejects.toThrow(
      "a character cannot have a relationship with itself",
    );
  });

  it("rethrows other insert errors", async () => {
    const client = makeCreateClient({
      data: null,
      error: { code: "42P01", message: "relation not found" },
    });
    await expect(createRelationship(client, validInput)).rejects.toThrow(
      "CharacterRelationshipService.createRelationship: relation not found",
    );
  });

  it("rejects invalid relationship_type at schema parse", async () => {
    const client = makeCreateClient({ data: null, error: null });
    await expect(
      createRelationship(client, {
        ...validInput,
        // @ts-expect-error intentionally invalid type
        relationship_type: "ally",
      }),
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// updateRelationship
// ---------------------------------------------------------------------------

describe("updateRelationship", () => {
  it("returns the updated relationship", async () => {
    const client = makeClient({
      fromResult: { data: sampleRelationship, error: null },
    });
    const result = await updateRelationship(client, "rel-1", {
      description: "best friends",
    });
    expect(result).toEqual(sampleRelationship);
  });

  it("throws on update error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "db error" } },
    });
    await expect(
      updateRelationship(client, "rel-1", { description: "updated" }),
    ).rejects.toThrow(
      "CharacterRelationshipService.updateRelationship: db error",
    );
  });

  it("rejects invalid relationship_type in update", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    await expect(
      updateRelationship(client, "rel-1", {
        // @ts-expect-error intentionally invalid
        relationship_type: "acquaintance",
      }),
    ).rejects.toThrow();
  });

  it("does not accept character_id in the update payload (type-only check)", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    // @ts-expect-error character_id is excluded from UpdateRelationshipInput.
    // If this type-expect-error stops being needed, UpdateRelationshipInput has
    // been widened and the guard has been removed — that should be a deliberate
    // decision, not an accident.
    await updateRelationship(client, "rel-1", { character_id: UUID_A });
    expect(true).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// deleteRelationship
// ---------------------------------------------------------------------------

describe("deleteRelationship", () => {
  it("resolves without error on success", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    await expect(deleteRelationship(client, "rel-1")).resolves.toBeUndefined();
  });

  it("throws on delete error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "not found" } },
    });
    await expect(deleteRelationship(client, "rel-1")).rejects.toThrow(
      "CharacterRelationshipService.deleteRelationship: not found",
    );
  });
});

// ---------------------------------------------------------------------------
// getSharedEvents
// ---------------------------------------------------------------------------

describe("getSharedEvents", () => {
  it("returns events shared by both characters", async () => {
    const client = makeClient({
      rpcResult: { data: [sampleEvent], error: null },
    });
    const result = await getSharedEvents(client, UUID_A, UUID_B);
    expect(result).toEqual([sampleEvent]);
  });

  it("calls events_shared_by_characters RPC with both character IDs as array", async () => {
    const client = makeClient({ rpcResult: { data: [], error: null } });
    await getSharedEvents(client, UUID_A, UUID_B);
    expect(client.rpc).toHaveBeenCalledWith("events_shared_by_characters", {
      p_character_ids: [UUID_A, UUID_B],
    });
  });

  it("returns empty array when no shared events", async () => {
    const client = makeClient({ rpcResult: { data: null, error: null } });
    const result = await getSharedEvents(client, UUID_A, UUID_B);
    expect(result).toEqual([]);
  });

  it("throws on RPC error", async () => {
    const client = makeClient({
      rpcResult: { data: null, error: { message: "rpc error" } },
    });
    await expect(getSharedEvents(client, UUID_A, UUID_B)).rejects.toThrow(
      "CharacterRelationshipService.getSharedEvents: rpc error",
    );
  });
});

// ---------------------------------------------------------------------------
// getCharacterNetwork
// ---------------------------------------------------------------------------

describe("getCharacterNetwork", () => {
  it("returns network nodes", async () => {
    const client = makeClient({
      rpcResult: { data: [sampleNetworkNode], error: null },
    });
    const result = await getCharacterNetwork(client, "char-1");
    expect(result).toEqual([sampleNetworkNode]);
  });

  it("omits p_depth when depth is not provided (uses DB default)", async () => {
    const client = makeClient({ rpcResult: { data: [], error: null } });
    await getCharacterNetwork(client, "char-1");
    expect(client.rpc).toHaveBeenCalledWith("character_network", {
      p_character_id: "char-1",
    });
  });

  it("passes explicit depth to the RPC", async () => {
    const client = makeClient({ rpcResult: { data: [], error: null } });
    await getCharacterNetwork(client, "char-1", 4);
    expect(client.rpc).toHaveBeenCalledWith("character_network", {
      p_character_id: "char-1",
      p_depth: 4,
    });
  });

  it("clamps depth above MAX_NETWORK_DEPTH (5) to 5", async () => {
    const client = makeClient({ rpcResult: { data: [], error: null } });
    await getCharacterNetwork(client, "char-1", 10);
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

  it("returns empty array when no network nodes", async () => {
    const client = makeClient({ rpcResult: { data: null, error: null } });
    const result = await getCharacterNetwork(client, "char-1");
    expect(result).toEqual([]);
  });

  it("throws on RPC error", async () => {
    const client = makeClient({
      rpcResult: { data: null, error: { message: "rpc error" } },
    });
    await expect(getCharacterNetwork(client, "char-1")).rejects.toThrow(
      "CharacterRelationshipService.getCharacterNetwork: rpc error",
    );
  });
});

// ---------------------------------------------------------------------------
// getMutualRelationships
// ---------------------------------------------------------------------------

describe("getMutualRelationships", () => {
  it("returns direct relationships between two characters", async () => {
    const client = makeClient({
      fromResult: { data: [sampleRelationship], error: null },
    });
    const result = await getMutualRelationships(client, UUID_A, UUID_B);
    expect(result).toEqual([sampleRelationship]);
  });

  it("queries with compound OR covering both directions", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getMutualRelationships(client, UUID_A, UUID_B);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.or).toHaveBeenCalledWith(
      `and(character_id.eq.${UUID_A},related_character_id.eq.${UUID_B}),and(character_id.eq.${UUID_B},related_character_id.eq.${UUID_A})`,
    );
  });

  it("throws when char1Id is not a valid UUID", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await expect(
      getMutualRelationships(client, "not-a-uuid", UUID_B),
    ).rejects.toThrow(
      "CharacterRelationshipService: char1Id is not a valid UUID",
    );
  });

  it("throws when char2Id is not a valid UUID", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await expect(
      getMutualRelationships(client, UUID_A, "not-a-uuid"),
    ).rejects.toThrow(
      "CharacterRelationshipService: char2Id is not a valid UUID",
    );
  });

  it("returns empty array when no mutual relationships", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    const result = await getMutualRelationships(client, UUID_A, UUID_B);
    expect(result).toEqual([]);
  });

  it("throws on query error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "db error" } },
    });
    await expect(
      getMutualRelationships(client, UUID_A, UUID_B),
    ).rejects.toThrow(
      "CharacterRelationshipService.getMutualRelationships: db error",
    );
  });
});
