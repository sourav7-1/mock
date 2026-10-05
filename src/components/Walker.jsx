/**
 * src/components/Walker.jsx
 * Signature animated evacuee component.
 * Travels along computed evacuation path with speed scaled to edge cost,
 * trailing lime particles, directional chevron, and timeline sync.
 */

import React, { useEffect, useState, useRef, useMemo } from "react";

export default function Walker({
  pathRef,
  route,
  graph,
  playing,
  speed = 1,
  onNodePassed,
  onArrival
}) {
  const [walkerState, setWalkerState] = useState({
    x: 0,
    y: 0,
    angle: 0,
    visible: false,
    opacity: 1,
    trail: []
  });

  const [safeTag, setSafeTag] = useState(null); // { x, y, cost }
  const animRef = useRef(null);
  const lastAngleRef = useRef(0);
  const stateRef = useRef({
    startTime: null,
    phase: "draw", // "draw" (380ms), "walk", "pause" (1.2s), "fade" (300ms)
    walkStartTime: null,
    pauseStartTime: null,
    fadeStartTime: null
  });

  // Calculate cost fractions per segment
  const costFractions = useMemo(() => {
    if (!route?.segments || route.segments.length === 0) return [0, 1];
    const totalCost = route.cost || 1;
    const fractions = [0];
    let cumCost = 0;

    for (const seg of route.segments) {
      cumCost += seg.cost;
      fractions.push(cumCost / totalCost);
    }
    return fractions;
  }, [route]);

  // Main animation loop
  useEffect(() => {
    const pathEl = pathRef?.current;
    if (!pathEl || !route || route.status !== "ok" || !route.path || route.path.length < 2) {
      setWalkerState((s) => ({ ...s, visible: false }));
      return;
    }

    const totalLength = pathEl.getTotalLength();
    if (totalLength <= 0) return;

    // Accurately map path length to each node in route.path
    const nodeMap = new Map();
    if (graph?.nodes) {
      graph.nodes.forEach((n) => nodeMap.set(n.id, n));
    }

    const nodeLengths = [0];
    let searchStart = 0;

    for (let i = 1; i < route.path.length; i++) {
      if (i === route.path.length - 1) {
        nodeLengths.push(totalLength);
        continue;
      }
      const node = nodeMap.get(route.path[i]);
      if (!node) {
        nodeLengths.push(nodeLengths[i - 1]);
        continue;
      }

      let bestLen = searchStart;
      let bestDist = Infinity;
      const searchEnd = totalLength;

      for (let s = searchStart; s <= searchEnd; s += 2) {
        const pt = pathEl.getPointAtLength(s);
        const dist = (pt.x - node.x) ** 2 + (pt.y - node.y) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          bestLen = s;
        } else if (dist > bestDist && dist > 144) {
          // Passed closest waypoint
          break;
        }
      }
      nodeLengths.push(bestLen);
      searchStart = Math.max(0, bestLen - 4);
    }

    // Reset walker state
    stateRef.current = {
      startTime: null,
      phase: "draw",
      walkStartTime: null,
      pauseStartTime: null,
      fadeStartTime: null
    };

    // Calculate total duration: clamp(route.cost * 220ms, 1600ms, 6000ms)
    const baseDuration = Math.min(6000, Math.max(1600, (route.cost || 1) * 220));
    const walkDuration = baseDuration / (speed || 1);

    let lastActiveIdx = -1;

    const frame = (timestamp) => {
      if (!stateRef.current.startTime) {
        stateRef.current.startTime = timestamp;
      }

      if (!playing) {
        animRef.current = requestAnimationFrame(frame);
        return;
      }

      const elapsed = timestamp - stateRef.current.startTime;

      // Phase 1: Route draw-in (380ms)
      if (stateRef.current.phase === "draw") {
        if (elapsed < 380) {
          setWalkerState((s) => ({ ...s, visible: false }));
          animRef.current = requestAnimationFrame(frame);
          return;
        } else {
          stateRef.current.phase = "walk";
          stateRef.current.walkStartTime = timestamp;
        }
      }

      // Phase 2: Walking along path
      if (stateRef.current.phase === "walk") {
        const walkElapsed = timestamp - stateRef.current.walkStartTime;
        const costProgress = Math.min(1, Math.max(0, walkElapsed / walkDuration));

        // Map cost progress to segment
        let segIdx = 0;
        for (let i = 0; i < costFractions.length - 1; i++) {
          if (costProgress >= costFractions[i] && costProgress <= costFractions[i + 1]) {
            segIdx = i;
            break;
          }
        }
        if (costProgress >= 1) {
          segIdx = Math.max(0, costFractions.length - 2);
        }

        const segStartCost = costFractions[segIdx];
        const segEndCost = costFractions[segIdx + 1] || 1;
        const segProgress = segEndCost > segStartCost ? (costProgress - segStartCost) / (segEndCost - segStartCost) : 1;

        const startLen = nodeLengths[segIdx] !== undefined ? nodeLengths[segIdx] : 0;
        const endLen = nodeLengths[segIdx + 1] !== undefined ? nodeLengths[segIdx + 1] : totalLength;
        const currentLen = Math.min(totalLength, Math.max(0, startLen + segProgress * (endLen - startLen)));

        // Update inspector sync
        if (segIdx !== lastActiveIdx) {
          lastActiveIdx = segIdx;
          if (onNodePassed) onNodePassed(segIdx);
        }

        // Get coordinates and tangent angle with smooth forward/backward delta
        const pt = pathEl.getPointAtLength(currentLen);
        const s1 = Math.max(0, currentLen - 4);
        const s2 = Math.min(totalLength, currentLen + 4);
        let angle = lastAngleRef.current;
        if (s2 > s1) {
          const p1 = pathEl.getPointAtLength(s1);
          const p2 = pathEl.getPointAtLength(s2);
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          if (dx !== 0 || dy !== 0) {
            angle = (Math.atan2(dy, dx) * 180) / Math.PI;
            lastAngleRef.current = angle;
          }
        }

        // Trail of 3 fading dots
        const trailDistances = [8, 16, 24];
        const trail = trailDistances.map((d) => {
          const trailLen = Math.max(0, currentLen - d);
          return pathEl.getPointAtLength(trailLen);
        });

        setWalkerState({
          x: pt.x,
          y: pt.y,
          angle,
          visible: true,
          opacity: 1,
          trail
        });

        if (costProgress >= 1) {
          // Arrived at exit
          stateRef.current.phase = "pause";
          stateRef.current.pauseStartTime = timestamp;

          // Trigger onArrival callback and show "SAFE · cost X" tag
          if (onArrival) onArrival(route.cost);
          const exitNode = graph?.nodes?.find((n) => n.id === route.exit);
          if (exitNode) {
            setSafeTag({ x: exitNode.x, y: exitNode.y, cost: route.cost });
            setTimeout(() => setSafeTag(null), 1500);
          }
        }
      }

      // Phase 3: Pause at exit for 1.2s then fade & restart
      if (stateRef.current.phase === "pause") {
        const pauseElapsed = timestamp - stateRef.current.pauseStartTime;
        if (pauseElapsed >= 1200) {
          stateRef.current.phase = "fade";
          stateRef.current.fadeStartTime = timestamp;
        }
      }

      // Phase 4: Fade out (300ms) then loop
      if (stateRef.current.phase === "fade") {
        const fadeElapsed = timestamp - stateRef.current.fadeStartTime;
        const fadeProgress = Math.min(1, fadeElapsed / 300);

        setWalkerState((s) => ({ ...s, opacity: 1 - fadeProgress }));

        if (fadeProgress >= 1) {
          // Restart loop smoothly from start node
          stateRef.current = {
            startTime: timestamp,
            phase: "walk",
            walkStartTime: timestamp,
            pauseStartTime: null,
            fadeStartTime: null
          };
          lastActiveIdx = -1;
        }
      }

      animRef.current = requestAnimationFrame(frame);
    };

    animRef.current = requestAnimationFrame(frame);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [pathRef, route, graph, playing, speed, costFractions]);

  if (!walkerState.visible) return null;

  return (
    <g className="walker-container" pointerEvents="none">
      {/* SAFE Arrival Pill Tag */}
      {safeTag && (
        <g transform={`translate(${safeTag.x}, ${safeTag.y - 28})`} className="safe-arrival-tag">
          <rect
            x="-44"
            y="-10"
            width="88"
            height="20"
            rx="4"
            fill="var(--route)"
            stroke="var(--bg)"
            strokeWidth="1.5"
          />
          <text
            textAnchor="middle"
            y="4"
            fill="var(--route-ink)"
            fontSize="10"
            fontFamily="var(--font-data)"
            fontWeight="700"
            letterSpacing="0.05em"
          >
            SAFE · cost {safeTag.cost}
          </text>
        </g>
      )}

      {/* Trailing Fading Lime Dots */}
      {walkerState.trail.map((pt, i) => {
        const opacities = [0.5, 0.3, 0.15];
        const radii = [4.5, 3.5, 2.5];
        return (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r={radii[i]}
            fill="var(--route)"
            opacity={walkerState.opacity * opacities[i]}
          />
        );
      })}

      {/* Main Walker Head (14px circle with 2px --bg stroke + Direction Chevron) */}
      <g
        transform={`translate(${walkerState.x}, ${walkerState.y}) rotate(${walkerState.angle})`}
        opacity={walkerState.opacity}
      >
        {/* Head */}
        <circle
          cx="0"
          cy="0"
          r="7"
          fill="var(--route)"
          stroke="var(--bg)"
          strokeWidth="2"
        />

        {/* Direction Chevron */}
        <polyline
          points="-2,-3 2,0 -2,3"
          fill="none"
          stroke="var(--route-ink)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </g>
  );
}
