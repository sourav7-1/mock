/**
 * src/components/CommandPalette.jsx
 * Ctrl+K fuzzy command palette for searching building elements and executing actions.
 */

import React, { useState, useEffect, useRef } from "react";
import { t } from "../core/i18n.js";

export default function CommandPalette({
  isOpen,
  graph,
  lang,
  onClose,
  actions,
  onFocusElement
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen || !graph) return null;

  // Filter nodes and edges
  const q = query.trim().toLowerCase();
  const results = [];

  graph.nodes?.forEach((n) => {
    if (!q || n.id.toLowerCase().includes(q) || n.label.toLowerCase().includes(q) || n.type.toLowerCase().includes(q)) {
      results.push({
        type: "node",
        id: n.id,
        label: n.label,
        category: n.type,
        raw: n
      });
    }
  });

  graph.edges?.forEach((e) => {
    const label = `Corridor ${e.id} (${e.from}↔${e.to}, cost ${e.cost})`;
    if (!q || e.id.toLowerCase().includes(q) || e.from.toLowerCase().includes(q) || e.to.toLowerCase().includes(q)) {
      results.push({
        type: "edge",
        id: e.id,
        label,
        category: "corridor",
        raw: e
      });
    }
  });

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((idx) => (idx + 1) % Math.max(1, results.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((idx) => (idx - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[selectedIndex];
      if (item) {
        handleExecute(item, "toggle");
      }
    }
  };

  const handleExecute = (item, actionType) => {
    if (actionType === "start" && item.type === "node" && item.category !== "exit") {
      actions.setStart(item.id);
    } else if (actionType === "toggle") {
      actions.toggleHazard({
        type: item.type === "edge" ? "edge" : item.category === "exit" ? "exit" : "node",
        id: item.id
      });
    } else if (actionType === "focus") {
      onFocusElement(item.id);
    }
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "560px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "var(--raised)",
            padding: "8px 12px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--line)"
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={t(lang, "palettePlaceholder")}
            style={{
              flex: 1,
              backgroundColor: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text)",
              fontSize: "13px"
            }}
          />
          <span className="font-mono micro-label" style={{ color: "var(--text-3)" }}>
            ESC
          </span>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: "320px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
          {results.length === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-3)", fontSize: "12px" }}>
              {t(lang, "paletteNoResults")}
            </div>
          ) : (
            results.slice(0, 30).map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: isSelected ? "var(--raised)" : "transparent",
                    border: `1px solid ${isSelected ? "var(--line-2)" : "transparent"}`,
                    cursor: "pointer"
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      className="font-mono"
                      style={{
                        fontWeight: 700,
                        color: isSelected ? "var(--route)" : "var(--text)",
                        fontSize: "12px"
                      }}
                    >
                      {item.id}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--text-2)" }}>{item.label}</span>
                    <span className="font-mono micro-label" style={{ fontSize: "9px" }}>
                      {item.category.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "6px" }}>
                    {item.type === "node" && item.category !== "exit" && (
                      <button
                        onClick={() => handleExecute(item, "start")}
                        style={{ height: "22px", padding: "0 6px", fontSize: "10px" }}
                      >
                        Start
                      </button>
                    )}
                    <button
                      onClick={() => handleExecute(item, "toggle")}
                      style={{ height: "22px", padding: "0 6px", fontSize: "10px" }}
                    >
                      Toggle
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
