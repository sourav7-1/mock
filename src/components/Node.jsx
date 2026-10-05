/**
 * src/components/Node.jsx
 * High-precision architectural node rendering:
 * - Room: 6px rounded square
 * - Junction: 10px circle
 * - Exit: Jade-teal pill with SVG running-figure + arrow glyph
 * - States: Blocked (vermilion hatch), Closed Exit (saffron hatch + CLOSED), Start (bone double ring + START tag), Route (lime ring)
 */

import React from "react";

export default function Node({
  node,
  isStart,
  isBlocked,
  isClosedExit,
  isOnRoute,
  isHighlighted,
  mode,
  onClick,
  onContextMenu,
  onMouseEnter,
  onMouseLeave
}) {
  const { id, label, type, x, y } = node;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(e);
    }
  };

  const ariaLabel = `${type.toUpperCase()} ${id}: ${label}${
    isStart ? " (Start)" : ""
  }${isBlocked ? " (Blocked)" : ""}${isClosedExit ? " (Closed)" : ""}${
    isOnRoute ? " (On Evacuation Route)" : ""
  }`;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      tabIndex={0}
      role="button"
      aria-label={ariaLabel}
      className={`map-node-group dimmable-element ${isOnRoute ? "on-route" : ""} ${
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
      {/* Route Highlight Ring (Lime) */}
      {isOnRoute && (
        <circle
          r={type === "exit" ? 22 : type === "junction" ? 14 : 20}
          fill="none"
          stroke="var(--route)"
          strokeWidth="2.5"
          opacity={0.8}
        />
      )}

      {/* Start Node Double Ring (Bone) + START tag */}
      {isStart && (
        <>
          <circle
            r={type === "exit" ? 24 : type === "junction" ? 16 : 22}
            fill="none"
            stroke="var(--start)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <circle
            r={type === "exit" ? 20 : type === "junction" ? 12 : 18}
            fill="none"
            stroke="var(--start)"
            strokeWidth="2"
          />
          {/* START tag pill above node */}
          <g transform="translate(0, -22)">
            <rect
              x="-20"
              y="-8"
              width="40"
              height="14"
              rx="3"
              fill="var(--surface)"
              stroke="var(--start)"
              strokeWidth="1"
            />
            <text
              textAnchor="middle"
              y="2.5"
              fill="var(--start)"
              fontSize="9"
              fontFamily="var(--font-data)"
              fontWeight="700"
              letterSpacing="0.05em"
            >
              START
            </text>
          </g>
        </>
      )}

      {/* Node Geometry by Type */}
      {type === "room" && (
        <rect
          x="-14"
          y="-14"
          width="28"
          height="28"
          rx="6"
          fill={isBlocked ? "url(#hazard-hatch)" : "var(--surface)"}
          stroke={isBlocked ? "var(--hazard)" : isOnRoute ? "var(--route)" : "var(--line-2)"}
          strokeWidth={isOnRoute ? "2" : "1.5"}
        />
      )}

      {type === "junction" && (
        <circle
          r="8"
          fill={isBlocked ? "url(#hazard-hatch)" : "var(--surface)"}
          stroke={isBlocked ? "var(--hazard)" : isOnRoute ? "var(--route)" : "var(--line-2)"}
          strokeWidth={isOnRoute ? "2" : "1.5"}
        />
      )}

      {type === "exit" && (
        <g>
          {/* Pill shape: 44px wide, 24px high */}
          <rect
            x="-22"
            y="-12"
            width="44"
            height="24"
            rx="12"
            fill={
              isClosedExit
                ? "url(#closed-hatch)"
                : isOnRoute
                ? "var(--exit)"
                : "var(--surface)"
            }
            stroke={
              isClosedExit
                ? "var(--closed)"
                : "var(--exit)"
            }
            strokeWidth="1.5"
          />

          {/* Running-figure + Arrow SVG Glyph */}
          <g transform="translate(-16, -7)">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke={
                isClosedExit
                  ? "var(--closed)"
                  : isOnRoute
                  ? "#111410"
                  : "var(--exit)"
              }
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Running figure icon */}
              <circle cx="16" cy="4" r="2" />
              <path d="M12 9l3 3-2 5" />
              <path d="M9 13l3-4 3 1" />
              <path d="M7 19l4-3" />
            </svg>
          </g>

          {/* Arrow */}
          <g transform="translate(1, -6)">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke={
                isClosedExit
                  ? "var(--closed)"
                  : isOnRoute
                  ? "#111410"
                  : "var(--exit)"
              }
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </g>

          {/* CLOSED badge for closed exits */}
          {isClosedExit && (
            <g transform="translate(0, 18)">
              <rect
                x="-22"
                y="-6"
                width="44"
                height="12"
                rx="2"
                fill="var(--bg)"
                stroke="var(--closed)"
                strokeWidth="1"
              />
              <text
                textAnchor="middle"
                y="3"
                fill="var(--closed)"
                fontSize="8"
                fontFamily="var(--font-data)"
                fontWeight="700"
                letterSpacing="0.06em"
              >
                CLOSED
              </text>
            </g>
          )}
        </g>
      )}

      {/* Node ID label inside / near node */}
      {type === "room" && (
        <text
          textAnchor="middle"
          y="3.5"
          fill={isBlocked ? "var(--hazard)" : isOnRoute ? "var(--route)" : "var(--text)"}
          fontSize="10"
          fontFamily="var(--font-data)"
          fontWeight="700"
          pointerEvents="none"
        >
          {id}
        </text>
      )}

      {/* Label (ID + Label) below node */}
      <g transform={`translate(0, ${type === "exit" ? (isClosedExit ? 28 : 20) : 22})`} pointerEvents="none">
        <text
          textAnchor="middle"
          fill="var(--text-2)"
          fontSize="11"
          fontFamily="var(--font-ui)"
          fontWeight="500"
        >
          {type !== "room" && <tspan fill="var(--text)" fontFamily="var(--font-data)" fontWeight="600">{id} </tspan>}
          {label}
        </text>
      </g>
    </g>
  );
}
