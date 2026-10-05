/**
 * js/render.js
 * SVG graph visualization, animations, accessibility, and side panel rendering.
 */

import { t, getLanguage } from "./i18n.js";

/**
 * Calculates viewBox dimensions to auto-fit all nodes with generous padding.
 * @param {Array<{ x: number, y: number }>} nodes
 * @returns {string} viewBox string
 */
export function calculateViewBox(nodes) {
  if (!nodes || nodes.length === 0) {
    return "0 0 800 600";
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  nodes.forEach((n) => {
    if (n.x < minX) minX = n.x;
    if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.y > maxY) maxY = n.y;
  });

  const padX = 80;
  const padY = 80;
  const width = Math.max(maxX - minX + padX * 2, 400);
  const height = Math.max(maxY - minY + padY * 2, 300);

  return `${minX - padX} ${minY - padY} ${width} ${height}`;
}

/**
 * Renders the full SVG graph into the provided SVG container.
 */
export function renderGraph(svgEl, {
  graph,
  state,
  startId,
  routeResult,
  walkthroughIndex = -1,
  onNodeClick,
  onEdgeClick,
  onNodeContextMenu,
  onEdgeContextMenu
}) {
  if (!svgEl || !graph || !graph.nodes) return;

  svgEl.innerHTML = "";

  // Set viewBox
  const vb = calculateViewBox(graph.nodes);
  svgEl.setAttribute("viewBox", vb);
  svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");

  const blockedNodes = new Set(state.blocked_nodes || []);
  const blockedEdges = new Set(state.blocked_edges || []);
  const closedExits = new Set(state.closed_exits || []);

  const routePath = routeResult && routeResult.status === "ok" ? routeResult.path : [];
  const routeNodeSet = new Set(routePath);

  // Set of route edge pairs
  const routeEdgePairs = new Set();
  for (let i = 0; i < routePath.length - 1; i++) {
    const u = routePath[i];
    const v = routePath[i + 1];
    routeEdgePairs.add(u < v ? `${u}:::${v}` : `${v}:::${u}`);
  }

  // Create SVG Defs for markers and filters
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.innerHTML = `
    <!-- Pulse glow filter -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  `;
  svgEl.appendChild(defs);

  // 1. Draw Edges Group
  const edgesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  edgesGroup.setAttribute("class", "graph-edges-layer");

  // Map of nodes for quick coordinate lookup
  const nodeMap = new Map();
  graph.nodes.forEach((n) => nodeMap.set(n.id, n));

  graph.edges.forEach((edge) => {
    const fromNode = nodeMap.get(edge.from);
    const toNode = nodeMap.get(edge.to);
    if (!fromNode || !toNode) return;

    const edgeG = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const isBlocked = blockedEdges.has(edge.id);
    const pairKey = edge.from < edge.to ? `${edge.from}:::${edge.to}` : `${edge.to}:::${edge.from}`;
    const isInRoute = routeEdgePairs.has(pairKey);

    let edgeClass = "edge-item";
    if (isBlocked) edgeClass += " edge-blocked";
    if (isInRoute) edgeClass += " edge-route";

    edgeG.setAttribute("class", edgeClass);
    edgeG.setAttribute("data-edge-id", edge.id);
    edgeG.setAttribute("tabindex", "0");
    edgeG.setAttribute("role", "button");
    const statusText = isBlocked ? t("legendBlockedEdge") : (isInRoute ? t("legendRoute") : "Clear");
    edgeG.setAttribute("aria-label", `Corridor ${edge.id} from ${edge.from} to ${edge.to}, cost ${edge.cost}, status: ${statusText}`);

    // Wide transparent hit area line
    const hitLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    hitLine.setAttribute("x1", fromNode.x);
    hitLine.setAttribute("y1", fromNode.y);
    hitLine.setAttribute("x2", toNode.x);
    hitLine.setAttribute("y2", toNode.y);
    hitLine.setAttribute("class", "edge-hitarea");

    // Base visible line
    const baseLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    baseLine.setAttribute("x1", fromNode.x);
    baseLine.setAttribute("y1", fromNode.y);
    baseLine.setAttribute("x2", toNode.x);
    baseLine.setAttribute("y2", toNode.y);
    baseLine.setAttribute("class", "edge-baseline");

    edgeG.appendChild(hitLine);
    edgeG.appendChild(baseLine);

    // If edge is in route, add highlighted route overlay
    if (isInRoute) {
      const routeLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      routeLine.setAttribute("x1", fromNode.x);
      routeLine.setAttribute("y1", fromNode.y);
      routeLine.setAttribute("x2", toNode.x);
      routeLine.setAttribute("y2", toNode.y);
      routeLine.setAttribute("class", "edge-routeline");
      edgeG.appendChild(routeLine);
    }

    // Midpoint cost pill
    const midX = (fromNode.x + toNode.x) / 2;
    const midY = (fromNode.y + toNode.y) / 2;

    const pillG = document.createElementNS("http://www.w3.org/2000/svg", "g");
    pillG.setAttribute("class", "cost-pill-group");
    pillG.setAttribute("transform", `translate(${midX}, ${midY})`);

    const pillBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    pillBg.setAttribute("class", "cost-pill-bg");
    pillBg.setAttribute("x", "-13");
    pillBg.setAttribute("y", "-10");
    pillBg.setAttribute("width", "26");
    pillBg.setAttribute("height", "20");
    pillBg.setAttribute("rx", "6");

    const pillText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    pillText.setAttribute("class", "cost-pill-text");
    pillText.setAttribute("text-anchor", "middle");
    pillText.setAttribute("dominant-baseline", "central");
    pillText.textContent = String(edge.cost);

    pillG.appendChild(pillBg);
    pillG.appendChild(pillText);
    edgeG.appendChild(pillG);

    // Event listeners
    edgeG.addEventListener("click", (e) => {
      e.stopPropagation();
      if (onEdgeClick) onEdgeClick(edge.id, e);
    });

    edgeG.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (onEdgeContextMenu) onEdgeContextMenu(edge.id, e);
    });

    edgeG.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (onEdgeClick) onEdgeClick(edge.id, e);
      }
    });

    edgesGroup.appendChild(edgeG);
  });

  svgEl.appendChild(edgesGroup);

  // 2. Continuous Animated Route Path Overlay (draws smoothly)
  if (routePath.length > 1) {
    const routeD = routePath
      .map((id, idx) => {
        const n = nodeMap.get(id);
        return idx === 0 ? `M ${n.x} ${n.y}` : `L ${n.x} ${n.y}`;
      })
      .join(" ");

    const animRoutePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    animRoutePath.setAttribute("class", "route-anim-path");
    animRoutePath.setAttribute("d", routeD);
    animRoutePath.setAttribute("fill", "none");
    svgEl.appendChild(animRoutePath);

    // Compute length for stroke-dashoffset animation
    try {
      const pathLength = animRoutePath.getTotalLength();
      animRoutePath.style.strokeDasharray = `${pathLength}`;
      animRoutePath.style.strokeDashoffset = `${pathLength}`;
      // Force repaint
      void animRoutePath.getBoundingClientRect();
      animRoutePath.style.strokeDashoffset = "0";
    } catch (_) {
      // In non-DOM testing or fallback
    }
  }

  // 3. Draw Nodes Group
  const nodesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  nodesGroup.setAttribute("class", "graph-nodes-layer");

  graph.nodes.forEach((node) => {
    const nodeG = document.createElementNS("http://www.w3.org/2000/svg", "g");
    nodeG.setAttribute("transform", `translate(${node.x}, ${node.y})`);
    nodeG.setAttribute("data-node-id", node.id);
    nodeG.setAttribute("tabindex", "0");
    nodeG.setAttribute("role", "button");

    const isStart = node.id === startId;
    const isBlocked = blockedNodes.has(node.id);
    const isClosedExit = closedExits.has(node.id);
    const isInRoute = routeNodeSet.has(node.id);
    const isWalkthroughCurrent = walkthroughIndex >= 0 && routePath[walkthroughIndex] === node.id;

    let nodeClasses = `node-item node-${node.type}`;
    if (isStart) nodeClasses += " node-start";
    if (isBlocked) nodeClasses += " node-blocked";
    if (isClosedExit) nodeClasses += " node-closed-exit";
    if (isInRoute) nodeClasses += " node-in-route";
    if (isWalkthroughCurrent) nodeClasses += " node-walkthrough-active";

    nodeG.setAttribute("class", nodeClasses);

    // Accessible ARIA Label
    let stateDesc = "Clear";
    if (isBlocked) stateDesc = t("legendBlockedNode");
    else if (isClosedExit) stateDesc = t("legendClosedExit");
    else if (isStart) stateDesc = t("legendStart");
    else if (isInRoute) stateDesc = t("legendRoute");

    nodeG.setAttribute("aria-label", `${node.type.toUpperCase()} ${node.id} (${node.label}), state: ${stateDesc}`);

    // If start node, render outer pulse ring
    if (isStart) {
      const startRing = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      startRing.setAttribute("class", "start-ring-marker");
      startRing.setAttribute("r", "34");
      nodeG.appendChild(startRing);
    }

    // Render node shape based on type
    if (node.type === "room") {
      // Circle for room
      const shape = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      shape.setAttribute("class", "node-shape shape-room");
      shape.setAttribute("r", "24");
      nodeG.appendChild(shape);
    } else if (node.type === "junction") {
      // Diamond for junction
      const shape = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      shape.setAttribute("class", "node-shape shape-junction");
      shape.setAttribute("points", "0,-18 18,0 0,18 -18,0");
      nodeG.appendChild(shape);
    } else if (node.type === "exit") {
      // Rounded square for exit
      const shape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      shape.setAttribute("class", "node-shape shape-exit");
      shape.setAttribute("x", "-24");
      shape.setAttribute("y", "-24");
      shape.setAttribute("width", "48");
      shape.setAttribute("height", "48");
      shape.setAttribute("rx", "10");
      nodeG.appendChild(shape);
    }

    // Blocked X marker icon
    if (isBlocked) {
      const crossG = document.createElementNS("http://www.w3.org/2000/svg", "g");
      crossG.setAttribute("class", "blocked-cross-icon");
      crossG.innerHTML = `
        <line x1="-12" y1="-12" x2="12" y2="12" stroke="#dc2626" stroke-width="4" stroke-linecap="round" />
        <line x1="12" y1="-12" x2="-12" y2="12" stroke="#dc2626" stroke-width="4" stroke-linecap="round" />
      `;
      nodeG.appendChild(crossG);
    }

    // Closed Exit badge
    if (isClosedExit) {
      const badgeG = document.createElementNS("http://www.w3.org/2000/svg", "g");
      badgeG.setAttribute("class", "closed-exit-badge");
      badgeG.setAttribute("transform", "translate(0, 32)");

      const badgeBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      badgeBg.setAttribute("x", "-28");
      badgeBg.setAttribute("y", "-9");
      badgeBg.setAttribute("width", "56");
      badgeBg.setAttribute("height", "18");
      badgeBg.setAttribute("rx", "4");
      badgeBg.setAttribute("fill", "#dc2626");

      const badgeText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      badgeText.setAttribute("text-anchor", "middle");
      badgeText.setAttribute("dominant-baseline", "central");
      badgeText.setAttribute("fill", "#ffffff");
      badgeText.setAttribute("font-size", "10");
      badgeText.setAttribute("font-weight", "bold");
      badgeText.textContent = getLanguage() === "bn" ? "বন্ধ" : "CLOSED";

      badgeG.appendChild(badgeBg);
      badgeG.appendChild(badgeText);
      nodeG.appendChild(badgeG);
    }

    // Node ID Text
    const idText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    idText.setAttribute("class", "node-id-text");
    idText.setAttribute("text-anchor", "middle");
    idText.setAttribute("dominant-baseline", "central");
    idText.textContent = node.id;
    nodeG.appendChild(idText);

    // Node Label Text (below shape)
    const labelText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    labelText.setAttribute("class", "node-sublabel-text");
    labelText.setAttribute("text-anchor", "middle");
    labelText.setAttribute("y", node.type === "exit" ? "34" : "32");
    labelText.textContent = node.label;
    nodeG.appendChild(labelText);

    // Walkthrough active marker indicator (avatar/pulse)
    if (isWalkthroughCurrent) {
      const wtRing = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      wtRing.setAttribute("class", "walkthrough-active-ring");
      wtRing.setAttribute("r", "38");
      nodeG.appendChild(wtRing);
    }

    // Event listeners
    nodeG.addEventListener("click", (e) => {
      e.stopPropagation();
      if (onNodeClick) onNodeClick(node.id, node.type, e);
    });

    nodeG.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (onNodeContextMenu) onNodeContextMenu(node.id, node.type, e);
    });

    nodeG.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (onNodeClick) onNodeClick(node.id, node.type, e);
      }
    });

    nodesGroup.appendChild(nodeG);
  });

  svgEl.appendChild(nodesGroup);
}

