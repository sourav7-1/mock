/**
 * src/components/ShortcutsHelp.jsx
 * Modal dialog displaying all console keyboard hotkeys.
 */

import React from "react";
import { t } from "../core/i18n.js";

export default function ShortcutsHelp({ isOpen, lang, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "S", label: t(lang, "shortcutS") },
    { key: "H", label: t(lang, "shortcutH") },
    { key: "R", label: t(lang, "shortcutR") },
    { key: "L", label: t(lang, "shortcutL") },
    { key: "T", label: t(lang, "shortcutT") },
    { key: "F", label: t(lang, "shortcutF") },
    { key: "P", label: t(lang, "shortcutP") },
    { key: "Ctrl + K", label: t(lang, "shortcutCtrlK") },
    { key: "Ctrl + Z", label: t(lang, "shortcutCtrlZ") },
    { key: "Esc", label: t(lang, "shortcutEsc") }
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "440px" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>
            {t(lang, "shortcutsTitle")}
          </h3>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ width: "24px", height: "24px", border: "none", backgroundColor: "transparent" }}
          >
            ×
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 8px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--raised)",
                border: "1px solid var(--line)"
              }}
            >
              <span style={{ fontSize: "12px", color: "var(--text-2)" }}>{s.label}</span>
              <kbd
                className="font-mono"
                style={{
                  padding: "2px 6px",
                  borderRadius: "3px",
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--line-2)",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--route)"
                }}
              >
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} className="btn-primary">
            {t(lang, "dismiss")}
          </button>
        </div>
      </div>
    </div>
  );
}
