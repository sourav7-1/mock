/**
 * tests/tests.js
 * Test suite for router.js and validate.js in Smart Escape.
 */

import { findEvacuationRoute } from "../js/router.js";
import { validateBuilding } from "../js/validate.js";

// Sample building data representing sample/building.json
export const SAMPLE_BUILDING = {
  building: "Science Complex Level 1",
  nodes: [
    { id: "R1", label: "Room 101", type: "room", x: 120, y: 140 },
    { id: "R2", label: "Room 102", type: "room", x: 120, y: 360 },
    { id: "C1", label: "Corridor West", type: "junction", x: 280, y: 140 },
    { id: "C2", label: "Corridor East", type: "junction", x: 440, y: 140 },
    { id: "C3", label: "Hallway West", type: "junction", x: 280, y: 360 },
    { id: "C4", label: "Hallway East", type: "junction", x: 440, y: 360 },
    { id: "E1", label: "Exit North-East", type: "exit", x: 600, y: 140 },
    { id: "E2", label: "Exit South-East", type: "exit", x: 600, y: 360 }
  ],
  edges: [
    { id: "e1", from: "R1", to: "C1", cost: 2 },
    { id: "e2", from: "C1", to: "C2", cost: 2 },
    { id: "e3", from: "C2", to: "E1", cost: 3 },
    { id: "e4", from: "C1", to: "C3", cost: 4 },
    { id: "e5", from: "R2", to: "C3", cost: 2 },
    { id: "e6", from: "C3", to: "C4", cost: 2 },
    { id: "e7", from: "C4", to: "E2", cost: 3 }
  ],
  initial_state: {
    blocked_nodes: [],
    blocked_edges: [],
    closed_exits: []
  }
};

class TestRunner {
  constructor() {
    this.tests = [];
    this.results = [];
  }

  suite(suiteName) {
    this.currentSuite = suiteName;
  }

  test(name, fn) {
    this.tests.push({ suite: this.currentSuite || "General", name, fn });
  }

  async runAll() {
    this.results = [];
    for (const t of this.tests) {
      try {
        await t.fn();
        this.results.push({ ...t, passed: true });
      } catch (err) {
        this.results.push({ ...t, passed: false, error: err.message || String(err) });
      }
    }
    return this.results;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

function assertDeepEqual(actual, expected, message) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(`${message || "Values not equal"} (Expected: ${expectedStr}, got: ${actualStr})`);
  }
}

