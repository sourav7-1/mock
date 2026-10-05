/**
 * src/components/ErrorPanel.jsx
 * Inline modal error panel with vermilion left border and multi-error list.
 */

import React from "react";
import { t } from "../core/i18n.js";

export default function ErrorPanel({ errors, lang, onClose }) {
  if (!errors || errors.length === 0) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          borderLeft: "4px solid var(--hazard)",
          maxWidth: "480px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "var(--hazard)", fontWeight: 700, fontSize: "15px" }}>
              ⚠️ {t(lang, "fileRejected")}
            </span>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ width: "24px", height: "24px", border: "none", backgroundColor: "transparent" }}
          >
            ×
          </button>
        </div>

        <p style={{ color: "var(--text-2)", fontSize: "12px", marginBottom: "12px" }}>
          {t(lang, "fixIssuesPrompt")}
        </p>

        <ul
          style={{
            listStyleType: "none",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            maxHeight: "300px",
            overflowY: "auto",
            paddingRight: "4px"
          }}
        >
          {errors.map((err, i) => (
            <li
              key={i}
              style={{
                backgroundColor: "var(--raised)",
                padding: "8px 10px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--line)",
                fontSize: "12px",
                color: "var(--text)",
                lineHeight: "1.4"
              }}
            >
              <div style={{ color: "var(--hazard)", fontWeight: 600, fontSize: "11px", marginBottom: "2px" }} className="font-mono">
                {err.code}
              </div>
              <div>{t(lang, err.code, err.params || {})}</div>
            </li>
          ))}
        </ul>

        <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} className="btn-primary">
            {t(lang, "dismiss")}
          </button>
        </div>
      </div>
    </div>
  );
}
