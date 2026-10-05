/**
 * js/render.js
 * Technical SVG Graph Renderer & Operations Inspector
 * Night-shift control room console with transit timeline and live ghost routing.
 */

import { t, getLanguage } from "./i18n.js";

/**
 * Calculates viewBox bounds to fit all nodes.
 */
export function calculateViewBox(nodes) {
  if (!nodes || nodes.length === 0) {
    return { vx: 0, vy: 0, vw: 800, vh: 600, str: "0 0 800 600" };
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

  const padX = 110;
  const padY = 110;
  const width = Math.max(maxX - minX + padX * 2, 600);
  const height = Math.max(maxY - minY + padY * 2, 450);

  return {
    vx: minX - padX,
    vy: minY - padY,
    vw: width,
    vh: height,
    str: `${minX - padX} ${minY - padY} ${width} ${height}`
  };
}

/**
 * Renders the full technical SVG evacuation map with pan/zoom transform group.
 */
export function renderGraph(svgEl, {
  graph,
  state,
  startId,
  routeResult,
  ghostRoute = null,
  diffRoute = null,
  highlightedSegment = null,
  zoomTransform = { x: 0, y: 0, scale: 1 },
  onNodeClick,
  onEdgeClick,
  onNodeContextMenu,
  onEdgeContextMenu,
  onElementHover
}) {
  if (!svgEl || !graph || !graph.nodes) return;

  svgEl.innerHTML = "";

  const vb = calculateViewBox(graph.nodes);
  svgEl.setAttribute("viewBox", vb.str);
  svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");

  const blockedNodes = new Set(state.blocked_nodes || []);
  const blockedEdges = new Set(state.blocked_edges || []);
  const closedExits = new Set(state.closed_exits || []);

  const routePath = routeResult && routeResult.status === "ok" ? routeResult.path : [];
  const routeNodeSet = new Set(routePath);
  const hasActiveRoute = routePath.length > 0;

  // Route Edge Pairs & Direction
  const routeEdgePairs = new Set();
  const routeDirections = new Map();
  for (let i = 0; i < routePath.length - 1; i++) {
    const u = routePath[i];
    const v = routePath[i + 1];
    const pairKey = u < v ? `${u}:::${v}` : `${v}:::${u}`;
    routeEdgePairs.add(pairKey);
    routeDirections.set(pairKey, { from: u, to: v });
  }

  // Defs: Diagonal Hatch Patterns & Running Figure Glyph
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.innerHTML = `
    <!-- Vermilion Hazard Hatch Pattern -->
    <pattern id="hazardHatchPattern" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="8" stroke="var(--hazard)" stroke-width="2" />
    </pattern>

    <!-- Saffron Closed Exit Hatch Pattern -->
    <pattern id="closedHatchPattern" width="8" height="8" patternTransform="rotate(-45 0 0)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="8" stroke="var(--closed)" stroke-width="2" />
    </pattern>
  `;
  svgEl.appendChild(defs);

  // Zoom/Pan Transform Group
  const rootG = document.createElementNS("http://www.w3.org/2000/svg", "g");
  rootG.setAttribute("id", "viewportTransformGroup");
  rootG.setAttribute("class", hasActiveRoute ? "has-active-route" : "");
  rootG.setAttribute(
    "transform",
    `translate(${zoomTransform.x}, ${zoomTransform.y}) scale(${zoomTransform.scale})`
  );

  // 1. Corner Registration Marks (Tactical blueprint craft)
  const regG = document.createElementNS("http://www.w3.org/2000/svg", "g");
  regG.setAttribute("class", "registration-marks");
  const corners = [
    { x: vb.vx + 28, y: vb.vy + 28 },
    { x: vb.vx + vb.vw - 28, y: vb.vy + 28 },
    { x: vb.vx + 28, y: vb.vy + vb.vh - 28 },
    { x: vb.vx + vb.vw - 28, y: vb.vy + vb.vh - 28 }
  ];
  corners.forEach((c) => {
    const mark = document.createElementNS("http://www.w3.org/2000/svg", "g");
    mark.innerHTML = `
      <line x1="${c.x - 8}" y1="${c.y}" x2="${c.x + 8}" y2="${c.y}" stroke="var(--line-2)" stroke-width="1" />
      <line x1="${c.x}" y1="${c.y - 8}" x2="${c.x}" y2="${c.y + 8}" stroke="var(--line-2)" stroke-width="1" />
    `;
    regG.appendChild(mark);
  });
  rootG.appendChild(regG);

  // 2. Corridors (Edges Layer)
  const nodeMap = new Map();
  graph.nodes.forEach((n) => nodeMap.set(n.id, n));

  const edgesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  edgesGroup.setAttribute("class", "edges-layer");

  graph.edges.forEach((edge) => {
    const fromNode = nodeMap.get(edge.from);
    const toNode = nodeMap.get(edge.to);
    if (!fromNode || !toNode) return;

    const edgeG = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const isBlocked = blockedEdges.has(edge.id);
    const pairKey = edge.from < edge.to ? `${edge.from}:::${edge.to}` : `${edge.to}:::${edge.from}`;
    const isInRoute = routeEdgePairs.has(pairKey);
    const isHighlighted = highlightedSegment &&
      ((highlightedSegment.from === edge.from && highlightedSegment.to === edge.to) ||
       (highlightedSegment.from === edge.to && highlightedSegment.to === edge.from));

    let edgeClass = "edge-item dimmable";
    if (isBlocked) edgeClass += " edge-blocked";
    if (isInRoute) edgeClass += " in-route";
    if (isHighlighted) edgeClass += " highlighted-segment";

    edgeG.setAttribute("class", edgeClass);
    edgeG.setAttribute("data-edge-id", edge.id);
    edgeG.setAttribute("tabindex", "0");
    edgeG.setAttribute("role", "button");
    edgeG.setAttribute("aria-label", `Corridor ${edge.id} connecting ${edge.from} and ${edge.to}, cost ${edge.cost}${isBlocked ? " (BLOCKED)" : ""}`);

    // Wide transparent hit area (24px)
    const hitLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    hitLine.setAttribute("x1", fromNode.x);
    hitLine.setAttribute("y1", fromNode.y);
    hitLine.setAttribute("x2", toNode.x);
    hitLine.setAttribute("y2", toNode.y);
    hitLine.setAttribute("stroke", "transparent");
    hitLine.setAttribute("stroke-width", "24");
    hitLine.setAttribute("class", "edge-hitarea");

    // Base hairline (1.5px --line-2)
    const baseLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    baseLine.setAttribute("x1", fromNode.x);
    baseLine.setAttribute("y1", fromNode.y);
    baseLine.setAttribute("x2", toNode.x);
    baseLine.setAttribute("y2", toNode.y);
    baseLine.setAttribute("class", "edge-baseline");

    edgeG.appendChild(hitLine);
    edgeG.appendChild(baseLine);

    edgesGroup.appendChild(edgeG);
  });

  rootG.appendChild(edgesGroup);

  // 3. Diff Ghost Route (Faint ghost of previous route for 1.2s)
  if (diffRoute && diffRoute.length > 1) {
    const diffD = diffRoute
      .map((id, idx) => {
        const n = nodeMap.get(id);
        return idx === 0 ? `M ${n.x} ${n.y}` : `L ${n.x} ${n.y}`;
      })
      .join(" ");

    const diffPathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
    diffPathEl.setAttribute("class", "diff-fading-path");
    diffPathEl.setAttribute("d", diffD);
    rootG.appendChild(diffPathEl);
  }

  // 4. Hover Ghost Preview Route (Dashed lime line before click in hazard mode)
  if (ghostRoute && ghostRoute.length > 1) {
    const ghostD = ghostRoute
      .map((id, idx) => {
        const n = nodeMap.get(id);
        return idx === 0 ? `M ${n.x} ${n.y}` : `L ${n.x} ${n.y}`;
      })
      .join(" ");

    const ghostPathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
    ghostPathEl.setAttribute("class", "ghost-route-path");
    ghostPathEl.setAttribute("d", ghostD);
    rootG.appendChild(ghostPathEl);
  }

  // 5. Active Egress Route (Hi-Vis Lime 4px)
  if (routePath.length > 1) {
    const routeD = routePath
      .map((id, idx) => {
        const n = nodeMap.get(id);
        return idx === 0 ? `M ${n.x} ${n.y}` : `L ${n.x} ${n.y}`;
      })
      .join(" ");

    const routePathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
    routePathEl.setAttribute("class", "route-svg-path");
    routePathEl.setAttribute("d", routeD);

    try {
      const len = routePathEl.getTotalLength();
      routePathEl.style.strokeDasharray = `${len}`;
      routePathEl.style.strokeDashoffset = `${len}`;
      rootG.appendChild(routePathEl);
      requestAnimationFrame(() => {
        routePathEl.style.strokeDashoffset = "0";
      });
    } catch (_) {
      rootG.appendChild(routePathEl);
    }
  }

  // 6. Direction Chevrons along route (rendered on top of route line, offset from midpoints)
  const chevronsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  chevronsGroup.setAttribute("class", "route-chevrons-layer");
  chevronsGroup.setAttribute("pointer-events", "none");

  routeEdgePairs.forEach((pairKey) => {
    const dir = routeDirections.get(pairKey);
    if (!dir) return;
    const p1 = nodeMap.get(dir.from);
    const p2 = nodeMap.get(dir.to);
    if (!p1 || !p2) return;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 52) return;

    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const ux = dx / dist;
    const uy = dy / dist;

    // Offset chevron 26px ahead along the direction of egress
    // so it never overlaps the cost pill badge at (midX, midY)
    const offset = Math.min(26, (dist / 2) - 16);
    const chevX = midX + ux * offset;
    const chevY = midY + uy * offset;

    const chevronG = document.createElementNS("http://www.w3.org/2000/svg", "g");
    chevronG.setAttribute("transform", `translate(${chevX}, ${chevY}) rotate(${angle})`);
    chevronG.innerHTML = `
      <polygon class="route-chevron" points="-4,-4 3,0 -4,4 -2,0" />
    `;
    chevronsGroup.appendChild(chevronG);
  });
  rootG.appendChild(chevronsGroup);

  // 7. Edge Badges & Cost Pills (Rendered ON TOP of route line so numbers are NEVER covered!)
  const edgeBadgesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  edgeBadgesGroup.setAttribute("class", "edge-badges-layer");

  graph.edges.forEach((edge) => {
    const fromNode = nodeMap.get(edge.from);
    const toNode = nodeMap.get(edge.to);
    if (!fromNode || !toNode) return;

    const isBlocked = blockedEdges.has(edge.id);
    const pairKey = edge.from < edge.to ? `${edge.from}:::${edge.to}` : `${edge.to}:::${edge.from}`;
    const isInRoute = routeEdgePairs.has(pairKey);
    const isHighlighted = highlightedSegment &&
      ((highlightedSegment.from === edge.from && highlightedSegment.to === edge.to) ||
       (highlightedSegment.from === edge.to && highlightedSegment.to === edge.from));

    const midX = (fromNode.x + toNode.x) / 2;
    const midY = (fromNode.y + toNode.y) / 2;

    const badgeG = document.createElementNS("http://www.w3.org/2000/svg", "g");
    let badgeClass = "edge-badge-item dimmable";
    if (isBlocked) badgeClass += " edge-blocked";
    if (isInRoute) badgeClass += " in-route";
    if (isHighlighted) badgeClass += " highlighted-segment";

    badgeG.setAttribute("class", badgeClass);
    badgeG.setAttribute("data-edge-id", edge.id);
    badgeG.setAttribute("transform", `translate(${midX}, ${midY})`);
    badgeG.setAttribute("role", "button");
    badgeG.setAttribute("tabindex", "0");
    badgeG.setAttribute(
      "aria-label",
      `Corridor ${edge.id} connecting ${edge.from} and ${edge.to}, cost ${edge.cost}${isBlocked ? " (BLOCKED)" : ""}`
    );
    badgeG.style.cursor = "pointer";

    if (isBlocked) {
      // Small vermilion 'x' at midpoint
      badgeG.innerHTML = `
        <circle cx="0" cy="0" r="8" fill="var(--surface)" stroke="var(--hazard)" stroke-width="1.6" />
        <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" stroke="var(--hazard)" stroke-width="1.8" stroke-linecap="round" />
        <line x1="3.5" y1="-3.5" x2="-3.5" y2="3.5" stroke="var(--hazard)" stroke-width="1.8" stroke-linecap="round" />
      `;
    } else {
      // Clean, solid, readable cost badge pill
      const textVal = String(edge.cost);
      const pillW = Math.max(22, textVal.length * 8 + 10);
      const pillH = 15;

      const pillBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      pillBg.setAttribute("class", "edge-cost-rect");
      pillBg.setAttribute("x", String(-pillW / 2));
      pillBg.setAttribute("y", String(-pillH / 2));
      pillBg.setAttribute("width", String(pillW));
      pillBg.setAttribute("height", String(pillH));
      pillBg.setAttribute("rx", "4");

      const pillTxt = document.createElementNS("http://www.w3.org/2000/svg", "text");
      pillTxt.setAttribute("class", "edge-cost-text");
      pillTxt.setAttribute("text-anchor", "middle");
      pillTxt.setAttribute("dominant-baseline", "central");
      pillTxt.textContent = textVal;

      badgeG.appendChild(pillBg);
      badgeG.appendChild(pillTxt);
    }

    // Interactive event handlers
    badgeG.addEventListener("click", (e) => {
      e.stopPropagation();
      if (onEdgeClick) onEdgeClick(edge.id, e);
    });

    badgeG.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (onEdgeContextMenu) onEdgeContextMenu(edge.id, e);
    });

    badgeG.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (onEdgeClick) onEdgeClick(edge.id, e);
      }
    });

    badgeG.addEventListener("mouseenter", (e) => {
      if (onElementHover) {
        onElementHover({
          type: "edge",
          id: edge.id,
          label: `${edge.from} ↔ ${edge.to}`,
          cost: edge.cost,
          status: isBlocked ? "Blocked Corridor" : "Nominal",
          evt: e
        });
      }
    });

    badgeG.addEventListener("mouseleave", () => {
      if (onElementHover) onElementHover(null);
    });

    edgeBadgesGroup.appendChild(badgeG);
  });

  rootG.appendChild(edgeBadgesGroup);

  // 8. Nodes Layer
  const nodesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  nodesGroup.setAttribute("class", "nodes-layer");

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

    let nodeClasses = `node-g node-${node.type} dimmable`;
    if (isStart) nodeClasses += " node-is-start in-route";
    if (isBlocked) nodeClasses += " node-is-blocked";
    if (isClosedExit) nodeClasses += " node-is-closed-exit";
    if (isInRoute) nodeClasses += " node-in-route in-route";

    nodeG.setAttribute("class", nodeClasses);

    // ARIA Label
    let stateLabel = "Nominal";
    if (isBlocked) stateLabel = "Blocked Hazard";
    else if (isClosedExit) stateLabel = "Closed Exit";
    else if (isStart) stateLabel = "Start Origin";
    else if (isInRoute) stateLabel = "Active Egress Waypoint";

    nodeG.setAttribute("aria-label", `${node.type.toUpperCase()} ${node.id} (${node.label}), state: ${stateLabel}`);

    // If start node: Bone double ring + single pulse + START badge
    if (isStart) {
      const outerRing = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      outerRing.setAttribute("class", "start-outer-ring");
      outerRing.setAttribute("r", "28");
      nodeG.appendChild(outerRing);

      const pulseRing = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      pulseRing.setAttribute("class", "start-pulse-single");
      pulseRing.setAttribute("r", "28");
      nodeG.appendChild(pulseRing);

      const startTag = document.createElementNS("http://www.w3.org/2000/svg", "g");
      startTag.setAttribute("transform", "translate(0, -28)");
      startTag.innerHTML = `
        <rect class="start-tag-rect" x="-18" y="-7" width="36" height="14" rx="3" />
        <text class="start-tag-text" x="0" y="3" text-anchor="middle">START</text>
      `;
      nodeG.appendChild(startTag);
    }

    // Node Geometric Shapes
    if (node.type === "room") {
      // Room: Rounded square (6px radius, 1px border)
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("class", "node-shape-room");
      rect.setAttribute("x", "-20");
      rect.setAttribute("y", "-20");
      rect.setAttribute("width", "40");
      rect.setAttribute("height", "40");
      rect.setAttribute("rx", "6");
      nodeG.appendChild(rect);

      const idText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      idText.setAttribute("class", "node-id-text");
      idText.setAttribute("text-anchor", "middle");
      idText.setAttribute("dominant-baseline", "central");
      idText.textContent = node.id;
      nodeG.appendChild(idText);

      const sublabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
      sublabel.setAttribute("class", "node-label-subtext");
      sublabel.setAttribute("x", "0");
      sublabel.setAttribute("y", "30");
      sublabel.setAttribute("text-anchor", "middle");
      sublabel.textContent = node.label;
      nodeG.appendChild(sublabel);
    } else if (node.type === "junction") {
      // Junction: 10px Circle
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("class", "node-shape-junction");
      circle.setAttribute("r", "10");
      nodeG.appendChild(circle);

      const idText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      idText.setAttribute("class", "node-id-text");
      idText.setAttribute("text-anchor", "middle");
      idText.setAttribute("dominant-baseline", "central");
      idText.textContent = node.id;
      nodeG.appendChild(idText);

      const sublabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
      sublabel.setAttribute("class", "node-label-subtext");
      sublabel.setAttribute("x", "0");
      sublabel.setAttribute("y", "20");
      sublabel.setAttribute("text-anchor", "middle");
      sublabel.textContent = node.label;
      nodeG.appendChild(sublabel);
    } else if (node.type === "exit") {
      // Exit: Jade-teal pill with SVG running-figure + arrow glyph
      const exitRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      exitRect.setAttribute("class", "node-shape-exit");
      exitRect.setAttribute("x", "-32");
      exitRect.setAttribute("y", "-16");
      exitRect.setAttribute("width", "64");
      exitRect.setAttribute("height", "32");
      exitRect.setAttribute("rx", "16");
      nodeG.appendChild(exitRect);

      // Running figure + arrow icon
      const exitGlyph = document.createElementNS("http://www.w3.org/2000/svg", "g");
      exitGlyph.setAttribute("transform", "translate(-24, -9)");
      exitGlyph.innerHTML = `
        <svg viewBox="0 0 16 18" width="14" height="18" class="exit-icon-glyph">
          <circle cx="8" cy="3" r="2.2" />
          <path d="M8 6 L8 12 M8 8 L4 10 M8 8 L12 10 M8 12 L5 16 M8 12 L11 16" stroke="var(--exit-ink)" stroke-width="1.6" stroke-linecap="round" fill="none" />
        </svg>
      `;
      nodeG.appendChild(exitGlyph);

      const exitLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
      exitLabel.setAttribute("class", "exit-sign-label");
      exitLabel.setAttribute("x", "8");
      exitLabel.setAttribute("y", "2");
      exitLabel.setAttribute("text-anchor", "middle");
      exitLabel.textContent = node.id;
      nodeG.appendChild(exitLabel);

      if (isClosedExit) {
        // Saffron CLOSED micro-badge
        const closedBadge = document.createElementNS("http://www.w3.org/2000/svg", "g");
        closedBadge.setAttribute("transform", "translate(0, 24)");
        closedBadge.innerHTML = `
          <rect class="closed-exit-badge-rect" x="-22" y="-7" width="44" height="14" rx="3" />
          <text class="closed-exit-badge-text" x="0" y="3" text-anchor="middle">${getLanguage() === "bn" ? "বন্ধ" : "CLOSED"}</text>
        `;
        nodeG.appendChild(closedBadge);
      } else {
        const sublabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        sublabel.setAttribute("class", "node-label-subtext");
        sublabel.setAttribute("x", "0");
        sublabel.setAttribute("y", "26");
        sublabel.setAttribute("text-anchor", "middle");
        sublabel.textContent = node.label;
        nodeG.appendChild(sublabel);
      }
    }

    // Events
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

    nodeG.addEventListener("mouseenter", (e) => {
      if (onElementHover) {
        onElementHover({
          type: "node",
          id: node.id,
          label: node.label,
          nodeType: node.type,
          x: node.x,
          y: node.y,
          status: isBlocked ? "Blocked Hazard" : isClosedExit ? "Closed Exit" : isStart ? "Start Origin" : "Nominal",
          evt: e
        });
      }
    });

    nodeG.addEventListener("mouseleave", () => {
      if (onElementHover) onElementHover(null);
    });

    nodesGroup.appendChild(nodeG);
  });

  rootG.appendChild(nodesGroup);
  svgEl.appendChild(rootG);
}