export function registerTests() {
  const runner = new TestRunner();

  // ==========================================
  // 1. SAMPLE GRAPH TESTS (from initial_state)
  // ==========================================
  runner.suite("1. Sample Graph Tests (sample/building.json)");

  runner.test("Select R1 -> R1-C1-C2-E1, cost 7", () => {
    const res = findEvacuationRoute(SAMPLE_BUILDING, "R1", {
      blocked_nodes: [],
      blocked_edges: [],
      closed_exits: []
    });
    assert(res.status === "ok", `Status must be ok, got ${res.status}`);
    assertDeepEqual(res.path, ["R1", "C1", "C2", "E1"], "Path mismatch");
    assert(res.exit === "E1", `Exit must be E1, got ${res.exit}`);
    assert(res.cost === 7, `Cost must be 7, got ${res.cost}`);
  });

  runner.test("Select R1, block C2 -> R1-C1-C3-C4-E2, cost 11", () => {
    const res = findEvacuationRoute(SAMPLE_BUILDING, "R1", {
      blocked_nodes: ["C2"],
      blocked_edges: [],
      closed_exits: []
    });
    assert(res.status === "ok", `Status must be ok, got ${res.status}`);
    assertDeepEqual(res.path, ["R1", "C1", "C3", "C4", "E2"], "Path mismatch when C2 blocked");
    assert(res.exit === "E2", `Exit must be E2, got ${res.exit}`);
    assert(res.cost === 11, `Cost must be 11, got ${res.cost}`);
  });

  runner.test("Select R1, close E1 and E2 -> No route available", () => {
    const res = findEvacuationRoute(SAMPLE_BUILDING, "R1", {
      blocked_nodes: [],
      blocked_edges: [],
      closed_exits: ["E1", "E2"]
    });
    assert(res.status === "no_route", `Status must be no_route, got ${res.status}`);
  });

  runner.test("Select R2 -> R2-C3-C4-E2, cost 7", () => {
    const res = findEvacuationRoute(SAMPLE_BUILDING, "R2", {
      blocked_nodes: [],
      blocked_edges: [],
      closed_exits: []
    });
    assert(res.status === "ok", `Status must be ok, got ${res.status}`);
    assertDeepEqual(res.path, ["R2", "C3", "C4", "E2"], "Path mismatch for R2");
    assert(res.exit === "E2", `Exit must be E2, got ${res.exit}`);
    assert(res.cost === 7, `Cost must be 7, got ${res.cost}`);
  });

  runner.test("Select R1, block R1 -> Starting location blocked", () => {
    const res = findEvacuationRoute(SAMPLE_BUILDING, "R1", {
      blocked_nodes: ["R1"],
      blocked_edges: [],
      closed_exits: []
    });
    assert(res.status === "start_blocked", `Status must be start_blocked, got ${res.status}`);
  });

  // ==========================================
  // 2. SYNTHETIC ROUTER TESTS
  // ==========================================
  runner.suite("2. Synthetic Router Tests");

  runner.test("Equal-cost exits: choose lexicographically smallest exit ID ('E10' < 'E2')", () => {
    // S connected to E10 (cost 5) and E2 (cost 5). Plain string comparison: 'E10' < 'E2'.
    const graph = {
      nodes: [
        { id: "S", label: "Start", type: "room", x: 0, y: 0 },
        { id: "E2", label: "Exit 2", type: "exit", x: 100, y: 0 },
        { id: "E10", label: "Exit 10", type: "exit", x: 100, y: 100 }
      ],
      edges: [
        { id: "e1", from: "S", to: "E2", cost: 5 },
        { id: "e2", from: "S", to: "E10", cost: 5 }
      ]
    };
    const res = findEvacuationRoute(graph, "S", {});
    assert(res.status === "ok", "Should find route");
    assert(res.exit === "E10", `Expected 'E10' due to JS string comparison 'E10' < 'E2', got '${res.exit}'`);
    assertDeepEqual(res.path, ["S", "E10"], "Expected path through E10");
  });

  runner.test("Equal-cost paths to same exit: choose lexicographically smallest sequence of node IDs", () => {
    // S -> A -> E (cost 1 + 2 = 3)
    // S -> B -> E (cost 1 + 2 = 3)
    // Node sequence ['S', 'A', 'E'] is lexicographically smaller than ['S', 'B', 'E']
    const graph = {
      nodes: [
        { id: "S", label: "Start", type: "room", x: 0, y: 0 },
        { id: "B", label: "B", type: "junction", x: 50, y: -50 },
        { id: "A", label: "A", type: "junction", x: 50, y: 50 },
        { id: "E", label: "Exit", type: "exit", x: 100, y: 0 }
      ],
      edges: [
        { id: "e1", from: "S", to: "B", cost: 1 },
        { id: "e2", from: "B", to: "E", cost: 2 },
        { id: "e3", from: "S", to: "A", cost: 1 },
        { id: "e4", from: "A", to: "E", cost: 2 }
      ]
    };
    const res = findEvacuationRoute(graph, "S", {});
    assert(res.status === "ok", "Should find route");
    assertDeepEqual(res.path, ["S", "A", "E"], `Expected ['S', 'A', 'E'], got ${JSON.stringify(res.path)}`);
  });

  runner.test("Disconnected components: unreachable exit returns no_route", () => {
    const graph = {
      nodes: [
        { id: "S", label: "Start Room", type: "room", x: 0, y: 0 },
        { id: "J1", label: "Junction 1", type: "junction", x: 50, y: 0 },
        { id: "R2", label: "Other Room", type: "room", x: 150, y: 0 },
        { id: "E1", label: "Exit", type: "exit", x: 200, y: 0 }
      ],
      edges: [
        { id: "e1", from: "S", to: "J1", cost: 2 },
        { id: "e2", from: "R2", to: "E1", cost: 3 }
      ]
    };
    const res = findEvacuationRoute(graph, "S", {});
    assert(res.status === "no_route", `Expected no_route for disconnected exit, got ${res.status}`);
  });

  runner.test("Blocked edge vs blocked node difference", () => {
    // S - (e1) - J1 - (e2) - E
    // S - (e3) - J2 - (e4) - E
    // J1 also connects to J2 via e5
    const graph = {
      nodes: [
        { id: "S", label: "Start", type: "room", x: 0, y: 0 },
        { id: "J1", label: "J1", type: "junction", x: 50, y: 0 },
        { id: "J2", label: "J2", type: "junction", x: 50, y: 50 },
        { id: "E", label: "Exit", type: "exit", x: 100, y: 0 }
      ],
      edges: [
        { id: "e1", from: "S", to: "J1", cost: 2 },
        { id: "e2", from: "J1", to: "E", cost: 2 },
        { id: "e3", from: "S", to: "J2", cost: 3 },
        { id: "e4", from: "J2", to: "E", cost: 3 },
        { id: "e5", from: "J1", to: "J2", cost: 1 }
      ]
    };

    // If edge e1 is blocked, path goes S -> J2 -> J1 -> E (cost 3 + 1 + 2 = 6) or S -> J2 -> E (cost 6)
    const resEdgeBlocked = findEvacuationRoute(graph, "S", { blocked_edges: ["e1"] });
    assert(resEdgeBlocked.status === "ok", "Should route around blocked edge");
    assert(!resEdgeBlocked.path.slice(0, 2).includes("J1"), "Path cannot use blocked edge e1 directly from S");

    // If node J1 is blocked, J1 and all incident edges are excluded
    const resNodeBlocked = findEvacuationRoute(graph, "S", { blocked_nodes: ["J1"] });
    assert(resNodeBlocked.status === "ok", "Should route around blocked node");
    assert(!resNodeBlocked.path.includes("J1"), "J1 cannot be anywhere in route");
    assertDeepEqual(resNodeBlocked.path, ["S", "J2", "E"], "Expected path via J2 only");
  });

  runner.test("Closed exit used as intermediate node is strictly avoided", () => {
    // Path 1: S -> E_mid -> E_final (cost 1 + 1 = 2)
    // Path 2: S -> J1 -> E_final (cost 10)
    const graph = {
      nodes: [
        { id: "S", label: "Start", type: "room", x: 0, y: 0 },
        { id: "E_mid", label: "Intermediate Exit", type: "exit", x: 50, y: 0 },
        { id: "E_final", label: "Target Exit", type: "exit", x: 100, y: 0 },
        { id: "J1", label: "Junction", type: "junction", x: 50, y: 50 }
      ],
      edges: [
        { id: "e1", from: "S", to: "E_mid", cost: 1 },
        { id: "e2", from: "E_mid", to: "E_final", cost: 1 },
        { id: "e3", from: "S", to: "J1", cost: 5 },
        { id: "e4", from: "J1", to: "E_final", cost: 5 }
      ]
    };

    // If E_mid is closed, it cannot be destination OR intermediate node
    const res = findEvacuationRoute(graph, "S", { closed_exits: ["E_mid"] });
    assert(res.status === "ok", "Should find route via J1");
    assert(res.exit === "E_final", "Destination must be E_final");
    assert(!res.path.includes("E_mid"), "Closed exit must not appear in path");
    assertDeepEqual(res.path, ["S", "J1", "E_final"], "Should route through J1");
    assert(res.cost === 10, "Cost should be 10");
  });

  // ==========================================
  // 3. VALIDATION TESTS (validate.js)
  // ==========================================
  runner.suite("3. Validation Tests (validate.js)");

  runner.test("Valid building JSON passes validation", () => {
    const res = validateBuilding(SAMPLE_BUILDING);
    assert(res.valid === true, `Expected valid, got errors: ${res.errors.join("; ")}`);
    assert(res.errors.length === 0, "Errors should be empty");
  });

  runner.test("Invalid JSON syntax is rejected", () => {
    const res = validateBuilding("{ not valid json at all");
    assert(res.valid === false, "Must reject invalid JSON");
    assert(res.errors.length > 0, "Must return error message");
  });

  runner.test("Missing required root fields is rejected", () => {
    const res = validateBuilding({});
    assert(res.valid === false, "Empty root must fail");
    assert(res.errors.some((e) => e.includes("building")), "Must report missing building");
    assert(res.errors.some((e) => e.includes("nodes")), "Must report missing nodes");
    assert(res.errors.some((e) => e.includes("edges")), "Must report missing edges");
    assert(res.errors.some((e) => e.includes("initial_state")), "Must report missing initial_state");
  });

  runner.test("Self-loop edge (from === to) is rejected", () => {
    const testData = JSON.parse(JSON.stringify(SAMPLE_BUILDING));
    testData.edges.push({ id: "loop1", from: "R1", to: "R1", cost: 2 });
    const res = validateBuilding(testData);
    assert(res.valid === false, "Self-loop edge must fail");
    assert(res.errors.some((e) => e.includes("Self-loop") || e.includes("সেল্ফ-লুপ")), "Must report self-loop");
  });

  runner.test("Duplicate node pair (A-B and B-A) is rejected", () => {
    const testData = JSON.parse(JSON.stringify(SAMPLE_BUILDING));
    // e1 connects R1 and C1. Adding e_dup from C1 to R1:
    testData.edges.push({ id: "e_dup", from: "C1", to: "R1", cost: 3 });
    const res = validateBuilding(testData);
    assert(res.valid === false, "Duplicate edge pair must fail");
    assert(res.errors.some((e) => e.includes("Duplicate edge pair") || e.includes("পুনরাবৃত্ত")), "Must report duplicate pair");
  });

  runner.test("Duplicate node IDs and duplicate edge IDs are rejected", () => {
    const testData = JSON.parse(JSON.stringify(SAMPLE_BUILDING));
    testData.nodes.push({ id: "R1", label: "Duplicate R1", type: "room", x: 10, y: 10 });
    testData.edges.push({ id: "e1", from: "R2", to: "C4", cost: 5 });
    const res = validateBuilding(testData);
    assert(res.valid === false, "Duplicate IDs must fail");
    assert(res.errors.some((e) => e.includes("Duplicate node ID")), "Must report duplicate node ID");
    assert(res.errors.some((e) => e.includes("Duplicate edge ID")), "Must report duplicate edge ID");
  });

  runner.test("Non-integer, zero, and negative edge costs are rejected", () => {
    const dataZero = JSON.parse(JSON.stringify(SAMPLE_BUILDING));
    dataZero.edges[0].cost = 0;
    assert(validateBuilding(dataZero).valid === false, "Zero cost must fail");

    const dataNeg = JSON.parse(JSON.stringify(SAMPLE_BUILDING));
    dataNeg.edges[0].cost = -4;
    assert(validateBuilding(dataNeg).valid === false, "Negative cost must fail");

    const dataFloat = JSON.parse(JSON.stringify(SAMPLE_BUILDING));
    dataFloat.edges[0].cost = 3.5;
    assert(validateBuilding(dataFloat).valid === false, "Float cost must fail");
  });

  runner.test("Edge with unknown node endpoint is rejected", () => {
    const testData = JSON.parse(JSON.stringify(SAMPLE_BUILDING));
    testData.edges[0].to = "GHOST_NODE";
    const res = validateBuilding(testData);
    assert(res.valid === false, "Unknown endpoint must fail");
    assert(res.errors.some((e) => e.includes("GHOST_NODE")), "Must report unknown endpoint GHOST_NODE");
  });

  runner.test("blocked_nodes containing an exit ID is rejected", () => {
    const testData = JSON.parse(JSON.stringify(SAMPLE_BUILDING));
    testData.initial_state.blocked_nodes = ["E1"];
    const res = validateBuilding(testData);
    assert(res.valid === false, "Exit in blocked_nodes must fail");
    assert(res.errors.some((e) => e.includes("blocked_nodes") && e.includes("E1")), "Must flag E1 in blocked_nodes");
  });

  runner.test("closed_exits containing a room ID is rejected", () => {
    const testData = JSON.parse(JSON.stringify(SAMPLE_BUILDING));
    testData.initial_state.closed_exits = ["R1"];
    const res = validateBuilding(testData);
    assert(res.valid === false, "Room in closed_exits must fail");
    assert(res.errors.some((e) => e.includes("closed_exits") && e.includes("R1")), "Must flag R1 in closed_exits");
  });

  runner.test("Too few nodes (<2) and too many nodes (>60) are rejected", () => {
    const tooFew = JSON.parse(JSON.stringify(SAMPLE_BUILDING));
    tooFew.nodes = [tooFew.nodes[0]];
    assert(validateBuilding(tooFew).valid === false, "1 node must fail");

    const tooMany = JSON.parse(JSON.stringify(SAMPLE_BUILDING));
    for (let i = 9; i <= 65; i++) {
      tooMany.nodes.push({ id: `EXTRA_${i}`, label: `Extra ${i}`, type: "room", x: i, y: i });
    }
    assert(validateBuilding(tooMany).valid === false, ">60 nodes must fail");
  });

  runner.test("Disconnected graph is VALID", () => {
    const disc = {
      building: "Disconnected Complex",
      nodes: [
        { id: "R1", label: "Room 1", type: "room", x: 0, y: 0 },
        { id: "E1", label: "Exit 1", type: "exit", x: 100, y: 100 }
      ],
      edges: [
        { id: "e1", from: "R1", to: "R1_extra", cost: 1 } // wait, needs valid edge endpoints
      ],
      initial_state: { blocked_nodes: [], blocked_edges: [], closed_exits: [] }
    };
    // Proper disconnected valid endpoints:
    disc.nodes.push({ id: "R2", label: "Room 2", type: "room", x: 50, y: 50 });
    disc.edges = [{ id: "e1", from: "R1", to: "R2", cost: 1 }]; // E1 is disconnected
    const res = validateBuilding(disc);
    assert(res.valid === true, `Disconnected graph should be valid, got: ${res.errors.join("; ")}`);
  });

  return runner;
}
