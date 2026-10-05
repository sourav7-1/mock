/**
 * tests/router.test.js
 * Vitest suite for src/core/router.js
 */

import { describe, it, expect } from "vitest";
import { findEvacuationRoute, previewRoute } from "../src/core/router.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sampleBuilding = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../public/sample/building.json"), "utf-8")
);

describe("router.js - Evacuation Routing Engine", () => {
  // Test 1: Sample Baseline (R1 -> E1)
  it("Select R1 from initial_state yields R1-C1-C2-E1 with cost 7", () => {
    const res = findEvacuationRoute(sampleBuilding, sampleBuilding.initial_state, "R1");
    expect(res.status).toBe("ok");
    expect(res.path).toEqual(["R1", "C1", "C2", "E1"]);
    expect(res.exit).toBe("E1");
    expect(res.cost).toBe(7);
    expect(res.edges).toEqual(["e1", "e2", "e3"]);
  });

  // Test 2: Sample Block C2 (R1 -> E2)
  it("Select R1 with C2 blocked yields R1-C1-C3-C4-E2 with cost 11", () => {
    const state = {
      blocked_nodes: ["C2"],
      blocked_edges: [],
      closed_exits: []
    };
    const res = findEvacuationRoute(sampleBuilding, state, "R1");
    expect(res.status).toBe("ok");
    expect(res.path).toEqual(["R1", "C1", "C3", "C4", "E2"]);
    expect(res.exit).toBe("E2");
    expect(res.cost).toBe(11);
  });

  // Test 3: Sample Close E1 and E2
  it("Select R1 with E1 and E2 closed yields no_route", () => {
    const state = {
      blocked_nodes: [],
      blocked_edges: [],
      closed_exits: ["E1", "E2"]
    };
    const res = findEvacuationRoute(sampleBuilding, state, "R1");
    expect(res.status).toBe("no_route");
  });

  // Test 4: Sample Select R2
  it("Select R2 from initial_state yields R2-C3-C4-E2 with cost 7", () => {
    const res = findEvacuationRoute(sampleBuilding, sampleBuilding.initial_state, "R2");
    expect(res.status).toBe("ok");
    expect(res.path).toEqual(["R2", "C3", "C4", "E2"]);
    expect(res.exit).toBe("E2");
    expect(res.cost).toBe(7);
  });

  // Test 5: Sample Select R1 and Block R1
  it("Select R1 with R1 blocked yields start_blocked", () => {
    const state = {
      blocked_nodes: ["R1"],
      blocked_edges: [],
      closed_exits: []
    };
    const res = findEvacuationRoute(sampleBuilding, state, "R1");
    expect(res.status).toBe("start_blocked");
  });

  // Test 6: Blocked edge e2 (C1-C2) rerouting
  it("Select R1 with corridor e2 blocked yields R1-C1-C3-C4-E2 with cost 11", () => {
    const state = {
      blocked_nodes: [],
      blocked_edges: ["e2"],
      closed_exits: []
    };
    const res = findEvacuationRoute(sampleBuilding, state, "R1");
    expect(res.status).toBe("ok");
    expect(res.path).toEqual(["R1", "C1", "C3", "C4", "E2"]);
    expect(res.cost).toBe(11);
  });

  // Test 7: Synthetic Equal-cost exits ("E10" vs "E2")
  it("Equal-cost exits tie-break: prefers 'E10' over 'E2' via plain JS string comparison", () => {
    const synthetic = {
      building: "Tie Break Test Facility",
      nodes: [
        { id: "R1", label: "Start", type: "room", x: 0, y: 0 },
        { id: "E2", label: "Exit 2", type: "exit", x: 10, y: 10 },
        { id: "E10", label: "Exit 10", type: "exit", x: -10, y: 10 }
      ],
      edges: [
        { id: "e1", from: "R1", to: "E2", cost: 5 },
        { id: "e2", from: "R1", to: "E10", cost: 5 }
      ],
      initial_state: { blocked_nodes: [], blocked_edges: [], closed_exits: [] }
    };
    const res = findEvacuationRoute(synthetic, synthetic.initial_state, "R1");
    expect(res.status).toBe("ok");
    expect(res.exit).toBe("E10");
    expect(res.path).toEqual(["R1", "E10"]);
  });

  // Test 8: Synthetic Equal-cost paths to same exit (lexicographic node sequence)
  it("Equal-cost paths to same exit: chooses lexicographically smaller node sequence", () => {
    const synthetic = {
      building: "Node Sequence Tie Break",
      nodes: [
        { id: "R1", label: "Start", type: "room", x: 0, y: 0 },
        { id: "C1", label: "Corridor A", type: "junction", x: 5, y: -5 },
        { id: "C2", label: "Corridor B", type: "junction", x: 5, y: 5 },
        { id: "E1", label: "Exit", type: "exit", x: 10, y: 0 }
      ],
      edges: [
        { id: "e1", from: "R1", to: "C2", cost: 2 },
        { id: "e2", from: "C2", to: "E1", cost: 2 },
        { id: "e3", from: "R1", to: "C1", cost: 2 },
        { id: "e4", from: "C1", to: "E1", cost: 2 }
      ],
      initial_state: { blocked_nodes: [], blocked_edges: [], closed_exits: [] }
    };
    const res = findEvacuationRoute(synthetic, synthetic.initial_state, "R1");
    expect(res.status).toBe("ok");
    // Both paths cost 4, but ["R1", "C1", "E1"] < ["R1", "C2", "E1"]
    expect(res.path).toEqual(["R1", "C1", "E1"]);
  });

  // Test 9: Disconnected components
  it("Disconnected components return no_route when no exit is reachable", () => {
    const synthetic = {
      building: "Disconnected Facility",
      nodes: [
        { id: "R1", label: "Room 1", type: "room", x: 0, y: 0 },
        { id: "R2", label: "Room 2", type: "room", x: 10, y: 0 },
        { id: "E1", label: "Exit 1", type: "exit", x: 50, y: 50 }
      ],
      edges: [
        { id: "e1", from: "R1", to: "R2", cost: 1 }
      ],
      initial_state: { blocked_nodes: [], blocked_edges: [], closed_exits: [] }
    };
    const res = findEvacuationRoute(synthetic, synthetic.initial_state, "R1");
    expect(res.status).toBe("no_route");
  });

  // Test 10: Closed exit avoided as intermediate node
  it("Closed exit is strictly avoided as an intermediate traversable passage", () => {
    const synthetic = {
      building: "Intermediate Closed Exit Facility",
      nodes: [
        { id: "R1", label: "Start", type: "room", x: 0, y: 0 },
        { id: "E1", label: "Exit Intermediate", type: "exit", x: 10, y: 0 },
        { id: "C1", label: "Alternate Junction", type: "junction", x: 0, y: 10 },
        { id: "E2", label: "Target Exit", type: "exit", x: 20, y: 0 }
      ],
      edges: [
        { id: "e1", from: "R1", to: "E1", cost: 1 },
        { id: "e2", from: "E1", to: "E2", cost: 1 }, // Shortest path through E1 has cost 2
        { id: "e3", from: "R1", to: "C1", cost: 5 },
        { id: "e4", from: "C1", to: "E2", cost: 5 } // Detour path has cost 10
      ],
      initial_state: { blocked_nodes: [], blocked_edges: [], closed_exits: ["E1"] }
    };
    const res = findEvacuationRoute(synthetic, synthetic.initial_state, "R1");
    expect(res.status).toBe("ok");
    expect(res.exit).toBe("E2");
    expect(res.path).toEqual(["R1", "C1", "E2"]);
    expect(res.cost).toBe(10);
  });

  // Test 11: Open exit traversed as intermediate node
  it("Open exit CAN be traversed as intermediate node if optimal", () => {
    const synthetic = {
      building: "Intermediate Open Exit Facility",
      nodes: [
        { id: "R1", label: "Start", type: "room", x: 0, y: 0 },
        { id: "E1", label: "Open Exit 1", type: "exit", x: 10, y: 0 },
        { id: "E2", label: "Target Exit", type: "exit", x: 20, y: 0 }
      ],
      edges: [
        { id: "e1", from: "R1", to: "E1", cost: 4 },
        { id: "e2", from: "E1", to: "E2", cost: 1 } // E2 is at total cost 5
      ],
      initial_state: { blocked_nodes: [], blocked_edges: [], closed_exits: [] }
    };
    // E1 is reached at cost 4, E2 at cost 5 -> picks E1 since cost 4 < 5
    const res = findEvacuationRoute(synthetic, synthetic.initial_state, "R1");
    expect(res.status).toBe("ok");
    expect(res.exit).toBe("E1");
    expect(res.cost).toBe(4);
  });

  // Test 12: previewRoute function
  it("previewRoute predicts rerouting when toggling a hazard without state mutation", () => {
    const originalState = {
      blocked_nodes: [],
      blocked_edges: [],
      closed_exits: []
    };
    const preview = previewRoute(sampleBuilding, originalState, "R1", { type: "node", id: "C2" });
    expect(preview.status).toBe("ok");
    expect(preview.path).toEqual(["R1", "C1", "C3", "C4", "E2"]);
    expect(preview.cost).toBe(11);

    // Verify original state unchanged
    expect(originalState.blocked_nodes).toEqual([]);
  });
});
