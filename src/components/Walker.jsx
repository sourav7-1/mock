/**
 * src/components/Walker.jsx
 * Pure mathematical trajectory evacuee animation.
 * Smoothly follows active route waypoints without depending on asynchronous DOM queries.
 * Handles 90-degree corner rounding, speed proportional to segment cost, trailing particles,
 * and arrival celebration.
 */

import React, { useEffect, useState, useRef, useMemo } from "react";

export default function Walker({
  route,
  graph,
  playing = true,
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

  const [safeTag, setSafeTag] = useState(null);
  const animRef = useRef(null);
  const trailHistoryRef = useRef([]);
  const lastSegIdxRef = useRef(-1);

  // Map route.path to graph nodes
  const waypoints = useMemo(() => {
    if (!graph?.nodes || !route?.path || route.status !== "ok" || route.path.length < 2) {
      return [];
    }
    const nodeMap = new Map();
    graph.nodes.forEach((n) => nodeMap.set(n.id, n));
    return route.path.map((id) => nodeMap.get(id)).filter(Boolean);
  }, [graph, route]);

  // Build segments with lengths, costs, and angles
  const segments = useMemo(() => {
    if (waypoints.length < 2) return [];

    const segs = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = waypoints[i];
      const to = waypoints[i + 1];
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.hypot(dx, dy) || 1;
      const cost = route.segments?.[i]?.cost || 1;
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      segs.push({
        from,
        to,
        dx,
        dy,
        len,
        cost,
        angle
      });
    }
    return segs;
  }, [waypoints, route]);

  // Cost fractions for proportional speed per corridor
  const totalCost = useMemo(() => {
    return segments.reduce((sum, s) => sum + s.cost, 0) || 1;
  }, [segments]);

  const costFractions = useMemo(() => {
    if (segments.length === 0) return [0, 1];
    const fracs = [0];
    let cum = 0;
    for (const s of segments) {
      cum += s.cost;
      fracs.push(cum / totalCost);
    }
    return fracs;
  }, [segments, totalCost]);

  // Animation lifecycle
  useEffect(() => {
    if (segments.length === 0) {
      setWalkerState((s) => ({ ...s, visible: false }));
      return;
    }

    trailHistoryRef.current = [];
    lastSegIdxRef.current = -1;

    let phase = "walk"; // "walk", "pause", "fade"
    let walkStartTime = null;
    let pauseStartTime = null;
    let fadeStartTime = null;

    const baseDuration = Math.min(6000, Math.max(1600, totalCost * 220));
    const walkDuration = baseDuration / (speed || 1);

    // Compute exact position and angle along route at progress (0 to 1)
    const getPositionAtProgress = (progress) => {
      const pClamped = Math.min(1, Math.max(0, progress));

      // Find segment
      let segIdx = 0;
      for (let j = 0; j < costFractions.length - 1; j++) {
        if (pClamped >= costFractions[j] && pClamped <= costFractions[j + 1]) {
          segIdx = j;
          break;
        }
      }
      if (pClamped >= 1) {
        segIdx = Math.max(0, segments.length - 1);
      }

      const seg = segments[segIdx];
      const startFrac = costFractions[segIdx];
      const endFrac = costFractions[segIdx + 1] || 1;
      const t = endFrac > startFrac ? (pClamped - startFrac) / (endFrac - startFrac) : 1;
      const dist = t * seg.len;

      const r = 12; // Corner blend radius

      // Corner transition to next segment
      if (segIdx < segments.length - 1 && dist > seg.len - r) {
        const nextSeg = segments[segIdx + 1];
        const cornerDist = dist - (seg.len - r);
        const u = cornerDist / (2 * r); // 0 to 0.5
        const P1 = seg.to;
        const pStart = {
          x: P1.x - (seg.dx / seg.len) * r,
          y: P1.y - (seg.dy / seg.len) * r
        };
        const pEnd = {
          x: P1.x + (nextSeg.dx / nextSeg.len) * r,
          y: P1.y + (nextSeg.dy / nextSeg.len) * r
        };

        const om = 1 - u;
        const x = om * om * pStart.x + 2 * om * u * P1.x + u * u * pEnd.x;
        const y = om * om * pStart.y + 2 * om * u * P1.y + u * u * pEnd.y;
        const tx = 2 * om * (P1.x - pStart.x) + 2 * u * (pEnd.x - P1.x);
        const ty = 2 * om * (P1.y - pStart.y) + 2 * u * (pEnd.y - P1.y);
        const angle = (Math.atan2(ty, tx) * 180) / Math.PI;

        return { x, y, angle, segIdx };
      }

      // Corner transition from previous segment
      if (segIdx > 0 && dist < r) {
        const prevSeg = segments[segIdx - 1];
        const u = 0.5 + dist / (2 * r); // 0.5 to 1.0
        const P1 = seg.from;
        const pStart = {
          x: P1.x - (prevSeg.dx / prevSeg.len) * r,
          y: P1.y - (prevSeg.dy / prevSeg.len) * r
        };
        const pEnd = {
          x: P1.x + (seg.dx / seg.len) * r,
          y: P1.y + (seg.dy / seg.len) * r
        };

        const om = 1 - u;
        const x = om * om * pStart.x + 2 * om * u * P1.x + u * u * pEnd.x;
        const y = om * om * pStart.y + 2 * om * u * P1.y + u * u * pEnd.y;
        const tx = 2 * om * (P1.x - pStart.x) + 2 * u * (pEnd.x - P1.x);
        const ty = 2 * om * (P1.y - pStart.y) + 2 * u * (pEnd.y - P1.y);
        const angle = (Math.atan2(ty, tx) * 180) / Math.PI;

        return { x, y, angle, segIdx };
      }

      // Standard straight corridor
      const x = seg.from.x + (dist / seg.len) * seg.dx;
      const y = seg.from.y + (dist / seg.len) * seg.dy;
      return { x, y, angle: seg.angle, segIdx };
    };

    const frame = (timestamp) => {
      if (!playing) {
        animRef.current = requestAnimationFrame(frame);
        return;
      }

      if (phase === "walk") {
        if (!walkStartTime) walkStartTime = timestamp;
        const walkElapsed = timestamp - walkStartTime;
        const progress = Math.min(1, Math.max(0, walkElapsed / walkDuration));

        const pos = getPositionAtProgress(progress);

        // Timeline synchronization
        if (pos.segIdx !== lastSegIdxRef.current) {
          lastSegIdxRef.current = pos.segIdx;
          if (onNodePassed) onNodePassed(pos.segIdx);
        }

        // Maintain position history for trailing dots
        trailHistoryRef.current.push({ x: pos.x, y: pos.y });
        if (trailHistoryRef.current.length > 20) {
          trailHistoryRef.current.shift();
        }

        const hist = trailHistoryRef.current;
        const trail = [
          hist[Math.max(0, hist.length - 4)] || { x: pos.x, y: pos.y },
          hist[Math.max(0, hist.length - 8)] || { x: pos.x, y: pos.y },
          hist[Math.max(0, hist.length - 12)] || { x: pos.x, y: pos.y }
        ];

        setWalkerState({
          x: pos.x,
          y: pos.y,
          angle: pos.angle,
          visible: true,
          opacity: 1,
          trail
        });

        if (progress >= 1) {
          phase = "pause";
          pauseStartTime = timestamp;

          if (onArrival) onArrival(route.cost);
          const exitNode = waypoints[waypoints.length - 1];
          if (exitNode) {
            setSafeTag({ x: exitNode.x, y: exitNode.y, cost: route.cost });
            setTimeout(() => setSafeTag(null), 1500);
          }
        }
      } else if (phase === "pause") {
        const pauseElapsed = timestamp - pauseStartTime;
        if (pauseElapsed >= 1200) {
          phase = "fade";
          fadeStartTime = timestamp;
        }
      } else if (phase === "fade") {
        const fadeElapsed = timestamp - fadeStartTime;
        const fadeProgress = Math.min(1, fadeElapsed / 300);

        setWalkerState((s) => ({ ...s, opacity: 1 - fadeProgress }));

        if (fadeProgress >= 1) {
          phase = "walk";
          walkStartTime = timestamp;
          pauseStartTime = null;
          fadeStartTime = null;
          trailHistoryRef.current = [];
          lastSegIdxRef.current = -1;
        }
      }

      animRef.current = requestAnimationFrame(frame);
    };

    animRef.current = requestAnimationFrame(frame);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [segments, costFractions, totalCost, playing, speed, waypoints, route.cost]);

  if (!walkerState.visible || waypoints.length < 2) return null;

  return (
    <g className="walker-container" pointerEvents="none">
      {/* SAFE Arrival Pill Tag */}
      {safeTag && (
        <g transform={`translate(${safeTag.x}, ${safeTag.y - 30})`} className="safe-arrival-tag">
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
        const opacities = [0.45, 0.28, 0.12];
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

      {/* Main Walker Head (Circle with outline + Direction Chevron) */}
      <g
        transform={`translate(${walkerState.x}, ${walkerState.y}) rotate(${walkerState.angle})`}
        opacity={walkerState.opacity}
      >
        {/* Head */}
        <circle
          cx="0"
          cy="0"
          r="7.5"
          fill="var(--route)"
          stroke="var(--bg)"
          strokeWidth="2"
        />

        {/* Direction Chevron */}
        <polyline
          points="-2.5,-3.5 2.5,0 -2.5,3.5"
          fill="none"
          stroke="var(--route-ink)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </g>
  );
}
