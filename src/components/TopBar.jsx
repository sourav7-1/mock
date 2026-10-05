/**
 * src/components/TopBar.jsx
 * 52px high-precision control room header.
 */

import React, { useRef } from "react";
import { t } from "../core/i18n.js";
import { validateBuilding } from "../core/validate.js";

export default function TopBar({
  graph,
  route,
  lang,
  theme,
  actions,
  onOpenShortcuts,
  onError
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const res = validateBuilding(event.target.result);
      if (res.ok) {
        actions.loadGraph(res.data);
      } else {
        onError(res.errors);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleLoadSample = async () => {
    try {
      const res = await fetch("./sample/building.json");
      if (!res.ok) throw new Error("Could not fetch sample/building.json");
      const data = await res.json();
      const validation = validateBuilding(data);
      if (validation.ok) {
        actions.loadGraph(validation.data);
      } else {
        onError(validation.errors);
      }
    } catch (err) {
      onError([{ code: "INVALID_JSON", params: { message: err.message } }]);
    }
  };

  // Determine status indicator color and label
  let statusColor = "var(--text-3)";
  let statusTextKey = "noStart";

  if (route?.status === "ok") {
    statusColor = "var(--route)";
    statusTextKey = "routeOk";
  } else if (route?.status === "no_route") {
    statusColor = "var(--hazard)";
    statusTextKey = "noRoute";
  } else if (route?.status === "start_blocked") {
    statusColor = "var(--closed)";
    statusTextKey = "startBlocked";
  }

  return (
    <header
      style={{
        height: "52px",
        minHeight: "52px",
        backgroundColor: "var(--surface)",
        borderBottom: "1px solid var(--line)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        zIndex: 50,
        gap: "12px"
      }}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* Left: Brand Mark + Facility Title + Status Dot */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
        {/* SVG Emergency Exit glyph */}
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "var(--radius-sm)",
            backgroundColor: "var(--raised)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}
          title={t(lang, "appTitle")}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--route)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>

        {/* Facility Name & Status Pill */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          <span
            className="font-mono"
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--text)",
              letterSpacing: "0.02em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "240px"
            }}
          >
            {graph ? graph.building : t(lang, "appTitle")}
          </span>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "2px 8px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "var(--raised)",
              border: "1px solid var(--line)"
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                backgroundColor: statusColor,
                boxShadow: `0 0 6px ${statusColor}`
              }}
            />
            <span
              className="font-mono micro-label"
              style={{ color: statusColor, fontSize: "10px", fontWeight: 700 }}
            >
              {t(lang, statusTextKey)}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions, segmented toggles, Reset, Shortcuts */}
      <div className="topbar-right" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {/* EN / বাং Segmented Control */}
        <div
          style={{
            display: "inline-flex",
            backgroundColor: "var(--raised)",
            borderRadius: "var(--radius-md)",
            padding: "2px",
            border: "1px solid var(--line)"
          }}
        >
          <button
            onClick={() => actions.setLang("en")}
            style={{
              height: "26px",
              padding: "0 8px",
              fontSize: "11px",
              fontWeight: 600,
              borderRadius: "4px",
              border: "none",
              backgroundColor: lang === "en" ? "var(--surface)" : "transparent",
              color: lang === "en" ? "var(--route)" : "var(--text-2)"
            }}
          >
            EN
          </button>
          <button
            onClick={() => actions.setLang("bn")}
            style={{
              height: "26px",
              padding: "0 8px",
              fontSize: "11px",
              fontWeight: 600,
              borderRadius: "4px",
              border: "none",
              backgroundColor: lang === "bn" ? "var(--surface)" : "transparent",
              color: lang === "bn" ? "var(--route)" : "var(--text-2)"
            }}
          >
            বাং
          </button>
        </div>

        {/* Theme Toggle (Night Shift / Day Shift) */}
        <button
          className="btn-icon"
          title={`Theme: ${theme === "dark" ? "Night Shift" : "Day Shift"}`}
          onClick={() => actions.setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            /* Moon glyph */
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            /* Sun glyph */
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </button>

        {/* Import Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          title={t(lang, "importFile")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span className="btn-text">{t(lang, "importFile")}</span>
        </button>

        {/* Load Sample Button (fetch /sample/building.json) */}
        <button
          onClick={handleLoadSample}
          title={t(lang, "loadSample")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
          <span className="btn-text">{t(lang, "loadSample")}</span>
        </button>

        {/* Reset Button (Secondary) */}
        <button
          onClick={actions.resetState}
          title={`${t(lang, "reset")} (R)`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          <span className="btn-text">{t(lang, "reset")}</span>
        </button>

        {/* Shortcuts ? Button */}
        <button
          className="btn-icon"
          onClick={onOpenShortcuts}
          title={`${t(lang, "shortcuts")} (?)`}
        >
          <span style={{ fontSize: "14px", fontWeight: 700 }}>?</span>
        </button>
      </div>
    </header>
  );
}
