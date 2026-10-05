/**
 * src/core/validate.js
 * Pure JS module for validating building graph schemas.
 * Returns { ok: true, data } or { ok: false, errors: [{ code, params }] }
 */

export function validateBuilding(input) {
  let data;
  if (typeof input === "string") {
    try {
      data = JSON.parse(input);
    } catch (err) {
      return {
        ok: false,
        errors: [{ code: "INVALID_JSON", params: { message: err.message } }]
      };
    }
  } else if (input && typeof input === "object") {
    data = input;
  } else {
    return {
      ok: false,
      errors: [{ code: "INVALID_JSON", params: { message: "Input is not a JSON object or string." } }]
    };
  }

  const errors = [];

  // 1. Root structure and building name
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return {
      ok: false,
      errors: [{ code: "INVALID_ROOT_OBJECT", params: {} }]
    };
  }

  if (typeof data.building !== "string" || data.building.trim().length === 0) {
    errors.push({ code: "INVALID_BUILDING_NAME", params: {} });
  }

  if (!Array.isArray(data.nodes)) {
    errors.push({ code: "MISSING_NODES_ARRAY", params: {} });
  }

  if (!Array.isArray(data.edges)) {
    errors.push({ code: "MISSING_EDGES_ARRAY", params: {} });
  }

  if (
    !data.initial_state ||
    typeof data.initial_state !== "object" ||
    Array.isArray(data.initial_state)
  ) {
    errors.push({ code: "MISSING_INITIAL_STATE", params: {} });
  }

  // If basic arrays are missing, return early
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  // 2. Node count check (2-60)
  if (data.nodes.length < 2 || data.nodes.length > 60) {
    errors.push({
      code: "NODE_COUNT_OUT_OF_RANGE",
      params: { count: data.nodes.length, min: 2, max: 60 }
    });
  }

  // 3. Edge count check (1-150)
  if (data.edges.length < 1 || data.edges.length > 150) {
    errors.push({
      code: "EDGE_COUNT_OUT_OF_RANGE",
      params: { count: data.edges.length, min: 1, max: 150 }
    });
  }

  // 4. Validate individual nodes
  const nodeMap = new Map();
  let roomOrJunctionCount = 0;
  let exitCount = 0;

  data.nodes.forEach((node, idx) => {
    if (!node || typeof node !== "object") {
      errors.push({ code: "INVALID_NODE_OBJECT", params: { index: idx } });
      return;
    }

    // Node ID
    if (typeof node.id !== "string" || node.id.trim().length === 0) {
      errors.push({ code: "INVALID_NODE_ID", params: { index: idx } });
      return;
    }

    if (nodeMap.has(node.id)) {
      errors.push({ code: "DUPLICATE_NODE_ID", params: { id: node.id } });
    } else {
      nodeMap.set(node.id, node);
    }

    // Node Label
    if (typeof node.label !== "string" || node.label.trim().length === 0) {
      errors.push({ code: "INVALID_NODE_LABEL", params: { id: node.id } });
    }

    // Node Type
    const validTypes = ["room", "junction", "exit"];
    if (!validTypes.includes(node.type)) {
      errors.push({ code: "INVALID_NODE_TYPE", params: { id: node.id, type: String(node.type) } });
    } else {
      if (node.type === "room" || node.type === "junction") roomOrJunctionCount++;
      if (node.type === "exit") exitCount++;
    }

    // Node Coordinates
    if (
      typeof node.x !== "number" ||
      !Number.isFinite(node.x) ||
      typeof node.y !== "number" ||
      !Number.isFinite(node.y)
    ) {
      errors.push({ code: "INVALID_NODE_COORDINATES", params: { id: node.id, x: node.x, y: node.y } });
    }
  });

  // At least one room/junction AND at least one exit
  if (roomOrJunctionCount === 0) {
    errors.push({ code: "NO_ROOM_OR_JUNCTION", params: {} });
  }
  if (exitCount === 0) {
    errors.push({ code: "NO_EXIT_NODE", params: {} });
  }

  // 5. Validate Edges
  const edgeIdSet = new Set();
  const nodePairSet = new Set();

  data.edges.forEach((edge, idx) => {
    if (!edge || typeof edge !== "object") {
      errors.push({ code: "INVALID_EDGE_OBJECT", params: { index: idx } });
      return;
    }

    // Edge ID
    if (typeof edge.id !== "string" || edge.id.trim().length === 0) {
      errors.push({ code: "INVALID_EDGE_ID", params: { index: idx } });
      return;
    }

    if (edgeIdSet.has(edge.id)) {
      errors.push({ code: "DUPLICATE_EDGE_ID", params: { id: edge.id } });
    } else {
      edgeIdSet.add(edge.id);
    }

    // Endpoints exist
    const fromExists = nodeMap.has(edge.from);
    const toExists = nodeMap.has(edge.to);

    if (!fromExists) {
      errors.push({ code: "EDGE_UNKNOWN_NODE", params: { id: edge.id, endpoint: edge.from } });
    }
    if (!toExists) {
      errors.push({ code: "EDGE_UNKNOWN_NODE", params: { id: edge.id, endpoint: edge.to } });
    }

    // No self loop
    if (fromExists && toExists && edge.from === edge.to) {
      errors.push({ code: "EDGE_SELF_LOOP", params: { id: edge.id, node: edge.from } });
    }

    // No repeated node pair (A-B and B-A are the same pair)
    if (fromExists && toExists && edge.from !== edge.to) {
      const pairKey = edge.from < edge.to ? `${edge.from}---${edge.to}` : `${edge.to}---${edge.from}`;
      if (nodePairSet.has(pairKey)) {
        errors.push({ code: "EDGE_DUPLICATE_PAIR", params: { id: edge.id, from: edge.from, to: edge.to } });
      } else {
        nodePairSet.add(pairKey);
      }
    }

    // Cost must be a positive integer
    if (
      typeof edge.cost !== "number" ||
      !Number.isInteger(edge.cost) ||
      edge.cost <= 0
    ) {
      errors.push({ code: "EDGE_INVALID_COST", params: { id: edge.id, cost: edge.cost } });
    }
  });

  // 6. Validate initial_state
  const initState = data.initial_state;
  if (!Array.isArray(initState.blocked_nodes)) {
    errors.push({ code: "INVALID_INITIAL_STATE_ARRAY", params: { field: "blocked_nodes" } });
  } else {
    initState.blocked_nodes.forEach((id) => {
      const n = nodeMap.get(id);
      if (!n) {
        errors.push({ code: "UNKNOWN_BLOCKED_NODE", params: { id } });
      } else if (n.type === "exit") {
        errors.push({ code: "BLOCKED_NODE_IS_EXIT", params: { id } });
      }
    });
  }

  if (!Array.isArray(initState.blocked_edges)) {
    errors.push({ code: "INVALID_INITIAL_STATE_ARRAY", params: { field: "blocked_edges" } });
  } else {
    initState.blocked_edges.forEach((id) => {
      if (!edgeIdSet.has(id)) {
        errors.push({ code: "UNKNOWN_BLOCKED_EDGE", params: { id } });
      }
    });
  }

  if (!Array.isArray(initState.closed_exits)) {
    errors.push({ code: "INVALID_INITIAL_STATE_ARRAY", params: { field: "closed_exits" } });
  } else {
    initState.closed_exits.forEach((id) => {
      const n = nodeMap.get(id);
      if (!n) {
        errors.push({ code: "UNKNOWN_CLOSED_EXIT", params: { id } });
      } else if (n.type !== "exit") {
        errors.push({ code: "CLOSED_EXIT_NOT_EXIT", params: { id } });
      }
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, data };
}
