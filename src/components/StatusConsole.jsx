/**
 * src/components/StatusConsole.jsx
 * 40px high-precision terminal readout at the bottom of the canvas.
 */

import React from "react";
import { t } from "../core/i18n.js";

export default function StatusConsole({
  route,
  lang,
  lastCostDelta,
  walkerEnabled,
  walkerPlaying,
  walkerSpeed,
  actions
}) {
  let readoutText = "";
  let textColor = "var(--text)";
  let readoutBg = "var(--surface)";

  if (!route || route.status === "no_start") {
    readoutText = t(lang, "statusSelectStart");
    textColor = "var(--text-3)";
  } else if (route.status === "start_blocked") {
    readoutText = t(lang, "statusStartBlocked");
    textColor = "var(--closed)";
    readoutBg = "rgba(242, 178, 60, 0.08)";
  } else if (route.status === "no_route") {
    readoutText = t(lang, "statusNoRoute");
    textColor = "var(--hazard)";
    readoutBg = "rgba(255, 91, 58, 0.08)";
  } else if (route.status === "ok") {
    const pathStr = route.path.join(" → ");
    const costDisplay = lastCostDelta ? lastCostDelta : `COST ${route.cost}`;
    readoutText = `ROUTE  ${pathStr}   ·   EXIT ${route.exit}   ·   ${costDisplay}`;
    textColor = "var(--route)";
  }

  return (
    <div
      className="font-mono"
      style={{
        height: "40px",
        minHeight: "40px",
        backgroundColor: readoutBg,
        borderTop: "1px solid var(--line)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        zIndex: 45,
        fontSize: "11px",
        userSelect: "none"
      }}
    >
      {/* Left: Terminal Readout */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis"
        }}
      >
        <span style={{ color: "var(--text-3)", fontWeight: 700 }}>CONSOLE &gt;</span>
        <span style={{ color: textColor, fontWeight: 600 }}>{readoutText}</span>
      </div>

      {/* Right: Walker Controls (Play/Pause, Replay, Speed, Toggle) */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        {/* Walker On/Off Toggle */}
        <button
          onClick={() => actions.setWalkerEnabled(!walkerEnabled)}
          style={{
            height: "24px",
            padding: "0 6px",
            fontSize: "10px",
            borderRadius: "var(--radius-pill)",
            backgroundColor: walkerEnabled ? "var(--raised)" : "transparent",
            color: walkerEnabled ? "var(--route)" : "var(--text-3)"
          }}
          title={t(lang, "walkerToggle")}
        >
          {t(lang, "walkerToggle")}: {walkerEnabled ? "ON" : "OFF"}
        </button>

        {walkerEnabled && route?.status === "ok" && (
          <>
            {/* Play/Pause */}
            <button
              className="btn-icon"
              style={{ width: "24px", height: "24px" }}
              title={`${walkerPlaying ? t(lang, "pause") : t(lang, "play")} (P)`}
              onClick={() => actions.setWalkerPlaying(!walkerPlaying)}
            >
              {walkerPlaying ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>

            {/* Replay */}
            <button
              className="btn-icon"
              style={{ width: "24px", height: "24px" }}
              title={t(lang, "replay")}
              onClick={() => {
                actions.setWalkerPlaying(false);
                setTimeout(() => actions.setWalkerPlaying(true), 50);
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </button>

            {/* Speeds: 0.5x, 1x, 2x */}
            <div style={{ display: "inline-flex", gap: "2px" }}>
              {[0.5, 1, 2].map((s) => (
                <button
                  key={s}
                  onClick={() => actions.setWalkerSpeed(s)}
                  style={{
                    height: "22px",
                    padding: "0 4px",
                    fontSize: "9px",
                    borderRadius: "2px",
                    border: "none",
                    backgroundColor: walkerSpeed === s ? "var(--route)" : "var(--raised)",
                    color: walkerSpeed === s ? "var(--route-ink)" : "var(--text-2)",
                    fontWeight: 700
                  }}
                >
                  {s}×
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
