import { describe, it, expect } from "vitest";
import {
  collectSelfAndDescendantIds,
  orderedForPicker,
  type PeriodLite,
} from "./period-tree-utils";

// Mesozoic ⊃ {Triassic, Jurassic ⊃ EarlyJurassic}; plus a standalone root.
const periods: PeriodLite[] = [
  { id: "meso", title: "Mesozoic", parent_period_id: null },
  { id: "tri", title: "Triassic", parent_period_id: "meso" },
  { id: "jur", title: "Jurassic", parent_period_id: "meso" },
  { id: "ejur", title: "Early Jurassic", parent_period_id: "jur" },
  { id: "ind", title: "Industrial", parent_period_id: null },
];

describe("collectSelfAndDescendantIds", () => {
  it("returns self plus all transitive descendants", () => {
    expect(collectSelfAndDescendantIds(periods, "meso")).toEqual(
      new Set(["meso", "tri", "jur", "ejur"]),
    );
  });

  it("returns just self for a leaf", () => {
    expect(collectSelfAndDescendantIds(periods, "ejur")).toEqual(
      new Set(["ejur"]),
    );
  });

  it("does not loop on a pre-existing cycle", () => {
    const cyclic: PeriodLite[] = [
      { id: "a", title: "A", parent_period_id: "b" },
      { id: "b", title: "B", parent_period_id: "a" },
    ];
    expect(collectSelfAndDescendantIds(cyclic, "a")).toEqual(
      new Set(["a", "b"]),
    );
  });
});

describe("orderedForPicker", () => {
  it("orders depth-first with nesting depth annotations", () => {
    const ordered = orderedForPicker(periods).map((o) => [o.node.id, o.depth]);
    expect(ordered).toEqual([
      ["meso", 0],
      ["tri", 1],
      ["jur", 1],
      ["ejur", 2],
      ["ind", 0],
    ]);
  });

  it("treats a node whose parent is absent as a root", () => {
    const orphan: PeriodLite[] = [
      { id: "x", title: "X", parent_period_id: "missing" },
    ];
    expect(orderedForPicker(orphan)).toEqual([{ node: orphan[0], depth: 0 }]);
  });

  it("appends nodes trapped in a cycle rather than dropping them", () => {
    const cyclic: PeriodLite[] = [
      { id: "a", title: "A", parent_period_id: "b" },
      { id: "b", title: "B", parent_period_id: "a" },
    ];
    const ids = orderedForPicker(cyclic).map((o) => o.node.id);
    expect(ids.sort()).toEqual(["a", "b"]);
  });
});
