/**
 * tests/validate.test.js
 * Vitest suite for src/core/validate.js
 */

import { describe, it, expect } from "vitest";
import { validateBuilding } from "../src/core/validate.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sampleBuilding = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../public/sample/building.json"), "utf-8")
);

describe("validate.js - Building Graph Schema Validator", () => {
  // Test 1: Valid sample passes
  it("Valid sample building passes validation", () => {
    const res = validateBuilding(sampleBuilding);
    expect(res.ok).toBe(true);
    expect(res.data).toBeDefined();
  });

  // Test 2: Invalid JSON string
  it("Rejects malformed JSON string", () => {
    const res = validateBuilding("{ broken json");
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.code === "INVALID_JSON")).toBe(true);
  });

  // Test 3: Missing root fields
  it("Rejects missing building name or missing arrays", () => {
    const invalid = { nodes: [], edges: [] };
    const res = validateBuilding(invalid);
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.code === "INVALID_BUILDING_NAME")).toBe(true);
    expect(res.errors.some((e) => e.code === "MISSING_INITIAL_STATE")).toBe(true);
  });

  // Test 4: Too few nodes (< 2)
  it("Rejects node count < 2", () => {
    const invalid = JSON.parse(JSON.stringify(sampleBuilding));
    invalid.nodes = [invalid.nodes[0]];
    const res = validateBuilding(invalid);
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.code === "NODE_COUNT_OUT_OF_RANGE")).toBe(true);
  });

  // Test 5: Too many nodes (> 60)
  it("Rejects node count > 60", () => {
    const invalid = JSON.parse(JSON.stringify(sampleBuilding));
    for (let i = 9; i <= 65; i++) {
      invalid.nodes.push({ id: `EXTRA_${i}`, label: `Extra ${i}`, type: "room", x: i, y: i });
    }
    const res = validateBuilding(invalid);
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.code === "NODE_COUNT_OUT_OF_RANGE")).toBe(true);
  });

  // Test 6: Duplicate Node ID
  it("Rejects duplicate node IDs", () => {
    const invalid = JSON.parse(JSON.stringify(sampleBuilding));
    invalid.nodes.push({ id: "R1", label: "Duplicate R1", type: "room", x: 100, y: 100 });
    const res = validateBuilding(invalid);
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.code === "DUPLICATE_NODE_ID")).toBe(true);
  });

  // Test 7: No room/junction or no exit
  it("Rejects graph with no exits or no rooms/junctions", () => {
    const noExits = JSON.parse(JSON.stringify(sampleBuilding));
    noExits.nodes = noExits.nodes.filter((n) => n.type !== "exit");
    noExits.edges = [noExits.edges[0]];
    const res1 = validateBuilding(noExits);
    expect(res1.ok).toBe(false);
    expect(res1.errors.some((e) => e.code === "NO_EXIT_NODE")).toBe(true);

    const noRooms = {
      building: "Only Exits Complex",
      nodes: [
        { id: "E1", label: "Exit 1", type: "exit", x: 0, y: 0 },
        { id: "E2", label: "Exit 2", type: "exit", x: 10, y: 10 }
      ],
      edges: [{ id: "e1", from: "E1", to: "E2", cost: 1 }],
      initial_state: { blocked_nodes: [], blocked_edges: [], closed_exits: [] }
    };
    const res2 = validateBuilding(noRooms);
    expect(res2.ok).toBe(false);
    expect(res2.errors.some((e) => e.code === "NO_ROOM_OR_JUNCTION")).toBe(true);
  });

  // Test 8: Self-loops
  it("Rejects edge with self-loop (from === to)", () => {
    const invalid = JSON.parse(JSON.stringify(sampleBuilding));
    invalid.edges.push({ id: "e_loop", from: "R1", to: "R1", cost: 1 });
    const res = validateBuilding(invalid);
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.code === "EDGE_SELF_LOOP")).toBe(true);
  });

  // Test 9: Duplicate pairs (A-B and B-A are the same pair)
  it("Rejects duplicate edge pairs regardless of orientation (A-B and B-A)", () => {
    const invalid = JSON.parse(JSON.stringify(sampleBuilding));
    // e1 is R1-C1. Adding C1-R1 should trigger duplicate pair error.
    invalid.edges.push({ id: "e_dup", from: "C1", to: "R1", cost: 3 });
    const res = validateBuilding(invalid);
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.code === "EDGE_DUPLICATE_PAIR")).toBe(true);
  });

  // Test 10: Zero, negative, or non-integer costs
  it("Rejects zero, negative, or fractional edge costs", () => {
    const invalid = JSON.parse(JSON.stringify(sampleBuilding));
    invalid.edges[0].cost = 0;
    invalid.edges[1].cost = -4;
    invalid.edges[2].cost = 2.5;
    const res = validateBuilding(invalid);
    expect(res.ok).toBe(false);
    expect(res.errors.filter((e) => e.code === "EDGE_INVALID_COST").length).toBe(3);
  });

  // Test 11: Unknown endpoint
  it("Rejects edges referencing unknown nodes", () => {
    const invalid = JSON.parse(JSON.stringify(sampleBuilding));
    invalid.edges.push({ id: "e_phantom", from: "R1", to: "UNKNOWN_NODE", cost: 2 });
    const res = validateBuilding(invalid);
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.code === "EDGE_UNKNOWN_NODE")).toBe(true);
  });

  // Test 12: Exit in blocked_nodes
  it("Rejects exit IDs in initial_state.blocked_nodes", () => {
    const invalid = JSON.parse(JSON.stringify(sampleBuilding));
    invalid.initial_state.blocked_nodes = ["E1"];
    const res = validateBuilding(invalid);
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.code === "BLOCKED_NODE_IS_EXIT")).toBe(true);
  });

  // Test 13: Room/Junction in closed_exits
  it("Rejects non-exit IDs in initial_state.closed_exits", () => {
    const invalid = JSON.parse(JSON.stringify(sampleBuilding));
    invalid.initial_state.closed_exits = ["R1"];
    const res = validateBuilding(invalid);
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.code === "CLOSED_EXIT_NOT_EXIT")).toBe(true);
  });

  // Test 14: Disconnected graphs are VALID
  it("Allows disconnected graphs as valid", () => {
    const disconnected = {
      building: "Disconnected Facility",
      nodes: [
        { id: "R1", label: "Room 1", type: "room", x: 0, y: 0 },
        { id: "R2", label: "Room 2", type: "room", x: 10, y: 10 },
        { id: "E1", label: "Exit 1", type: "exit", x: 50, y: 50 }
      ],
      edges: [
        { id: "e1", from: "R1", to: "R2", cost: 2 } // E1 is disconnected
      ],
      initial_state: { blocked_nodes: [], blocked_edges: [], closed_exits: [] }
    };
    const res = validateBuilding(disconnected);
    expect(res.ok).toBe(true);
  });
});