/**
 * Renders the Operations Inspector & Status Console.
 */
export function renderInspector(container, consoleEl, {
  graph,
  state,
  startId,
  routeResult,
  activeMode,
  costDelta = null,
  onModeChange,
  onRemoveHazard,
  onClearGroup,
  onTransitHover,
  onUnblockStart
}) {
  if (!container) return;

  const blockedNodes = state.blocked_nodes || [];
  const blockedEdges = state.blocked_edges || [];
  const closedExits = state.closed_exits || [];

  const nodeMap = new Map();
  if (graph && graph.nodes) {
    graph.nodes.forEach((n) => nodeMap.set(n.id, n));
  }

  // Calculate per-segment timeline rows
  const timelineStops = [];
  let totalCost = 0;

  if (routeResult && routeResult.status === "ok" && routeResult.path && graph) {
    const path = routeResult.path;
    totalCost = routeResult.cost;

    for (let i = 0; i < path.length; i++) {
      const curId = path[i];
      const node = nodeMap.get(curId);
      let segCost = 0;
      let prevId = null;

      if (i > 0) {
        prevId = path[i - 1];
        const edge = graph.edges.find(
          (e) => (e.from === prevId && e.to === curId) || (e.from === curId && e.to === prevId)
        );
        segCost = edge ? edge.cost : 0;
      }

      timelineStops.push({
        id: curId,
        label: node ? node.label : "",
        type: node ? node.type : "room",
        isOrigin: i === 0,
        isEgress: i === path.length - 1,
        prevId: prevId,
        segCost: segCost
      });
    }
  }

  // 1. Inspector Panel Rendering
  container.innerHTML = `
    <!-- Section 1: Dispatch Mode -->
    <div class="inspector-sec">
      <div class="sec-micro-title">
        <span>${t("modeSection")}</span>
      </div>
      <div class="segmented-control" style="width: 100%;">
        <button type="button" id="btnModeSelect" class="seg-btn ${activeMode === "select" ? "active" : ""}" style="flex: 1;" aria-pressed="${activeMode === "select"}">
          <span>${t("modeSelectStart")}</span>
          <span class="key-badge">S</span>
        </button>
        <button type="button" id="btnModeHazard" class="seg-btn ${activeMode === "hazard" ? "active" : ""}" style="flex: 1;" aria-pressed="${activeMode === "hazard"}">
          <span>${t("modeToggleHazard")}</span>
          <span class="key-badge">H</span>
        </button>
      </div>
    </div>

    <!-- Section 2: Route Transit Timeline -->
    <div class="inspector-sec">
      <div class="sec-micro-title">
        <span>${t("secTransit")}</span>
      </div>
      ${
        timelineStops.length > 0
          ? `
            <div class="transit-timeline">
              ${timelineStops
                .map(
                  (stop, idx) => `
                <div class="transit-row ${stop.isOrigin ? "is-origin" : ""} ${stop.isEgress ? "is-egress" : ""}" data-from="${stop.prevId || ""}" data-to="${stop.id}">
                  <div class="transit-node-info">
                    <span class="transit-id">${escapeHtml(stop.id)}</span>
                    <span class="transit-label">${escapeHtml(stop.label)}</span>
                  </div>
                  <div class="transit-cost mono">
                    ${idx === 0 ? `<span class="key-badge">${t("stepOrigin")}</span>` : `+${stop.segCost}`}
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
            <div class="transit-total-bar">
              <span>${t("totalPathCost")}</span>
              <span class="transit-total-figure">${totalCost}</span>
            </div>
          `
          : `
            <div style="font-size: 13px; color: var(--text-2); padding: 8px 0;">
              ${
                !startId
                  ? t("statusNoStart")
                  : routeResult && routeResult.status === "start_blocked"
                  ? `<div style="color: var(--closed); font-weight: 600; margin-bottom: 6px;">${t("statusStartBlocked")}</div>
                     <button type="button" id="btnInspUnblockStart" class="btn btn-primary" style="height: 28px; font-size: 11px;">${t("unblockStartAction")}</button>`
                  : `<div style="color: var(--hazard); font-weight: 600;">${t("statusNoRoute")}</div>`
              }
            </div>
          `
      }
    </div>

    <!-- Section 3: Active Restrictions (Hazard Manager) -->
    <div class="inspector-sec">
      <div class="sec-micro-title">
        <span>${t("secHazards")}</span>
      </div>

      <!-- Blocked Locations -->
      <div class="hazard-category-box">
        <div class="hazard-cat-header">
          <span>${t("subLocations")} (${blockedNodes.length})</span>
          ${blockedNodes.length > 0 ? `<button type="button" class="btn-clear-sub" data-clear="nodes">${t("clearAll")}</button>` : ""}
        </div>
        <div class="hazard-chips-wrap">
          ${
            blockedNodes.length === 0
              ? `<span class="empty-hazards-text">${t("noHazardsActive")}</span>`
              : blockedNodes
                  .map(
                    (id) => `
                <button type="button" class="hazard-chip-removable chip-node" data-type="node" data-id="${id}" title="Remove restriction">
                  <span>${escapeHtml(id)}</span> <span class="chip-x-icon">&times;</span>
                </button>
              `
                  )
                  .join("")
          }
        </div>
      </div>

      <!-- Blocked Corridors -->
      <div class="hazard-category-box">
        <div class="hazard-cat-header">
          <span>${t("subCorridors")} (${blockedEdges.length})</span>
          ${blockedEdges.length > 0 ? `<button type="button" class="btn-clear-sub" data-clear="edges">${t("clearAll")}</button>` : ""}
        </div>
        <div class="hazard-chips-wrap">
          ${
            blockedEdges.length === 0
              ? `<span class="empty-hazards-text">–</span>`
              : blockedEdges
                  .map(
                    (id) => `
                <button type="button" class="hazard-chip-removable chip-edge" data-type="edge" data-id="${id}" title="Remove restriction">
                  <span>${escapeHtml(id)}</span> <span class="chip-x-icon">&times;</span>
                </button>
              `
                  )
                  .join("")
          }
        </div>
      </div>

      <!-- Closed Exits -->
      <div class="hazard-category-box">
        <div class="hazard-cat-header">
          <span>${t("subExits")} (${closedExits.length})</span>
          ${closedExits.length > 0 ? `<button type="button" class="btn-clear-sub" data-clear="exits">${t("clearAll")}</button>` : ""}
        </div>
        <div class="hazard-chips-wrap">
          ${
            closedExits.length === 0
              ? `<span class="empty-hazards-text">–</span>`
              : closedExits
                  .map(
                    (id) => `
                <button type="button" class="hazard-chip-removable chip-exit" data-type="exit" data-id="${id}" title="Remove restriction">
                  <span>${escapeHtml(id)}</span> <span class="chip-x-icon">&times;</span>
                </button>
              `
                  )
                  .join("")
          }
        </div>
      </div>
    </div>

    <!-- Section 4: Signage Reference Legend -->
    <div class="inspector-sec">
      <div class="sec-micro-title">
        <span>${t("secLegend")}</span>
      </div>
      <div class="legend-items-grid">
        <div class="legend-item-line"><div class="glyph-box box-room"></div><span>${t("legendRoom")}</span></div>
        <div class="legend-item-line"><div class="glyph-box box-junction"></div><span>${t("legendJunction")}</span></div>
        <div class="legend-item-line"><div class="glyph-box box-exit"></div><span>${t("legendExit")}</span></div>
        <div class="legend-item-line"><div class="glyph-box box-route"></div><span>${t("legendRoute")}</span></div>
        <div class="legend-item-line"><div class="glyph-box box-hazard"></div><span>${t("legendHazard")}</span></div>
        <div class="legend-item-line"><div class="glyph-box box-closed"></div><span>${t("legendClosed")}</span></div>
      </div>
    </div>

    <!-- Section 5: System Telemetry -->
    <div class="inspector-sec">
      <div class="sec-micro-title">
        <span>${t("secMeta")}</span>
      </div>
      <div class="telemetry-grid">
        <span class="telemetry-k">${t("metaBuilding")}:</span>
        <span class="telemetry-v">${escapeHtml(graph ? graph.building : "–")}</span>
        <span class="telemetry-k">${t("metaNodes")}:</span>
        <span class="telemetry-v">${graph && graph.nodes ? graph.nodes.length : 0}</span>
        <span class="telemetry-k">${t("metaEdges")}:</span>
        <span class="telemetry-v">${graph && graph.edges ? graph.edges.length : 0}</span>
        <span class="telemetry-k">${t("metaState")}:</span>
        <span class="telemetry-v" style="color: var(--route);">${t("metaStateNormal")}</span>
      </div>
    </div>
  `;

  // Attach Mode clicks
  const btnSel = container.querySelector("#btnModeSelect");
  const btnHaz = container.querySelector("#btnModeHazard");
  if (btnSel && btnHaz) {
    btnSel.addEventListener("click", () => onModeChange("select"));
    btnHaz.addEventListener("click", () => onModeChange("hazard"));
  }

  // Attach Transit Row Hover
  container.querySelectorAll(".transit-row").forEach((row) => {
    row.addEventListener("mouseenter", () => {
      const from = row.getAttribute("data-from");
      const to = row.getAttribute("data-to");
      if (from && to && onTransitHover) onTransitHover({ from, to });
    });
    row.addEventListener("mouseleave", () => {
      if (onTransitHover) onTransitHover(null);
    });
  });

  // Attach Hazard Chip Removal
  container.querySelectorAll(".hazard-chip-removable").forEach((chip) => {
    chip.addEventListener("click", () => {
      const type = chip.getAttribute("data-type");
      const id = chip.getAttribute("data-id");
      if (onRemoveHazard) onRemoveHazard(type, id);
    });
  });

  // Attach Clear All Group
  container.querySelectorAll(".btn-clear-sub").forEach((btn) => {
    btn.addEventListener("click", () => {
      const grp = btn.getAttribute("data-clear");
      if (onClearGroup) onClearGroup(grp);
    });
  });

  // Attach Unblock Start CTA inside timeline if present
  const btnUnblock = container.querySelector("#btnInspUnblockStart");
  if (btnUnblock && onUnblockStart) {
    btnUnblock.addEventListener("click", onUnblockStart);
  }

  // 2. Terminal Bottom Console (40px)
  if (consoleEl) {
    let consoleClass = "";
    let contentMarkup = "";

    if (!startId) {
      contentMarkup = `<span>${t("statusNoStart")}</span>`;
    } else if (routeResult) {
      if (routeResult.status === "start_blocked") {
        consoleClass = "console-amber";
        contentMarkup = `
          <span style="font-weight: 700;">${t("statusStartBlocked")}</span>
          <span>·</span>
          <button type="button" id="btnConsoleUnblock" class="btn" style="height: 22px; padding: 0 8px; font-size: 11px; background: rgba(0,0,0,0.25); border: none; color: inherit; font-family: var(--font-mono); font-weight: 600; cursor: pointer;">${t("unblockStartAction")}</button>
        `;
      } else if (routeResult.status === "no_route") {
        consoleClass = "console-hazard";
        contentMarkup = `
          <span style="font-weight: 700;">${t("statusNoRoute")}</span>
        `;
      } else if (routeResult.status === "ok") {
        const pathStr = routeResult.path.join(" → ");
        let deltaHtml = "";
        if (costDelta) {
          deltaHtml = `<span class="console-delta-badge">${costDelta}</span>`;
        }

        contentMarkup = `
          <span>${t("statusConsoleRoute")} <strong>${escapeHtml(pathStr)}</strong></span>
          <span>·</span>
          <span>${t("statusConsoleExit")} <strong>${escapeHtml(routeResult.exit)}</strong></span>
          <span>·</span>
          <span>${t("statusConsoleCost")} <strong>${routeResult.cost}</strong></span>
          ${deltaHtml}
        `;
      }
    }

    consoleEl.className = `status-console ${consoleClass}`;
    consoleEl.innerHTML = `
      <div class="console-readout">${contentMarkup}</div>
      <div style="font-size: 11px; font-family: var(--font-mono); color: var(--text-2);">
        <span>${escapeHtml(graph ? graph.building : "")}</span>
      </div>
    `;

    const btnUnblockConsole = consoleEl.querySelector("#btnConsoleUnblock");
    if (btnUnblockConsole && onUnblockStart) {
      btnUnblockConsole.addEventListener("click", onUnblockStart);
    }
  }
}

function escapeHtml(str) {
  if (typeof str !== "string") return String(str);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
