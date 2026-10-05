/**
 * src/components/HazardManager.jsx
 * Active hazard controls with three categories, removable chips, and clear buttons.
 */

import React from "react";
import { t } from "../core/i18n.js";

export default function HazardManager({
  state,
  graph,
  lang,
  actions
}) {
  const nodeMap = new Map();
  graph?.nodes?.forEach((n) => nodeMap.set(n.id, n));

  const edgeMap = new Map();
  graph?.edges?.forEach((e) => edgeMap.set(e.id, e));

  const totalHazards =
    (state.blocked_nodes?.length || 0) +
    (state.blocked_edges?.length || 0) +
    (state.closed_exits?.length || 0);

  const renderGroup = (titleKey, items, type, groupKey) => {
    return (
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "8px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span className="micro-label">{t(lang, titleKey)}</span>
            <span
              className="font-mono"
              style={{
                fontSize: "10px",
                color: items.length > 0 ? "var(--hazard)" : "var(--text-3)",
                fontWeight: 700
              }}
            >
              ({items.length})
            </span>
          </div>

          {items.length > 0 && (
            <button
              onClick={() => actions.clearHazardsGroup(groupKey)}
              style={{
                height: "20px",
                padding: "0 6px",
                fontSize: "10px",
                backgroundColor: "transparent",
                border: "none",
                color: "var(--text-3)"
              }}
            >
              {t(lang, "clearGroup")}
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div style={{ color: "var(--text-3)", fontSize: "11px", fontStyle: "italic" }}>
            None
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {items.map((id) => {
              const label =
                type === "edge"
                  ? `${id} (${edgeMap.get(id)?.from}↔${edgeMap.get(id)?.to})`
                  : `${id} ${nodeMap.get(id)?.label || ""}`;

              return (
                <div
                  key={id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "2px 8px",
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: "var(--raised)",
                    border: `1px solid ${type === "exit" ? "var(--closed)" : "var(--hazard)"}`,
                    fontSize: "11px",
                    color: "var(--text)"
                  }}
                >
                  <span className="font-mono" style={{ fontWeight: 600 }}>
                    {id}
                  </span>
                  <button
                    onClick={() => actions.toggleHazard({ type, id })}
                    title={`Unblock ${id}`}
                    style={{
                      width: "14px",
                      height: "14px",
                      padding: 0,
                      borderRadius: "50%",
                      backgroundColor: "transparent",
                      border: "none",
                      color: "var(--text-2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer"
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="hazard-manager-container">
      {totalHazards === 0 ? (
        <div style={{ padding: "12px 0", color: "var(--text-3)", fontSize: "12px" }}>
          {t(lang, "noHazardsActive")}
        </div>
      ) : (
        <>
          {renderGroup("hazardLocations", state.blocked_nodes || [], "node", "nodes")}
          {renderGroup("hazardCorridors", state.blocked_edges || [], "edge", "edges")}
          {renderGroup("hazardExits", state.closed_exits || [], "exit", "exits")}
        </>
      )}
    </div>
  );
}
