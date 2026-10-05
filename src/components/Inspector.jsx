/**
 * src/components/Inspector.jsx
 * 380px precision telemetry sidebar / mobile bottom sheet.
 */

import React from "react";
import RouteTimeline from "./RouteTimeline.jsx";
import HazardManager from "./HazardManager.jsx";
import { t } from "../core/i18n.js";

export default function Inspector({
  graph,
  state,
  start,
  route,
  mode,
  lang,
  history,
  activeTimelineIndex,
  onHighlight,
  actions,
  onExportPng
}) {
  const nodeMap = new Map();
  graph?.nodes?.forEach((n) => nodeMap.set(n.id, n));

  const startNode = start ? nodeMap.get(start) : null;
  const exitNode = route?.exit ? nodeMap.get(route.exit) : null;

  return (
    <aside
      className="inspector-panel"
      style={{
        width: "380px",
        minWidth: "380px",
        backgroundColor: "var(--surface)",
        borderLeft: "1px solid var(--line)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflowY: "auto",
        zIndex: 40
      }}
    >
      {/* 1. Header with Mode Segmented Control */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid var(--line)",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="micro-label" style={{ letterSpacing: "0.12em" }}>
            {t(lang, "inspectorTitle")}
          </span>

          {/* Undo / Redo buttons */}
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              className="btn-icon"
              title={`${t(lang, "undo")} (Ctrl+Z)`}
              disabled={history.past.length === 0}
              onClick={actions.undo}
              style={{ width: "26px", height: "26px" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
              </svg>
            </button>
            <button
              className="btn-icon"
              title={`${t(lang, "redo")} (Ctrl+Shift+Z)`}
              disabled={history.future.length === 0}
              onClick={actions.redo}
              style={{ width: "26px", height: "26px" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 7v6h-6" />
                <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mode Selector Segmented Control */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2px",
            backgroundColor: "var(--raised)",
            padding: "2px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--line)"
          }}
        >
          <button
            onClick={() => actions.setMode("select")}
            style={{
              height: "28px",
              fontSize: "11px",
              fontWeight: 600,
              borderRadius: "4px",
              border: "none",
              backgroundColor: mode === "select" ? "var(--surface)" : "transparent",
              color: mode === "select" ? "var(--route)" : "var(--text-2)"
            }}
          >
            {t(lang, "selectStart")} (S)
          </button>
          <button
            onClick={() => actions.setMode("hazard")}
            style={{
              height: "28px",
              fontSize: "11px",
              fontWeight: 600,
              borderRadius: "4px",
              border: "none",
              backgroundColor: mode === "hazard" ? "var(--surface)" : "transparent",
              color: mode === "hazard" ? "var(--hazard)" : "var(--text-2)"
            }}
          >
            {t(lang, "toggleHazards")} (H)
          </button>
        </div>
      </div>

      {/* 2. Telemetry Cards: Origin & Destination */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          padding: "16px",
          borderBottom: "1px solid var(--line)"
        }}
      >
        {/* Start Card */}
        <div
          style={{
            backgroundColor: "var(--raised)",
            padding: "10px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--line)"
          }}
        >
          <div className="micro-label" style={{ marginBottom: "4px" }}>
            {t(lang, "startLocation")}
          </div>
          <div className="font-mono" style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>
            {startNode ? startNode.id : "—"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-2)", marginTop: "2px" }}>
            {startNode ? startNode.label : "None selected"}
          </div>
        </div>

        {/* Exit Card */}
        <div
          style={{
            backgroundColor: "var(--raised)",
            padding: "10px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--line)"
          }}
        >
          <div className="micro-label" style={{ marginBottom: "4px" }}>
            {t(lang, "destinationExit")}
          </div>
          <div className="font-mono" style={{ fontSize: "14px", fontWeight: 700, color: "var(--exit)" }}>
            {exitNode ? exitNode.id : "—"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-2)", marginTop: "2px" }}>
            {exitNode ? exitNode.label : "Unreachable"}
          </div>
        </div>
      </div>

      {/* 3. Transit Stops Timeline */}
      <div style={{ padding: "16px", borderBottom: "1px solid var(--line)" }}>
        <div className="micro-label" style={{ marginBottom: "12px" }}>
          {t(lang, "transitStops")}
        </div>
        <RouteTimeline
          graph={graph}
          route={route}
          lang={lang}
          activeTimelineIndex={activeTimelineIndex}
          onHighlight={onHighlight}
        />
      </div>

      {/* 4. Active Hazard Manager */}
      <div style={{ padding: "16px", flex: 1 }}>
        <div className="micro-label" style={{ marginBottom: "12px" }}>
          {t(lang, "hazardsHeader")}
        </div>
        <HazardManager
          state={state}
          graph={graph}
          lang={lang}
          actions={actions}
        />
      </div>

      {/* 5. Footer Actions (Export PNG) */}
      <div
        style={{
          padding: "16px",
          borderTop: "1px solid var(--line)",
          backgroundColor: "var(--surface)"
        }}
      >
        <button
          onClick={onExportPng}
          style={{ width: "100%", height: "34px", fontWeight: 600 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {t(lang, "exportPng")}
        </button>
      </div>
    </aside>
  );
}
