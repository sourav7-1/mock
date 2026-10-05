/**
 * js/router.js
 * Pure evacuation routing algorithm using Dijkstra and exact tie-breaking.
 * No DOM access, fully offline, exported for testing.
 */

/**
 * Runs Dijkstra's algorithm from a single source node on the filtered graph.
 * @param {string} sourceId
 * @param {Set<string>} validNodes
 * @param {Map<string, Array<{ to: string, cost: number }>>} adj
 * @returns {Record<string, number>} Distances from sourceId to all valid nodes.
 */
function dijkstra(sourceId, validNodes, adj) {
  const dist = {};
  const unvisited = new Set(validNodes);

  for (const nodeId of validNodes) {
    dist[nodeId] = Infinity;
  }
  dist[sourceId] = 0;

  while (unvisited.size > 0) {
    // Find node with minimum distance
    let minDist = Infinity;
    let u = null;

    for (const nodeId of unvisited) {
      if (dist[nodeId] < minDist) {
        minDist = dist[nodeId];
        u = nodeId;
      }
    }

    if (u === null || minDist === Infinity) {
      break;
    }

    unvisited.delete(u);

    const neighbors = adj.get(u) || [];
    for (const edge of neighbors) {
      const v = edge.to;
      if (unvisited.has(v)) {
        const alt = dist[u] + edge.cost;
        if (alt < dist[v]) {
          dist[v] = alt;
        }
      }
    }
  }

  return dist;
}

/**
 * Computes optimal evacuation route according to exact specification rules.
 *
 * Rules:
 * 1. Filtered graph excludes blocked_nodes, blocked_edges, closed_exits.
 * 2. Start must be an unblocked room or junction.
 * 3. Open exits can be traversed as intermediate nodes.
 * 4. Target is the reachable open exit with minimum total cost.
 * 5. Tie 1: lexicographically smallest exit ID ("E10" < "E2").
 * 6. Tie 2: lexicographically smallest node sequence.
 *
 * @param {object} graph - { nodes: [...], edges: [...] }
 * @param {string} startId - Selected starting room or junction ID
 * @param {object} [state] - { blocked_nodes: [], blocked_edges: [], closed_exits: [] }
 * @returns {{ status: "ok", path: string[], exit: string, cost: number } | { status: "no_route" } | { status: "start_blocked" } | { status: "no_start" }}
 */
export function findEvacuationRoute(graph, startId, state = {}) {
  // Validate start presence
  if (!startId || typeof startId !== "string") {
    return { status: "no_start" };
  }

  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    return { status: "no_start" };
  }

  const startNode = graph.nodes.find((n) => n.id === startId);
  if (!startNode) {
    return { status: "no_start" };
  }

  const blockedNodes = new Set(state.blocked_nodes || []);
  const closedExits = new Set(state.closed_exits || []);
  const blockedEdges = new Set(state.blocked_edges || []);

  // Check if starting location is blocked
  if (blockedNodes.has(startId)) {
    return { status: "start_blocked" };
  }

  // Only unblocked rooms/junctions can be start; exits cannot be start
  if (startNode.type === "exit") {
    return { status: "no_start" };
  }

  // Build filtered graph
  // Valid nodes: not blocked and not closed exit
  const validNodes = new Set();
  for (const node of graph.nodes) {
    if (!blockedNodes.has(node.id) && !closedExits.has(node.id)) {
      validNodes.add(node.id);
    }
  }

  if (!validNodes.has(startId)) {
    return { status: "start_blocked" };
  }

  // Adjacency list for filtered graph
  const adj = new Map();
  for (const nodeId of validNodes) {
    adj.set(nodeId, []);
  }

  for (const edge of graph.edges) {
    if (blockedEdges.has(edge.id)) {
      continue;
    }
    if (validNodes.has(edge.from) && validNodes.has(edge.to)) {
      adj.get(edge.from).push({ to: edge.to, cost: edge.cost });
      adj.get(edge.to).push({ to: edge.from, cost: edge.cost });
    }
  }

  // 1. Dijkstra from start on the filtered graph -> dist[]
  const dist = dijkstra(startId, validNodes, adj);

  // 2. Identify open exits and pick target exit
  const openExits = graph.nodes.filter(
    (n) => n.type === "exit" && validNodes.has(n.id)
  );

  const reachableExits = openExits.filter(
    (e) => dist[e.id] !== undefined && dist[e.id] < Infinity
  );

  if (reachableExits.length === 0) {
    return { status: "no_route" };
  }

  let minCost = Infinity;
  for (const exitNode of reachableExits) {
    if (dist[exitNode.id] < minCost) {
      minCost = dist[exitNode.id];
    }
  }

  const exitCandidates = reachableExits.filter(
    (e) => dist[e.id] === minCost
  );

  // Tie 1: choose the lexicographically smallest exit ID (plain JS string comparison)
  exitCandidates.sort((a, b) => {
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return 0;
  });

  const targetExit = exitCandidates[0].id;

  // 3. Dijkstra from target exit on the same filtered graph -> distT[]
  const distT = dijkstra(targetExit, validNodes, adj);

  // 4. Build path greedily from start
  // At node u (u !== target), among neighbors v with distT[u] === cost(u,v) + distT[v],
  // pick the smallest v by string comparison.
  let u = startId;
  const path = [u];
  const maxHops = validNodes.size + 2;

  while (u !== targetExit && path.length <= maxHops) {
    const neighbors = adj.get(u) || [];
    const validNextNeighbors = [];

    for (const neighbor of neighbors) {
      const v = neighbor.to;
      if (distT[u] === neighbor.cost + distT[v]) {
        validNextNeighbors.push(v);
      }
    }

    if (validNextNeighbors.length === 0) {
      // No valid step found
      return { status: "no_route" };
    }

    // Tie 2: pick smallest v by JS string comparison
    validNextNeighbors.sort((a, b) => {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    });

    const nextNode = validNextNeighbors[0];
    path.push(nextNode);
    u = nextNode;
  }

  if (u !== targetExit) {
    return { status: "no_route" };
  }

  return {
    status: "ok",
    path,
    exit: targetExit,
    cost: distT[startId]
  };
}

// Alias for convenience
export const route = findEvacuationRoute;
