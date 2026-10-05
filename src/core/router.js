/**
 * src/core/router.js
 * Framework-free evacuation routing engine with strict lexicographic tie-breaking.
 */

/**
 * Finds optimal evacuation route from start node to reachable open exit.
 *
 * @param {Object} graph - { nodes: [...], edges: [...] }
 * @param {Object} state - { blocked_nodes: [], blocked_edges: [], closed_exits: [] }
 * @param {string} startId - The ID of the starting node (room or junction)
 * @returns {Object} Route result object:
 *   { status: "ok", path: string[], edges: string[], segments: [{from, to, edgeId, cost}], exit: string, cost: number }
 *   or { status: "no_route" }
 *   or { status: "start_blocked" }
 *   or { status: "no_start" }
 */
export function findEvacuationRoute(graph, state, startId) {
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    return { status: "no_route" };
  }

  if (!startId) {
    return { status: "no_start" };
  }

  const nodeMap = new Map();
  graph.nodes.forEach((n) => nodeMap.set(n.id, n));

  const startNode = nodeMap.get(startId);
  if (!startNode) {
    return { status: "no_start" };
  }

  // Start must be room or junction. Exits cannot be start.
  if (startNode.type === "exit") {
    return { status: "no_route" };
  }

  const blockedNodes = new Set(state?.blocked_nodes || []);
  const blockedEdges = new Set(state?.blocked_edges || []);
  const closedExits = new Set(state?.closed_exits || []);

  if (blockedNodes.has(startId)) {
    return { status: "start_blocked" };
  }

  // Traversal nodes allowed:
  // Not blocked, and not a closed exit (closed exits cannot be destinations or intermediate nodes).
  // Open exits CAN be intermediate nodes.
  const allowedNodes = new Set();
  graph.nodes.forEach((node) => {
    if (blockedNodes.has(node.id)) return;
    if (node.type === "exit" && closedExits.has(node.id)) return;
    allowedNodes.add(node.id);
  });

  if (!allowedNodes.has(startId)) {
    return { status: "start_blocked" };
  }

  // Build filtered undirected adjacency list
  const adj = new Map();
  allowedNodes.forEach((id) => adj.set(id, []));

  graph.edges.forEach((edge) => {
    if (blockedEdges.has(edge.id)) return;
    if (!allowedNodes.has(edge.from) || !allowedNodes.has(edge.to)) return;

    adj.get(edge.from).push({ to: edge.to, cost: edge.cost, edgeId: edge.id });
    adj.get(edge.to).push({ to: edge.from, cost: edge.cost, edgeId: edge.id });
  });

  // Step 1: Dijkstra from start node
  const dist = new Map();
  const visited = new Set();
  dist.set(startId, 0);

  while (true) {
    let u = null;
    let minD = Infinity;

    for (const [id, d] of dist.entries()) {
      if (!visited.has(id) && d < minD) {
        minD = d;
        u = id;
      }
    }

    if (u === null || minD === Infinity) break;
    visited.add(u);

    const neighbors = adj.get(u) || [];
    for (const { to, cost } of neighbors) {
      if (visited.has(to)) continue;
      const alt = minD + cost;
      if (alt < (dist.get(to) ?? Infinity)) {
        dist.set(to, alt);
      }
    }
  }

  // Step 2: Pick target exit per rules
  // Exits must be reachable (dist < Infinity) and open
  const reachableExits = graph.nodes
    .filter(
      (n) =>
        n.type === "exit" &&
        !closedExits.has(n.id) &&
        dist.has(n.id) &&
        dist.get(n.id) < Infinity
    )
    .sort((a, b) => {
      const costA = dist.get(a.id);
      const costB = dist.get(b.id);
      if (costA !== costB) return costA - costB;
      // Plain JS string comparison (e.g. "E10" < "E2")
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });

  if (reachableExits.length === 0) {
    return { status: "no_route" };
  }

  const targetExit = reachableExits[0];
  const targetExitId = targetExit.id;
  const targetCost = dist.get(targetExitId);

  // Step 3: Dijkstra from target exit on the same filtered graph
  const distT = new Map();
  const visitedT = new Set();
  distT.set(targetExitId, 0);

  while (true) {
    let u = null;
    let minD = Infinity;

    for (const [id, d] of distT.entries()) {
      if (!visitedT.has(id) && d < minD) {
        minD = d;
        u = id;
      }
    }

    if (u === null || minD === Infinity) break;
    visitedT.add(u);

    const neighbors = adj.get(u) || [];
    for (const { to, cost } of neighbors) {
      if (visitedT.has(to)) continue;
      const alt = minD + cost;
      if (alt < (distT.get(to) ?? Infinity)) {
        distT.set(to, alt);
      }
    }
  }

  // Step 4: Walk from start greedily
  // at node u, among neighbors v with distT[u] === cost(u,v) + distT[v],
  // pick the lexicographically smallest v by string comparison.
  const path = [startId];
  const edges = [];
  const segments = [];
  let curr = startId;
  let safetyLimit = graph.nodes.length + 5;

  while (curr !== targetExitId && safetyLimit-- > 0) {
    const currDistT = distT.get(curr);
    if (currDistT === undefined || currDistT === Infinity) {
      return { status: "no_route" };
    }

    const neighbors = adj.get(curr) || [];
    const validNext = [];

    for (const edge of neighbors) {
      const vDistT = distT.get(edge.to);
      if (vDistT !== undefined && currDistT === edge.cost + vDistT) {
        validNext.push(edge);
      }
    }

    if (validNext.length === 0) {
      return { status: "no_route" };
    }

    // Sort valid next nodes lexicographically by node ID (string comparison)
    validNext.sort((a, b) => {
      if (a.to < b.to) return -1;
      if (a.to > b.to) return 1;
      return a.edgeId < b.edgeId ? -1 : a.edgeId > b.edgeId ? 1 : 0;
    });

    const chosen = validNext[0];
    path.push(chosen.to);
    edges.push(chosen.edgeId);
    segments.push({
      from: curr,
      to: chosen.to,
      edgeId: chosen.edgeId,
      cost: chosen.cost
    });
    curr = chosen.to;
  }

  if (curr !== targetExitId) {
    return { status: "no_route" };
  }

  return {
    status: "ok",
    path,
    edges,
    segments,
    exit: targetExitId,
    cost: targetCost
  };
}

