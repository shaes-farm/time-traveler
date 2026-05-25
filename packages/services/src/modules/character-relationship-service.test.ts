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
  computeReciprocalRow,
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
    is: vi.fn().mockReturnThis(),
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

  it("throws when fetch fails (id not found or DB error)", async () => {
    // The pre-update fetch runs before the actual update, so any DB error
    // (including "row not found") surfaces from the fetchCurrent step.
    const client = makeClient({
      fromResult: { data: null, error: { message: "db error" } },
    });
    await expect(
      updateRelationship(client, "rel-1", { description: "updated" }),
    ).rejects.toThrow(
      "CharacterRelationshipService.updateRelationship.fetchCurrent: db error",
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

  it("throws when fetch fails (id not found)", async () => {
    // The pre-delete fetch runs before the actual delete, so a missing id
    // surfaces as a fetchCurrent error rather than a delete error.
    const client = makeClient({
      fromResult: { data: null, error: { message: "not found" } },
    });
    await expect(deleteRelationship(client, "rel-1")).rejects.toThrow(
      "CharacterRelationshipService.deleteRelationship.fetchCurrent: not found",
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

// ---------------------------------------------------------------------------
// computeReciprocalRow (#119)
// ---------------------------------------------------------------------------

describe("computeReciprocalRow", () => {
  const base = {
    user_id: "user-123",
    character_id: UUID_A,
    related_character_id: UUID_B,
    start_temporal: null,
    end_temporal: null,
    metadata: null,
  };

  it("inverts paired family sub-role (parent → child)", () => {
    const recip = computeReciprocalRow({
      ...base,
      relationship_type: "family",
      relationship_role: "parent",
    });
    expect(recip).not.toBeNull();
    expect(recip).toMatchObject({
      character_id: UUID_B,
      related_character_id: UUID_A,
      relationship_type: "family",
      relationship_role: "child",
    });
  });

  it("keeps symmetric family sub-role unchanged (spouse → spouse)", () => {
    const recip = computeReciprocalRow({
      ...base,
      relationship_type: "family",
      relationship_role: "spouse",
    });
    expect(recip).toMatchObject({
      character_id: UUID_B,
      related_character_id: UUID_A,
      relationship_type: "family",
      relationship_role: "spouse",
    });
  });

  it("inverts professional pair (employer → employee)", () => {
    const recip = computeReciprocalRow({
      ...base,
      relationship_type: "professional",
      relationship_role: "employer",
    });
    expect(recip?.relationship_role).toBe("employee");
  });

  it("keeps collaboration sub-role symmetric (co_author → co_author)", () => {
    const recip = computeReciprocalRow({
      ...base,
      relationship_type: "collaboration",
      relationship_role: "co_author",
    });
    expect(recip?.relationship_role).toBe("co_author");
  });

  it("returns swapped row with null role for friendship", () => {
    const recip = computeReciprocalRow({
      ...base,
      relationship_type: "friendship",
      relationship_role: null,
    });
    expect(recip).toMatchObject({
      character_id: UUID_B,
      related_character_id: UUID_A,
      relationship_type: "friendship",
      relationship_role: null,
    });
  });

  it("returns null for mentor_student (asymmetric type, no reciprocal)", () => {
    const recip = computeReciprocalRow({
      ...base,
      relationship_type: "mentor_student",
      relationship_role: null,
    });
    expect(recip).toBeNull();
  });

  it.each(["owner_pet", "trainer_trainee", "creator_creation", "worship"])(
    "returns null for asymmetric type %s",
    (type) => {
      const recip = computeReciprocalRow({
        ...base,
        relationship_type: type,
        relationship_role: null,
      });
      expect(recip).toBeNull();
    },
  );

  it("returns null defensively for a self-relationship", () => {
    const recip = computeReciprocalRow({
      ...base,
      related_character_id: UUID_A,
      relationship_type: "friendship",
      relationship_role: null,
    });
    expect(recip).toBeNull();
  });

  it("does not carry description to the reciprocal (per Batch 2 Q1)", () => {
    const recip = computeReciprocalRow({
      ...base,
      relationship_type: "family",
      relationship_role: "spouse",
    });
    expect(recip).not.toHaveProperty("description");
  });
});

// ---------------------------------------------------------------------------
// createRelationship — reciprocal-edge insertion (#119)
// ---------------------------------------------------------------------------

describe("createRelationship reciprocal-edge insertion", () => {
  function makeCreateClientWithBuilder(insertResult: {
    data: unknown;
    error: unknown;
  }) {
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
    return { client: client as unknown as SupabaseClient<Database>, builder };
  }

  it("inserts twice for family/parent: primary then reciprocal with inverted role", async () => {
    const primaryRow = {
      ...sampleRelationship,
      relationship_type: "family",
      relationship_role: "parent",
    };
    const { client, builder } = makeCreateClientWithBuilder({
      data: primaryRow,
      error: null,
    });

    await createRelationship(client, {
      character_id: UUID_A,
      related_character_id: UUID_B,
      relationship_type: "family",
      relationship_role: "parent",
    });

    expect(builder.insert).toHaveBeenCalledTimes(2);
    expect(builder.insert.mock.calls[1]?.[0]).toMatchObject({
      character_id: UUID_B,
      related_character_id: UUID_A,
      relationship_type: "family",
      relationship_role: "child",
    });
  });

  it("inserts twice for friendship (symmetric type, no role)", async () => {
    const primaryRow = {
      ...sampleRelationship,
      relationship_type: "friendship",
      relationship_role: null,
    };
    const { client, builder } = makeCreateClientWithBuilder({
      data: primaryRow,
      error: null,
    });

    await createRelationship(client, {
      character_id: UUID_A,
      related_character_id: UUID_B,
      relationship_type: "friendship",
    });

    expect(builder.insert).toHaveBeenCalledTimes(2);
    expect(builder.insert.mock.calls[1]?.[0]).toMatchObject({
      character_id: UUID_B,
      related_character_id: UUID_A,
      relationship_type: "friendship",
      relationship_role: null,
    });
  });

  it("inserts once for mentor_student (asymmetric type, no reciprocal)", async () => {
    const primaryRow = {
      ...sampleRelationship,
      relationship_type: "mentor_student",
      relationship_role: null,
    };
    const { client, builder } = makeCreateClientWithBuilder({
      data: primaryRow,
      error: null,
    });

    await createRelationship(client, {
      character_id: UUID_A,
      related_character_id: UUID_B,
      relationship_type: "mentor_student",
    });

    expect(builder.insert).toHaveBeenCalledTimes(1);
  });

  it("does not carry description to the reciprocal", async () => {
    const primaryRow = {
      ...sampleRelationship,
      relationship_type: "family",
      relationship_role: "spouse",
      description: "Married 1895",
    };
    const { client, builder } = makeCreateClientWithBuilder({
      data: primaryRow,
      error: null,
    });

    await createRelationship(client, {
      character_id: UUID_A,
      related_character_id: UUID_B,
      relationship_type: "family",
      relationship_role: "spouse",
      description: "Married 1895",
    });

    const reciprocalArg = builder.insert.mock.calls[1]?.[0] as Record<
      string,
      unknown
    >;
    expect(reciprocalArg.description).toBeUndefined();
  });

  it("rejects family with a professional sub-role at Zod parse", async () => {
    const { client } = makeCreateClientWithBuilder({
      data: null,
      error: null,
    });
    await expect(
      createRelationship(client, {
        character_id: UUID_A,
        related_character_id: UUID_B,
        relationship_type: "family",
        // relationship_role is typed as `string | null | undefined`, so the
        // (family, employer) combination is only rejected at Zod parse time.
        relationship_role: "employer",
      }),
    ).rejects.toThrow(/not a valid family sub-role/);
  });

  it("rejects friendship with a non-null role at Zod parse", async () => {
    const { client } = makeCreateClientWithBuilder({
      data: null,
      error: null,
    });
    await expect(
      createRelationship(client, {
        character_id: UUID_A,
        related_character_id: UUID_B,
        relationship_type: "friendship",
        // friendship/spouse passes TypeScript but Zod rejects it.
        relationship_role: "spouse",
      }),
    ).rejects.toThrow(/must be null/);
  });

  it("swallows 23505 on reciprocal insert (reciprocal already exists)", async () => {
    // First insert succeeds (primary). Second call returns 23505 (reciprocal
    // already exists from a prior partial-failure retry). Should NOT throw.
    const insertBuilder = {
      select: vi.fn().mockReturnThis(),
      single: vi
        .fn()
        .mockResolvedValueOnce({
          data: {
            ...sampleRelationship,
            relationship_type: "family",
            relationship_role: "spouse",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { code: "23505", message: "duplicate" },
        }),
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
    } as unknown as SupabaseClient<Database>;

    await expect(
      createRelationship(client, {
        character_id: UUID_A,
        related_character_id: UUID_B,
        relationship_type: "family",
        relationship_role: "spouse",
      }),
    ).resolves.toBeDefined();
  });

  it("surfaces non-23505 reciprocal failures with a clear partial-failure message", async () => {
    const insertBuilder = {
      select: vi.fn().mockReturnThis(),
      single: vi
        .fn()
        .mockResolvedValueOnce({
          data: {
            ...sampleRelationship,
            id: "primary-id",
            relationship_type: "family",
            relationship_role: "spouse",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { code: "42P01", message: "relation not found" },
        }),
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
    } as unknown as SupabaseClient<Database>;

    await expect(
      createRelationship(client, {
        character_id: UUID_A,
        related_character_id: UUID_B,
        relationship_type: "family",
        relationship_role: "spouse",
      }),
    ).rejects.toThrow(
      /primary saved \(id=primary-id\); reciprocal insert failed/,
    );
  });
});

// ---------------------------------------------------------------------------
// updateRelationship — reciprocal sync (#119)
// ---------------------------------------------------------------------------

describe("updateRelationship reciprocal sync", () => {
  it("does not sync description to the reciprocal (Batch 2 Q1)", async () => {
    // The fetch returns a current row with a sub-role; we update description.
    // Verify the second .update() call (for the reciprocal) is never made,
    // because syncFields ends up empty (description is excluded).
    const familyParentRow = {
      ...sampleRelationship,
      relationship_type: "family",
      relationship_role: "parent",
    };
    const builder = {
      ...makeBuilder({ data: familyParentRow, error: null }),
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
    } as unknown as SupabaseClient<Database>;

    await updateRelationship(client, "rel-1", {
      description: "Updated narrative just for Marie's perspective",
    });

    // .update() is only called for the primary; reciprocal sync is skipped
    // because the partial update contained only `description`.
    expect(builder.update).toHaveBeenCalledTimes(1);
  });

  it("syncs date changes to the reciprocal with inverted role", async () => {
    const familyParentRow = {
      ...sampleRelationship,
      relationship_type: "family",
      relationship_role: "parent",
    };
    const builder = {
      ...makeBuilder({ data: familyParentRow, error: null }),
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
    } as unknown as SupabaseClient<Database>;

    await updateRelationship(client, "rel-1", {
      start_temporal: { era: "CE", year: 1900, precision: "exact" },
    });

    // First .update() is the primary; second is the reciprocal sync.
    expect(builder.update).toHaveBeenCalledTimes(2);
    const reciprocalSyncFields = builder.update.mock.calls[1]?.[0] as Record<
      string,
      unknown
    >;
    expect(reciprocalSyncFields).toEqual({
      start_temporal: { era: "CE", year: 1900, precision: "exact" },
    });
    // The reciprocal lookup filters by INVERTED role (child).
    expect(builder.eq).toHaveBeenCalledWith("relationship_role", "child");
  });

  it("skips reciprocal sync for asymmetric types", async () => {
    const mentorRow = {
      ...sampleRelationship,
      relationship_type: "mentor_student",
      relationship_role: null,
    };
    const builder = {
      ...makeBuilder({ data: mentorRow, error: null }),
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
    } as unknown as SupabaseClient<Database>;

    await updateRelationship(client, "rel-1", {
      start_temporal: { era: "CE", year: 1900, precision: "exact" },
    });

    expect(builder.update).toHaveBeenCalledTimes(1);
  });

  it("rejects updates that would produce an invalid (type, role) combination", async () => {
    // Current row is (family, parent). User tries to switch the type to
    // professional without updating the role. The base schema's .partial()
    // doesn't run the cross-field superRefine, so without explicit
    // cross-validation this would slip past Zod and surface as an opaque
    // 23514 from the DB. Verify the descriptive error fires before any
    // primary update is attempted.
    const familyParentRow = {
      ...sampleRelationship,
      relationship_type: "family",
      relationship_role: "parent",
    };
    const builder = {
      ...makeBuilder({ data: familyParentRow, error: null }),
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
    } as unknown as SupabaseClient<Database>;

    await expect(
      updateRelationship(client, "rel-1", {
        relationship_type: "professional",
      }),
    ).rejects.toThrow(/not a valid professional sub-role/);

    // No primary update should have been attempted.
    expect(builder.update).not.toHaveBeenCalled();
  });

  it("accepts clearing role on a sub-roled type", async () => {
    // (family, parent) → (family, null) is valid; legacy NULL-role compat.
    const familyParentRow = {
      ...sampleRelationship,
      relationship_type: "family",
      relationship_role: "parent",
    };
    const builder = {
      ...makeBuilder({ data: familyParentRow, error: null }),
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
    } as unknown as SupabaseClient<Database>;

    await expect(
      updateRelationship(client, "rel-1", {
        relationship_role: null,
      }),
    ).resolves.toBeDefined();
  });

  it("treats explicit relationship_role:undefined as no-op, not as clear-to-null", async () => {
    // If the caller spreads a partial object that ends up with an explicit
    // `undefined`, PostgREST drops it on the primary update (column
    // unchanged). The reciprocal sync must match — it must NOT clear the
    // reciprocal's role. This guards against a primary/reciprocal mismatch.
    const familyParentRow = {
      ...sampleRelationship,
      relationship_type: "family",
      relationship_role: "parent",
    };
    const builder = {
      ...makeBuilder({ data: familyParentRow, error: null }),
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
    } as unknown as SupabaseClient<Database>;

    await updateRelationship(client, "rel-1", {
      relationship_role: undefined,
      start_temporal: { era: "CE", year: 1900, precision: "exact" },
    });

    expect(builder.update).toHaveBeenCalledTimes(2);
    const reciprocalSyncFields = builder.update.mock.calls[1]?.[0] as Record<
      string,
      unknown
    >;
    // Only the explicitly-set field is synced; relationship_role is absent.
    expect(reciprocalSyncFields).toEqual({
      start_temporal: { era: "CE", year: 1900, precision: "exact" },
    });
    expect(reciprocalSyncFields).not.toHaveProperty("relationship_role");
  });

  it("transitions sym → asym: deletes the orphan reciprocal (case 2)", async () => {
    // Current: family/spouse (reciprocal-producing). User changes type to
    // mentor_student and clears role. The existing reciprocal at (b, a,
    // family, spouse) is now an orphan and must be deleted.
    const familySpouseRow = {
      ...sampleRelationship,
      relationship_type: "family",
      relationship_role: "spouse",
    };
    const builder = {
      ...makeBuilder({ data: familySpouseRow, error: null }),
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
    } as unknown as SupabaseClient<Database>;

    await updateRelationship(client, "rel-1", {
      relationship_type: "mentor_student",
      relationship_role: null,
    });

    // Primary update fires once; orphan reciprocal cleanup fires once.
    // No additional sync update is issued.
    expect(builder.update).toHaveBeenCalledTimes(1);
    expect(builder.delete).toHaveBeenCalledTimes(1);
  });

  it("transitions asym → sym: creates a new reciprocal (case 3)", async () => {
    // Current: mentor_student (asymmetric, no reciprocal). User changes
    // type to friendship. A new reciprocal at (b, a, friendship, null)
    // must be created to avoid leaving the relationship half-bidirectional.
    const mentorRow = {
      ...sampleRelationship,
      relationship_type: "mentor_student",
      relationship_role: null,
    };
    const builder = {
      ...makeBuilder({ data: mentorRow, error: null }),
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
    } as unknown as SupabaseClient<Database>;

    await updateRelationship(client, "rel-1", {
      relationship_type: "friendship",
    });

    expect(builder.update).toHaveBeenCalledTimes(1);
    expect(builder.insert).toHaveBeenCalledTimes(1);
    const newReciprocal = builder.insert.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(newReciprocal).toMatchObject({
      character_id: UUID_B,
      related_character_id: UUID_A,
      relationship_type: "friendship",
      relationship_role: null,
    });
  });

  it("transitions asym → asym: no reciprocal action (case 4)", async () => {
    // mentor_student → owner_pet. Both asymmetric; no reciprocal in
    // either state. Only the primary update fires.
    const mentorRow = {
      ...sampleRelationship,
      relationship_type: "mentor_student",
      relationship_role: null,
    };
    const builder = {
      ...makeBuilder({ data: mentorRow, error: null }),
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
    } as unknown as SupabaseClient<Database>;

    await updateRelationship(client, "rel-1", {
      relationship_type: "owner_pet",
    });

    expect(builder.update).toHaveBeenCalledTimes(1);
    expect(builder.insert).not.toHaveBeenCalled();
    expect(builder.delete).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// deleteRelationship — reciprocal delete (#119)
// ---------------------------------------------------------------------------

describe("deleteRelationship reciprocal delete", () => {
  it("deletes both rows by default", async () => {
    const familyParentRow = {
      ...sampleRelationship,
      relationship_type: "family",
      relationship_role: "parent",
    };
    const builder = {
      ...makeBuilder({ data: familyParentRow, error: null }),
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
    } as unknown as SupabaseClient<Database>;

    await deleteRelationship(client, "rel-1");

    // Primary delete + reciprocal delete = 2 calls.
    expect(builder.delete).toHaveBeenCalledTimes(2);
  });

  it("with deleteReciprocal:false deletes only the primary", async () => {
    const familyParentRow = {
      ...sampleRelationship,
      relationship_type: "family",
      relationship_role: "parent",
    };
    const builder = {
      ...makeBuilder({ data: familyParentRow, error: null }),
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
    } as unknown as SupabaseClient<Database>;

    await deleteRelationship(client, "rel-1", { deleteReciprocal: false });

    expect(builder.delete).toHaveBeenCalledTimes(1);
  });

  it("attempts reciprocal delete unconditionally — self-healing for orphans, even on asymmetric types", async () => {
    // Previously deleteRelationship short-circuited on asymmetric types.
    // After the Copilot review feedback on update-path type transitions,
    // that early return was removed: the reciprocal lookup is always
    // attempted. For asymmetric types without orphans, the lookup runs
    // and matches zero rows (no-op); for any orphan reciprocal left by a
    // prior write, the lookup cleans it up. Either way the system stays
    // consistent.
    const mentorRow = {
      ...sampleRelationship,
      relationship_type: "mentor_student",
      relationship_role: null,
    };
    const builder = {
      ...makeBuilder({ data: mentorRow, error: null }),
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
    } as unknown as SupabaseClient<Database>;

    await deleteRelationship(client, "rel-1");

    // Primary delete + reciprocal lookup-and-delete = 2 calls.
    expect(builder.delete).toHaveBeenCalledTimes(2);
  });

  it("uses inverted role to find the reciprocal (parent → child)", async () => {
    const familyParentRow = {
      ...sampleRelationship,
      relationship_type: "family",
      relationship_role: "parent",
    };
    const builder = {
      ...makeBuilder({ data: familyParentRow, error: null }),
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
    } as unknown as SupabaseClient<Database>;

    await deleteRelationship(client, "rel-1");

    expect(builder.eq).toHaveBeenCalledWith("relationship_role", "child");
  });
});
