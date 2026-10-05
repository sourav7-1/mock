/**
 * src/components/Edge.jsx
 * Corridor line with wide hit area and midpoint cost pill.
 */

import React from "react";

export default function Edge({
  edge,
  fromNode,
  toNode,
  isBlocked,
  isOnRoute,
  isHighlighted,
  mode,
  renderPart = "all", // "line", "badge", or "all"
  onClick,
  onContextMenu,
  onMouseEnter,
  onMouseLeave
}) {
  if (!fromNode || !toNode) return null;

  const midX = (fromNode.x + toNode.x) / 2;
  const midY = (fromNode.y + toNode.y) / 2;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(e);
    }
  };

  const ariaLabel = `Corridor ${edge.id} between ${fromNode.id} and ${toNode.id}, cost ${edge.cost}${
    isBlocked ? " (Blocked)" : ""
  }${isOnRoute ? " (On Route)" : ""}`;

  const textVal = String(edge.cost);
  const pillW = Math.max(24, textVal.length * 8 + 10);

  return (
    <g
      tabIndex={renderPart === "badge" ? -1 : 0}
      role="button"
      aria-label={ariaLabel}
      className={`map-edge-group dimmable-element ${isOnRoute ? "on-route" : ""} ${
        isHighlighted ? "is-highlighted" : ""
      }`}
      style={{ cursor: mode === "hazard" ? "cell" : "pointer", outline: "none" }}
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e);
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onKeyDown={handleKeyDown}
    >
      {/* 1. Line Part (Hit Area and Corridor Line) */}
      {renderPart !== "badge" && (
        <>
          {/* Wide transparent hit area (16px) */}
          <line
            x1={fromNode.x}
            y1={fromNode.y}
            x2={toNode.x}
            y2={toNode.y}
            stroke="transparent"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Visible corridor line */}
          <line
            x1={fromNode.x}
            y1={fromNode.y}
            x2={toNode.x}
            y2={toNode.y}
            stroke={
              isBlocked
                ? "var(--hazard)"
                : isHighlighted
                ? "var(--route)"
                : "var(--line-2)"
            }
            strokeWidth={isHighlighted ? "2.5" : "1.5"}
            strokeDasharray={isBlocked ? "5 4" : "none"}
          />
        </>
      )}

      {/* 2. Badge Part (Midpoint Cost Tag Pill or Blocked 'x') */}
      {renderPart !== "line" && (
        <g transform={`translate(${midX}, ${midY})`}>
          {isBlocked ? (
            /* Blocked 'x' marker */
            <g>
              <circle
                r="8"
                fill="var(--surface)"
                stroke="var(--hazard)"
                strokeWidth="1.6"
              />
              <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" stroke="var(--hazard)" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="3.5" y1="-3.5" x2="-3.5" y2="3.5" stroke="var(--hazard)" strokeWidth="1.6" strokeLinecap="round" />
            </g>
          ) : (
            /* Normal cost pill with solid background and high contrast text */
            <g>
              <rect
                x={-pillW / 2}
                y="-8"
                width={pillW}
                height="16"
                rx="4"
                fill={isOnRoute ? "var(--surface)" : "var(--raised)"}
                stroke={isOnRoute ? "var(--route)" : "var(--line-2)"}
                strokeWidth={isOnRoute ? "1.6" : "1"}
              />
              <text
                textAnchor="middle"
                y="3.5"
                fill={isOnRoute ? "var(--text)" : "var(--text-2)"}
                fontSize={isOnRoute ? "10" : "9.5"}
                fontFamily="var(--font-data)"
                fontWeight={isOnRoute ? "700" : "600"}
                pointerEvents="none"
                style={{ userSelect: "none" }}
              >
                {edge.cost}
              </text>
            </g>
          )}
        </g>
      )}
    </g>
  );
}