/**
 * Renders the Side Panel information, metrics, and active hazards.
 */
export function renderSidePanel(container, {
  graph,
  state,
  startId,
  routeResult,
  onRemoveHazard
}) {
  if (!container) return;

  const buildingName = graph ? graph.building : "–";
  const startNode = graph && startId ? graph.nodes.find((n) => n.id === startId) : null;
  const startLabel = startNode ? `${startNode.id} (${startNode.label})` : t("noneSelected");

  // Determine status message and card styling
  let statusText = "";
  let statusClass = "status-info";

  if (!startId) {
    statusText = t("statusNoStart");
    statusClass = "status-neutral";
  } else if (routeResult) {
    if (routeResult.status === "start_blocked") {
      statusText = t("statusStartBlocked");
      statusClass = "status-danger";
    } else if (routeResult.status === "no_route") {
      statusText = t("statusNoRoute");
      statusClass = "status-warning";
    } else if (routeResult.status === "ok") {
      statusText = t("statusOk");
      statusClass = "status-success";
    }
  }

  const routeStr =
    routeResult && routeResult.status === "ok" && routeResult.path
      ? routeResult.path.join(" → ")
      : "–";

  const chosenExit =
    routeResult && routeResult.status === "ok" && routeResult.exit
      ? routeResult.exit
      : "–";

  const totalCost =
    routeResult && routeResult.status === "ok" && routeResult.cost !== undefined
      ? String(routeResult.cost)
      : "–";

  // Hazard lists
  const blockedNodes = state.blocked_nodes || [];
  const blockedEdges = state.blocked_edges || [];
  const closedExits = state.closed_exits || [];

  container.innerHTML = `
    <div class="panel-section">
      <h2 class="panel-header">${t("panelTitle")}</h2>
      <div class="metric-row">
        <span class="metric-label">${t("buildingLabel")}:</span>
        <span class="metric-value font-semibold">${escapeHtml(buildingName)}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">${t("startNodeLabel")}:</span>
        <span class="metric-value font-semibold">${escapeHtml(startLabel)}</span>
      </div>
    </div>

    <!-- Status Banner -->
    <div class="status-banner ${statusClass}" role="status" aria-live="polite">
      <span class="status-indicator-dot"></span>
      <span class="status-banner-text font-bold">${escapeHtml(statusText)}</span>
    </div>

    <!-- Route details -->
    <div class="panel-section route-summary-card">
      <div class="metric-group">
        <div class="metric-label">${t("routeLabel")}</div>
        <div class="route-path-display ${routeResult && routeResult.status === "ok" ? "route-active" : ""}">
          ${escapeHtml(routeStr)}
        </div>
      </div>
      <div class="metric-grid-2">
        <div class="metric-card">
          <div class="metric-card-label">${t("chosenExitLabel")}</div>
          <div class="metric-card-value text-emerald">${escapeHtml(chosenExit)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-card-label">${t("totalCostLabel")}</div>
          <div class="metric-card-value text-blue">${escapeHtml(totalCost)}</div>
        </div>
      </div>
    </div>

    <!-- Active Hazards & Undo -->
    <div class="panel-section hazards-section">
      <h3 class="hazards-title">${t("hazardsHeader")}</h3>

      <div class="hazard-category">
        <div class="hazard-cat-title">${t("blockedNodesLabel")} (${blockedNodes.length}):</div>
        <div class="hazard-chips">
          ${
            blockedNodes.length === 0
              ? `<span class="chip-empty">${t("noHazards")}</span>`
              : blockedNodes
                  .map(
                    (id) =>
                      `<button type="button" class="hazard-chip chip-node" data-hazard-type="node" data-id="${id}" title="${t("clickToUndo")}">
                        <span>${escapeHtml(id)}</span> <span class="chip-remove" aria-hidden="true">&times;</span>
                      </button>`
                  )
                  .join("")
          }
        </div>
      </div>

      <div class="hazard-category">
        <div class="hazard-cat-title">${t("blockedEdgesLabel")} (${blockedEdges.length}):</div>
        <div class="hazard-chips">
          ${
            blockedEdges.length === 0
              ? `<span class="chip-empty">${t("noHazards")}</span>`
              : blockedEdges
                  .map(
                    (id) =>
                      `<button type="button" class="hazard-chip chip-edge" data-hazard-type="edge" data-id="${id}" title="${t("clickToUndo")}">
                        <span>${escapeHtml(id)}</span> <span class="chip-remove" aria-hidden="true">&times;</span>
                      </button>`
                  )
                  .join("")
          }
        </div>
      </div>

      <div class="hazard-category">
        <div class="hazard-cat-title">${t("closedExitsLabel")} (${closedExits.length}):</div>
        <div class="hazard-chips">
          ${
            closedExits.length === 0
              ? `<span class="chip-empty">${t("noHazards")}</span>`
              : closedExits
                  .map(
                    (id) =>
                      `<button type="button" class="hazard-chip chip-exit" data-hazard-type="exit" data-id="${id}" title="${t("clickToUndo")}">
                        <span>${escapeHtml(id)}</span> <span class="chip-remove" aria-hidden="true">&times;</span>
                      </button>`
                  )
                  .join("")
          }
        </div>
      </div>
    </div>
  `;

  // Attach chip click handlers to undo hazards
  container.querySelectorAll(".hazard-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.getAttribute("data-hazard-type");
      const id = btn.getAttribute("data-id");
      if (onRemoveHazard) {
        onRemoveHazard(type, id);
      }
    });
  });
}

/**
 * Escapes HTML characters for safe template string interpolation.
 */
function escapeHtml(str) {
  if (typeof str !== "string") return String(str);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
