/**
 * src/components/RouteTimeline.jsx
 * Transit-style vertical route timeline synced with walker movement.
 */

import React from "react";
import { t } from "../core/i18n.js";

export default function RouteTimeline({
  graph,
  route,
  lang,
  activeTimelineIndex,
  onHighlight
}) {
  if (!route || route.status !== "ok" || !route.path || route.path.length === 0) {
    return (
      <div style={{ padding: "16px", color: "var(--text-3)", fontSize: "12px" }}>
        {t(lang, "noRouteTimeline")}
      </div>
    );
  }

  const nodeMap = new Map();
  graph?.nodes?.forEach((n) => nodeMap.set(n.id, n));

  return (
    <div className="route-timeline-container" style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      {route.path.map((nodeId, idx) => {
        const node = nodeMap.get(nodeId);
        const isCurrentStop = idx === activeTimelineIndex;
        const isDestination = idx === route.path.length - 1;
        const segment = idx < route.segments.length ? route.segments[idx] : null;

        return (
          <div
            key={nodeId}
            onMouseEnter={() => {
              if (segment) onHighlight(segment.edgeId);
              else onHighlight(nodeId);
            }}
            onMouseLeave={() => onHighlight(null)}
            style={{
              display: "flex",
              flexDirection: "column",
              position: "relative",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: isCurrentStop ? "var(--raised)" : "transparent",
              transition: "background-color 150ms ease"
            }}
          >
            {/* Stop Header Row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {/* Transit Stop Bullet */}
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: isCurrentStop
                      ? "var(--route)"
                      : isDestination
                      ? "var(--exit)"
                      : "var(--surface)",
                    border: `2px solid ${
                      isCurrentStop
                        ? "var(--route)"
                        : isDestination
                        ? "var(--exit)"
                        : "var(--line-2)"
                    }`,
                    boxShadow: isCurrentStop ? "0 0 8px var(--route)" : "none",
                    flexShrink: 0
                  }}
                />

                {/* Node ID & Label */}
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: "12px",
                      fontWeight: isCurrentStop ? 700 : 600,
                      color: isCurrentStop ? "var(--route)" : "var(--text)"
                    }}
                  >
                    {nodeId}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: isCurrentStop ? "var(--text)" : "var(--text-2)",
                      fontWeight: isCurrentStop ? 600 : 400
                    }}
                  >
                    {node ? node.label : ""}
                  </span>
                </div>
              </div>

              {/* Stop Type Tag */}
              <span
                className="font-mono micro-label"
                style={{
                  fontSize: "9px",
                  color: isDestination ? "var(--exit)" : "var(--text-3)"
                }}
              >
                {node?.type.toUpperCase()}
              </span>
            </div>

            {/* Segment Corridor Line & Cost Tag */}
            {segment && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingLeft: "5px",
                  margin: "2px 0 2px 0"
                }}
              >
                <div
                  style={{
                    width: "2px",
                    height: "22px",
                    backgroundColor: isCurrentStop ? "var(--route)" : "var(--line-2)",
                    marginLeft: "0px"
                  }}
                />
                <div
                  className="font-mono"
                  style={{
                    fontSize: "10px",
                    color: "var(--text-2)",
                    backgroundColor: "var(--surface)",
                    padding: "1px 6px",
                    borderRadius: "3px",
                    border: "1px solid var(--line)"
                  }}
                >
                  +{segment.cost}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Large Total Cost Readout */}
      <div
        style={{
          marginTop: "16px",
          padding: "12px",
          backgroundColor: "var(--surface)",
          border: "1px solid var(--line-2)",
          borderRadius: "var(--radius-md)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <span className="micro-label" style={{ letterSpacing: "0.08em" }}>
          {t(lang, "totalCost")}
        </span>
        <span
          className="font-mono"
          style={{
            fontSize: "22px",
            fontWeight: 700,
            color: "var(--route)"
          }}
        >
          {route.cost}
        </span>
      </div>
    </div>
  );
}