/**
 * Previews what route would result if a specific hazard is toggled.
 *
 * @param {Object} graph
 * @param {Object} state
 * @param {string} startId
 * @param {Object} toggle - { type: "node"|"edge"|"exit", id: string } or { id: string }
 * @returns {Object} Route result object
 */
export function previewRoute(graph, state, startId, toggle) {
  if (!graph || !state || !toggle || !toggle.id) {
    return findEvacuationRoute(graph, state, startId);
  }

  let type = toggle.type;
  const id = toggle.id;

  // Infer type if not specified
  if (!type) {
    const node = graph.nodes?.find((n) => n.id === id);
    if (node) {
      type = node.type === "exit" ? "exit" : "node";
    } else {
      type = "edge";
    }
  }

  const newState = {
    blocked_nodes: [...(state.blocked_nodes || [])],
    blocked_edges: [...(state.blocked_edges || [])],
    closed_exits: [...(state.closed_exits || [])]
  };

  if (type === "exit") {
    if (newState.closed_exits.includes(id)) {
      newState.closed_exits = newState.closed_exits.filter((x) => x !== id);
    } else {
      newState.closed_exits.push(id);
    }
  } else if (type === "edge") {
    if (newState.blocked_edges.includes(id)) {
      newState.blocked_edges = newState.blocked_edges.filter((x) => x !== id);
    } else {
      newState.blocked_edges.push(id);
    }
  } else {
    // node
    if (newState.blocked_nodes.includes(id)) {
      newState.blocked_nodes = newState.blocked_nodes.filter((x) => x !== id);
    } else {
      newState.blocked_nodes.push(id);
    }
  }

  return findEvacuationRoute(graph, newState, startId);
}
