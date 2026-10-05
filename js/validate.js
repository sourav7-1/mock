/**
 * js/validate.js
 * Validates building.json specification and returns every specific error found.
 */

import { t, getLanguage } from "./i18n.js";

/**
 * Validates a building JSON string or parsed object.
 * @param {string|object} input - Raw JSON string or parsed JS object.
 * @param {string} [lang] - Optional language code ('en' or 'bn').
 * @returns {{ valid: boolean, errors: string[], data: object|null }}
 */
export function validateBuilding(input, lang = null) {
  const errors = [];
  let data = null;

  // 1. JSON parsing check
  if (typeof input === "string") {
    try {
      data = JSON.parse(input);
    } catch (err) {
      return {
        valid: false,
        errors: [t("errInvalidJson", { msg: err.message })],
        data: null
      };
    }
  } else if (input && typeof input === "object") {
    data = input;
  } else {
    return {
      valid: false,
      errors: [t("errRootObject")],
      data: null
    };
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {
      valid: false,
      errors: [t("errRootObject")],
      data: null
    };
  }

  // 2. 'building' field: non-empty string
  if (typeof data.building !== "string" || data.building.trim().length === 0) {
    errors.push(t("errBuildingString"));
  }

  // 3. 'nodes' array: 2–60 nodes
  const nodeMap = new Map();
  const seenNodeIds = new Set();
  let hasRoomOrJunction = false;
  let hasExit = false;

  if (!("nodes" in data)) {
    errors.push(t("errNodesArray"));
  } else if (!Array.isArray(data.nodes)) {
    errors.push(t("errNodesArray"));
  } else {
    const nodeCount = data.nodes.length;
    if (nodeCount < 2 || nodeCount > 60) {
      errors.push(t("errNodeCount", { count: nodeCount }));
    }

    data.nodes.forEach((node, idx) => {
      if (!node || typeof node !== "object" || Array.isArray(node)) {
        errors.push(t("errNodeObject", { index: idx }));
        return;
      }

      // Unique case-sensitive id
      const nodeId = node.id;
      if (typeof nodeId !== "string" || nodeId.trim().length === 0) {
        errors.push(t("errNodeIdRequired", { index: idx }));
      } else {
        if (seenNodeIds.has(nodeId)) {
          errors.push(t("errNodeDuplicateId", { id: nodeId }));
        } else {
          seenNodeIds.add(nodeId);
          nodeMap.set(nodeId, node);
        }
      }

      const displayId = typeof nodeId === "string" && nodeId ? nodeId : `#${idx}`;

      // Non-empty label
      if (typeof node.label !== "string" || node.label.trim().length === 0) {
        errors.push(t("errNodeLabelRequired", { id: displayId }));
      }

      // type in {room, junction, exit}
      const validTypes = ["room", "junction", "exit"];
      if (typeof node.type !== "string" || !validTypes.includes(node.type)) {
        errors.push(t("errNodeTypeInvalid", { id: displayId, type: String(node.type) }));
      } else {
        if (node.type === "room" || node.type === "junction") {
          hasRoomOrJunction = true;
        }
        if (node.type === "exit") {
          hasExit = true;
        }
      }

      // x and y finite numbers
      if (
        typeof node.x !== "number" ||
        !Number.isFinite(node.x) ||
        typeof node.y !== "number" ||
        !Number.isFinite(node.y)
      ) {
        errors.push(t("errNodeCoordsInvalid", { id: displayId }));
      }
    });

    if (!hasRoomOrJunction) {
      errors.push(t("errNeedRoomOrJunction"));
    }
    if (!hasExit) {
      errors.push(t("errNeedExit"));
    }
  }

  // 4. 'edges' array: 1–150 edges
  const seenEdgeIds = new Set();
  const seenPairs = new Set();

  if (!("edges" in data)) {
    errors.push(t("errEdgesArray"));
  } else if (!Array.isArray(data.edges)) {
    errors.push(t("errEdgesArray"));
  } else {
    const edgeCount = data.edges.length;
    if (edgeCount < 1 || edgeCount > 150) {
      errors.push(t("errEdgeCount", { count: edgeCount }));
    }

    data.edges.forEach((edge, idx) => {
      if (!edge || typeof edge !== "object" || Array.isArray(edge)) {
        errors.push(t("errEdgeObject", { index: idx }));
        return;
      }

      const edgeId = edge.id;
      if (typeof edgeId !== "string" || edgeId.trim().length === 0) {
        errors.push(t("errEdgeIdRequired", { index: idx }));
      } else {
        if (seenEdgeIds.has(edgeId)) {
          errors.push(t("errEdgeDuplicateId", { id: edgeId }));
        } else {
          seenEdgeIds.add(edgeId);
        }
      }

      const displayEdgeId = typeof edgeId === "string" && edgeId ? edgeId : `#${idx}`;

      let endpointsValid = true;
      if (typeof edge.from !== "string" || !nodeMap.has(edge.from)) {
        errors.push(t("errEdgeUnknownNode", { id: displayEdgeId, nodeId: String(edge.from) }));
        endpointsValid = false;
      }
      if (typeof edge.to !== "string" || !nodeMap.has(edge.to)) {
        errors.push(t("errEdgeUnknownNode", { id: displayEdgeId, nodeId: String(edge.to) }));
        endpointsValid = false;
      }

      // No self-loops (from !== to)
      if (typeof edge.from === "string" && typeof edge.to === "string" && edge.from === edge.to) {
        errors.push(t("errEdgeSelfLoop", { id: displayEdgeId, from: edge.from, to: edge.to }));
      } else if (endpointsValid) {
        // No repeated node pairs (A-B and B-A count as same pair)
        const pairKey = edge.from < edge.to ? `${edge.from}:::${edge.to}` : `${edge.to}:::${edge.from}`;
        if (seenPairs.has(pairKey)) {
          errors.push(t("errEdgeDuplicatePair", { from: edge.from, to: edge.to }));
        } else {
          seenPairs.add(pairKey);
        }
      }

      // Cost is a positive integer
      if (
        typeof edge.cost !== "number" ||
        !Number.isInteger(edge.cost) ||
        edge.cost <= 0
      ) {
        errors.push(t("errEdgeCostInvalid", { id: displayEdgeId, cost: String(edge.cost) }));
      }
    });
  }

  // 5. 'initial_state' checks
  if (
    !("initial_state" in data) ||
    !data.initial_state ||
    typeof data.initial_state !== "object" ||
    Array.isArray(data.initial_state)
  ) {
    errors.push(t("errInitialStateObject"));
  } else {
    const { blocked_nodes, blocked_edges, closed_exits } = data.initial_state;

    if (!Array.isArray(blocked_nodes) || !Array.isArray(blocked_edges) || !Array.isArray(closed_exits)) {
      errors.push(t("errInitialStateObject"));
    } else {
      // blocked_nodes: only room/junction IDs
      blocked_nodes.forEach((id) => {
        const node = nodeMap.get(id);
        if (!node || (node.type !== "room" && node.type !== "junction")) {
          errors.push(t("errBlockedNodeInvalid", { id: String(id) }));
        }
      });

      // blocked_edges: existing edge IDs
      blocked_edges.forEach((id) => {
        if (!seenEdgeIds.has(id)) {
          errors.push(t("errBlockedEdgeInvalid", { id: String(id) }));
        }
      });

      // closed_exits: only exit IDs
      closed_exits.forEach((id) => {
        const node = nodeMap.get(id);
        if (!node || node.type !== "exit") {
          errors.push(t("errClosedExitInvalid", { id: String(id) }));
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? data : null
  };
}
