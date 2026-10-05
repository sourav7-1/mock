/**
 * src/components/RouteLayer.jsx
 * Continuous smoothed SVG route path, ghost route diff, and hover preview.
 */

import React, { useRef, useEffect, useState, useMemo } from "react";
import { generateSmoothRoutePath } from "../core/graph.js";
import Walker from "./Walker.jsx";

export default function RouteLayer({
  pathRef: externalPathRef,
  renderWalker = true,
  graph,
  route,
  previousRoute,
  hoverPreview,
  walkerEnabled,
  walkerPlaying,
  walkerSpeed,
  activeTimelineIndex,
  onNodePassed,
  onArrival
}) {
  const internalPathRef = useRef(null);
  const pathRef = externalPathRef || internalPathRef;

  // Check reduced motion preference
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Synchronously compute active route path
  const pathD = useMemo(() => {
    if (!graph?.nodes || !route?.path || route.status !== "ok" || route.path.length < 2) {
      return "";
    }
    const nodeMap = new Map();
    graph.nodes.forEach((n) => nodeMap.set(n.id, n));
    const points = route.path.map((id) => nodeMap.get(id)).filter(Boolean);
    return generateSmoothRoutePath(points, 12);
  }, [graph, route]);

  // Synchronously compute hover preview route
  const hoverD = useMemo(() => {
    if (!graph?.nodes || !hoverPreview?.path || hoverPreview.status !== "ok" || hoverPreview.path.length < 2) {
      return "";
    }
    const nodeMap = new Map();
    graph.nodes.forEach((n) => nodeMap.set(n.id, n));
    const points = hoverPreview.path.map((id) => nodeMap.get(id)).filter(Boolean);
    return generateSmoothRoutePath(points, 12);
  }, [graph, hoverPreview]);

  // Ghost route diff (fades out after 1.2s)
  const [ghostD, setGhostD] = useState("");
  const [showGhost, setShowGhost] = useState(false);

  useEffect(() => {
    if (!graph || !previousRoute || previousRoute.status !== "ok" || !previousRoute.path || previousRoute.path.length < 2) {
      return;
    }

    const nodeMap = new Map();
    graph.nodes.forEach((n) => nodeMap.set(n.id, n));
    const points = previousRoute.path.map((id) => nodeMap.get(id)).filter(Boolean);

    setGhostD(generateSmoothRoutePath(points, 12));
    setShowGhost(true);

    const timer = setTimeout(() => {
      setShowGhost(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, [graph, previousRoute]);

  const hasRoute = route?.status === "ok" && Boolean(pathD);

  return (
    <g className="route-layer-group" pointerEvents="none">
      {/* 1. Ghost Route Diff (Fades out in 1.2s at 35% opacity dashed) */}
      {showGhost && ghostD && (
        <path
          d={ghostD}
          fill="none"
          stroke="var(--route)"
          strokeWidth="3"
          strokeDasharray="6 4"
          opacity={0.35}
          style={{
            transition: "opacity 1.2s cubic-bezier(0.2, 0, 0, 1)"
          }}
        />
      )}

      {/* 2. Hover Preview Route (Dashed lime line) */}
      {hoverD && hoverD !== pathD && (
        <path
          d={hoverD}
          fill="none"
          stroke="var(--route)"
          strokeWidth="3"
          strokeDasharray="4 4"
          opacity={0.7}
        />
      )}

      {/* 3. Primary Active Route (4px lime stroke) */}
      {hasRoute && (
        <>
          <path
            ref={pathRef}
            d={pathD}
            fill="none"
            stroke="var(--route)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="active-route-path"
          />

          {/* Animated walker if enabled and not reduced motion */}
          {renderWalker && walkerEnabled && !prefersReducedMotion && (
            <Walker
              pathRef={pathRef}
              route={route}
              graph={graph}
              playing={walkerPlaying}
              speed={walkerSpeed}
              onNodePassed={onNodePassed}
              onArrival={onArrival}
            />
          )}

          {/* Reduced-Motion fallback: Static Step Number Badges */}
          {prefersReducedMotion &&
            route.path.map((id, index) => {
              const node = graph.nodes.find((n) => n.id === id);
              if (!node) return null;
              return (
                <g key={id} transform={`translate(${node.x}, ${node.y - 20})`}>
                  <circle r="9" fill="var(--route)" stroke="var(--bg)" strokeWidth="1.5" />
                  <text
                    textAnchor="middle"
                    y="3"
                    fill="var(--route-ink)"
                    fontSize="9"
                    fontFamily="var(--font-data)"
                    fontWeight="700"
                  >
                    {index + 1}
                  </text>
                </g>
              );
            })}
        </>
      )}
    </g>
  );
}
