/**
 * src/components/Legend.jsx
 * Technical architectural drawing title block and visual symbol key.
 */

import React from "react";
import { t } from "../core/i18n.js";

export default function Legend({ lang }) {
  const items = [
    { label: t(lang, "legendRoom"), symbol: <rect width="10" height="10" rx="2" fill="var(--surface)" stroke="var(--line-2)" strokeWidth="1.2" /> },
    { label: t(lang, "legendJunction"), symbol: <circle cx="5" cy="5" r="4" fill="var(--surface)" stroke="var(--line-2)" strokeWidth="1.2" /> },
    { label: t(lang, "legendExit"), symbol: <rect width="14" height="8" rx="4" fill="var(--exit)" /> },
    { label: t(lang, "legendBlocked"), symbol: <rect width="10" height="10" rx="2" fill="url(#hazard-hatch)" stroke="var(--hazard)" strokeWidth="1.2" /> },
    { label: t(lang, "legendClosedExit"), symbol: <rect width="14" height="8" rx="4" fill="url(#closed-hatch)" stroke="var(--closed)" strokeWidth="1.2" /> },
    { label: t(lang, "legendRoute"), symbol: <line x1="0" y1="5" x2="14" y2="5" stroke="var(--route)" strokeWidth="3" strokeLinecap="round" /> }
  ];

  return (
    <div
      style={{
        position: "absolute",
        bottom: "16px",
        left: "16px",
        backgroundColor: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-sm)",
        padding: "8px 12px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        pointerEvents: "none",
        zIndex: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
      }}
    >
      <div className="micro-label" style={{ fontSize: "9px", letterSpacing: "0.1em" }}>
        ARCHITECTURAL SYMBOL KEY
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
        {items.map((it, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="14" height="10" viewBox="0 0 14 10" style={{ flexShrink: 0 }}>
              {it.symbol}
            </svg>
            <span style={{ fontSize: "10px", color: "var(--text-2)" }}>{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
