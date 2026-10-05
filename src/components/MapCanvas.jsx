/**
 * src/components/MapCanvas.jsx
 * Pan/zoom SVG canvas with dot-grid, technical registration marks,
 * failure state overlays, and interactive hazard/route nodes.
 */

import React, { useRef, useState, useEffect, useCallback } from "react";
import Node from "./Node.jsx";
import Edge from "./Edge.jsx";
import RouteLayer from "./RouteLayer.jsx";
import Walker from "./Walker.jsx";
import { calculateBounds } from "../core/graph.js";
import { t } from "../core/i18n.js";

export default function MapCanvas({
  graph,
  state,
  start,
  route,
  previousRoute,
  hoverPreview,
  mode,
  lang,
  walkerEnabled,
  walkerPlaying,
  walkerSpeed,
  activeTimelineIndex,
  highlightedElement,
  actions
}) {
  const containerRef = useRef(null);
  const routePathRef = useRef(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 800, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState(null); // { x, y, content }
  const [shakingStart, setShakingStart] = useState(false);

  // Trigger start node shake if status is start_blocked
  useEffect(() => {
    if (route?.status === "start_blocked") {
      setShakingStart(true);
      const timer = setTimeout(() => setShakingStart(false), 300);
      return () => clearTimeout(timer);
    }
  }, [route?.status, start]);

  // Auto-fit function
  const handleFit = useCallback(() => {
    if (!graph || !graph.nodes || graph.nodes.length === 0) return;
    const bounds = calculateBounds(graph.nodes, 60);
    const container = containerRef.current;
    if (!container) {
      setViewBox({ x: bounds.minX, y: bounds.minY, width: bounds.width, height: bounds.height });
      return;
    }

    const { clientWidth, clientHeight } = container;
    const aspectContainer = clientWidth / (clientHeight || 1);
    const aspectGraph = bounds.width / bounds.height;

    let w = bounds.width;
    let h = bounds.height;
    let x = bounds.minX;
    let y = bounds.minY;

    if (aspectContainer > aspectGraph) {
      // Container is wider
      w = bounds.height * aspectContainer;
      x = bounds.centerX - w / 2;
    } else {
      // Container is taller
      h = bounds.width / aspectContainer;
      y = bounds.centerY - h / 2;
    }

    setViewBox({ x, y, width: w, height: h });
  }, [graph]);

  // Auto-fit on graph load
  useEffect(() => {
    handleFit();
  }, [graph, handleFit]);

  // Listen for 'F' hotkey to fit
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        handleFit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFit]);

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const cursorClientX = e.clientX - rect.left;
    const cursorClientY = e.clientY - rect.top;

    // SVG coordinates of cursor
    const cursorSvgX = viewBox.x + (cursorClientX / rect.width) * viewBox.width;
    const cursorSvgY = viewBox.y + (cursorClientY / rect.height) * viewBox.height;

    const zoomFactor = e.deltaY < 0 ? 0.88 : 1.14;
    const newWidth = Math.min(2400, Math.max(150, viewBox.width * zoomFactor));
    const newHeight = Math.min(1800, Math.max(110, viewBox.height * zoomFactor));

    const newX = cursorSvgX - (cursorClientX / rect.width) * newWidth;
    const newY = cursorSvgY - (cursorClientY / rect.height) * newHeight;

    setViewBox({ x: newX, y: newY, width: newWidth, height: newHeight });
  };

  // Zoom button handler
  const handleZoom = (factor) => {
    const newWidth = Math.min(2400, Math.max(150, viewBox.width * factor));
    const newHeight = Math.min(1800, Math.max(110, viewBox.height * factor));
    const cx = viewBox.x + viewBox.width / 2;
    const cy = viewBox.y + viewBox.height / 2;

    setViewBox({
      x: cx - newWidth / 2,
      y: cy - newHeight / 2,
      width: newWidth,
      height: newHeight
    });
  };

  // Pan dragging
  const handlePointerDown = (e) => {
    if (e.button !== 0 && e.button !== 1) return; // Only left or middle button pans canvas background
    if (e.target.closest(".map-node-group") || e.target.closest(".map-edge-group")) return;

    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    const container = containerRef.current;
    if (!container) return;

    const scaleX = viewBox.width / container.clientWidth;
    const scaleY = viewBox.height / container.clientHeight;

    setViewBox((vb) => ({
      ...vb,
      x: vb.x - dx * scaleX,
      y: vb.y - dy * scaleY
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Node & Edge interaction handlers
  const handleNodeClick = (node, e) => {
    if (mode === "select") {
      if (node.type === "exit") {
        actions.showToast({ messageKey: "exitCannotBeStart", params: {}, showUndo: false });
        return;
      }
      if (state.blocked_nodes.includes(node.id)) {
        actions.showToast({ messageKey: "startNodeIsBlocked", params: {}, showUndo: false });
        return;
      }
      actions.setStart(node.id);
    } else {
      // Hazard mode
      actions.toggleHazard({
        type: node.type === "exit" ? "exit" : "node",
        id: node.id
      });
    }
  };

  const handleEdgeClick = (edge, e) => {
    if (mode === "hazard" || e.button === 2) {
      actions.toggleHazard({ type: "edge", id: edge.id });
    }
  };

  // Hover item for predicted cost change
  const handleHover = (type, item, e) => {
    actions.setHoverItem({ type, id: item.id });

    // Show tooltip
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const tooltipX = e.clientX - rect.left + 12;
    const tooltipY = e.clientY - rect.top + 12;

    let predictionText = "";
    if (mode === "hazard" && hoverPreview) {
      if (hoverPreview.status === "no_route") {
        predictionText = "⚠️ " + t(lang, "statusNoRoute");
      } else if (hoverPreview.cost !== undefined && route?.cost !== undefined) {
        const diff = hoverPreview.cost - route.cost;
        const sign = diff > 0 ? `+${diff}` : diff === 0 ? "±0" : `${diff}`;
        predictionText = `Predicted: ${hoverPreview.cost} (${sign})`;
      }
    }

    setTooltip({
      x: tooltipX,
      y: tooltipY,
      id: item.id,
      label: item.label || `Corridor ${item.id}`,
      type: type,
      status: state.blocked_nodes.includes(item.id) || state.blocked_edges.includes(item.id) || state.closed_exits.includes(item.id)
        ? "BLOCKED"
        : "CLEAR",
      prediction: predictionText
    });
  };

  const handleHoverLeave = () => {
    actions.setHoverItem(null);
    setTooltip(null);
  };

  const nodeMap = new Map();
  graph?.nodes?.forEach((n) => nodeMap.set(n.id, n));

  const hasActiveRoute = route?.status === "ok";

  return (
    <div
      ref={containerRef}
      className="canvas-wrapper"
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <svg
        className={`map-canvas-svg ${mode === "hazard" ? "mode-hazard" : "mode-start"} ${
          isDragging ? "is-dragging" : ""
        } ${hasActiveRoute ? "has-active-route" : ""}`}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Dot Grid Pattern (20px spacing in --line) */}
          <pattern
            id="dot-grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="10" cy="10" r="1.2" fill="var(--line)" opacity="0.8" />
          </pattern>

          {/* Vermilion Hazard Hatch Pattern */}
          <pattern
            id="hazard-hatch"
            width="8"
            height="8"
            patternTransform="rotate(45)"
            patternUnits="userSpaceOnUse"
          >
            <rect width="8" height="8" fill="var(--surface)" />
            <line x1="0" y1="0" x2="0" y2="8" stroke="var(--hazard)" strokeWidth="2.5" />
          </pattern>

          {/* Saffron Closed Exit Hatch Pattern */}
          <pattern
            id="closed-hatch"
            width="8"
            height="8"
            patternTransform="rotate(45)"
            patternUnits="userSpaceOnUse"
          >
            <rect width="8" height="8" fill="var(--surface)" />
            <line x1="0" y1="0" x2="0" y2="8" stroke="var(--closed)" strokeWidth="2.5" />
          </pattern>
        </defs>

        {/* 1. Dot Grid Background */}
        <rect
          x={viewBox.x - 500}
          y={viewBox.y - 500}
          width={viewBox.width + 1000}
          height={viewBox.height + 1000}
          fill="url(#dot-grid)"
        />

        {/* 2. Technical Drawing Corner Registration Marks */}
        {graph && (
          <g opacity="0.35" stroke="var(--line-2)" strokeWidth="1">
            <line x1="20" y1="10" x2="20" y2="30" />
            <line x1="10" y1="20" x2="30" y2="20" />
            <line x1="780" y1="10" x2="780" y2="30" />
            <line x1="770" y1="20" x2="790" y2="20" />
          </g>
        )}

        {/* 3. Edges Line Layer */}
        <g className="edges-layer">
          {graph?.edges?.map((edge) => {
            const fromNode = nodeMap.get(edge.from);
            const toNode = nodeMap.get(edge.to);
            const isBlocked = state.blocked_edges.includes(edge.id);
            const isOnRoute = route?.edges?.includes(edge.id);
            const isHighlighted = highlightedElement === edge.id;

            return (
              <Edge
                key={`line-${edge.id}`}
                edge={edge}
                fromNode={fromNode}
                toNode={toNode}
                isBlocked={isBlocked}
                isOnRoute={isOnRoute}
                isHighlighted={isHighlighted}
                mode={mode}
                renderPart="line"
                onClick={(e) => handleEdgeClick(edge, e)}
                onContextMenu={(e) => {
                  actions.toggleHazard({ type: "edge", id: edge.id });
                }}
                onMouseEnter={(e) => handleHover("edge", edge, e)}
                onMouseLeave={handleHoverLeave}
              />
            );
          })}
        </g>

        {/* 4. Evacuation Route Layer */}
        <RouteLayer
          pathRef={routePathRef}
          renderWalker={false}
          graph={graph}
          route={route}
          previousRoute={previousRoute}
          hoverPreview={hoverPreview}
          walkerEnabled={walkerEnabled}
          walkerPlaying={walkerPlaying}
          walkerSpeed={walkerSpeed}
          activeTimelineIndex={activeTimelineIndex}
          onNodePassed={(idx) => actions.setActiveTimelineIndex(idx)}
        />

        {/* 5. Edge Cost Badges Layer (Rendered ON TOP of RouteLayer so numbers are NEVER covered!) */}
        <g className="edge-badges-layer">
          {graph?.edges?.map((edge) => {
            const fromNode = nodeMap.get(edge.from);
            const toNode = nodeMap.get(edge.to);
            const isBlocked = state.blocked_edges.includes(edge.id);
            const isOnRoute = route?.edges?.includes(edge.id);
            const isHighlighted = highlightedElement === edge.id;

            return (
              <Edge
                key={`badge-${edge.id}`}
                edge={edge}
                fromNode={fromNode}
                toNode={toNode}
                isBlocked={isBlocked}
                isOnRoute={isOnRoute}
                isHighlighted={isHighlighted}
                mode={mode}
                renderPart="badge"
                onClick={(e) => handleEdgeClick(edge, e)}
                onContextMenu={(e) => {
                  actions.toggleHazard({ type: "edge", id: edge.id });
                }}
                onMouseEnter={(e) => handleHover("edge", edge, e)}
                onMouseLeave={handleHoverLeave}
              />
            );
          })}
        </g>

        {/* 6. Nodes Layer */}
        <g className="nodes-layer">
          {graph?.nodes?.map((node) => {
            const isStart = start === node.id;
            const isBlocked = state.blocked_nodes.includes(node.id);
            const isClosedExit = state.closed_exits.includes(node.id);
            const isOnRoute = route?.path?.includes(node.id);
            const isHighlighted = highlightedElement === node.id;

            return (
              <g
                key={node.id}
                style={
                  isStart && shakingStart
                    ? {
                        transform: "translateX(4px)",
                        transition: "transform 100ms ease"
                      }
                    : undefined
                }
              >
                <Node
                  node={node}
                  isStart={isStart}
                  isBlocked={isBlocked}
                  isClosedExit={isClosedExit}
                  isOnRoute={isOnRoute}
                  isHighlighted={isHighlighted}
                  mode={mode}
                  onClick={(e) => handleNodeClick(node, e)}
                  onContextMenu={(e) => {
                    actions.toggleHazard({
                      type: node.type === "exit" ? "exit" : "node",
                      id: node.id
                    });
                  }}
                  onMouseEnter={(e) => handleHover(node.type === "exit" ? "exit" : "node", node, e)}
                  onMouseLeave={handleHoverLeave}
                />
              </g>
            );
          })}
        </g>

        {/* 7. Walker Avatar Layer (Topmost so it glides smoothly over badges and nodes) */}
        {walkerEnabled && (
          <Walker
            pathRef={routePathRef}
            route={route}
            graph={graph}
            playing={walkerPlaying}
            speed={walkerSpeed}
            onNodePassed={(idx) => actions.setActiveTimelineIndex(idx)}
          />
        )}
      </svg>

      {/* Floating HUD View Controls (+ / - / Fit) */}
      <div
        style={{
          position: "absolute",
          top: "16px",
          left: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          zIndex: 10
        }}
      >
        <button
          className="btn-icon"
          title={`${t(lang, "zoomIn")} (+)`}
          onClick={() => handleZoom(0.85)}
        >
          +
        </button>
        <button
          className="btn-icon"
          title={`${t(lang, "zoomOut")} (-)`}
          onClick={() => handleZoom(1.15)}
        >
          −
        </button>
        <button
          style={{ height: "28px", padding: "0 8px", fontSize: "11px", fontWeight: 600 }}
          title={`${t(lang, "fitView")} (F)`}
          onClick={handleFit}
        >
          {t(lang, "fitView")}
        </button>
      </div>

      {/* Interactive Mode Indicator Pill in Canvas Top-Right */}
      <div
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          backgroundColor: "var(--surface)",
          padding: "4px 10px",
          borderRadius: "var(--radius-pill)",
          border: "1px solid var(--line-2)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          zIndex: 10
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: mode === "hazard" ? "var(--hazard)" : "var(--route)"
          }}
        />
        <span className="font-mono micro-label" style={{ color: "var(--text)" }}>
          {mode === "hazard" ? t(lang, "toggleHazards") : t(lang, "selectStart")}
        </span>
      </div>

      {/* Centered Technical Failure State Overlays */}
      {route?.status === "no_route" && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "var(--surface)",
            border: "1px solid var(--hazard)",
            borderLeft: "4px solid var(--hazard)",
            borderRadius: "var(--radius-md)",
            padding: "16px 20px",
            maxWidth: "340px",
            boxShadow: "var(--shadow-popover)",
            zIndex: 20
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span style={{ color: "var(--hazard)", fontWeight: 700, fontSize: "14px" }}>
              ⚠️ {t(lang, "statusNoRoute")}
            </span>
          </div>
          <p style={{ color: "var(--text-2)", fontSize: "12px", marginBottom: "12px", lineHeight: "1.5" }}>
            {t(lang, "hazardCutoffHint")}
          </p>
          <button
            className="btn-primary"
            style={{ width: "100%" }}
            onClick={() => actions.resetState()}
          >
            {t(lang, "resetHazardsAction")}
          </button>
        </div>
      )}

      {route?.status === "start_blocked" && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "var(--surface)",
            border: "1px solid var(--closed)",
            borderLeft: "4px solid var(--closed)",
            borderRadius: "var(--radius-md)",
            padding: "16px 20px",
            maxWidth: "340px",
            boxShadow: "var(--shadow-popover)",
            zIndex: 20
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span style={{ color: "var(--closed)", fontWeight: 700, fontSize: "14px" }}>
              ⚠️ {t(lang, "statusStartBlocked")}
            </span>
          </div>
          <p style={{ color: "var(--text-2)", fontSize: "12px", marginBottom: "12px", lineHeight: "1.5" }}>
            {start} {t(lang, "startNodeIsBlocked")}
          </p>
          <button
            className="btn-primary"
            style={{ width: "100%", backgroundColor: "var(--closed)", color: "#111410" }}
            onClick={() => actions.toggleHazard({ type: "node", id: start })}
          >
            {t(lang, "unblockStartAction")}
          </button>
        </div>
      )}

      {/* Floating Hover Tooltip */}
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            backgroundColor: "var(--surface)",
            border: "1px solid var(--line-2)",
            borderRadius: "var(--radius-sm)",
            padding: "6px 10px",
            boxShadow: "var(--shadow-popover)",
            pointerEvents: "none",
            zIndex: 30,
            fontSize: "11px",
            minWidth: "140px"
          }}
        >
          <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: "2px" }}>
            <span className="font-mono">{tooltip.id}</span>: {tooltip.label}
          </div>
          <div style={{ color: "var(--text-2)", fontSize: "10px", textTransform: "uppercase" }}>
            {tooltip.type} · {tooltip.status}
          </div>
          {tooltip.prediction && (
            <div
              className="font-mono"
              style={{
                marginTop: "4px",
                color: tooltip.prediction.includes("⚠️") ? "var(--hazard)" : "var(--route)",
                fontWeight: 600
              }}
            >
              {tooltip.prediction}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
