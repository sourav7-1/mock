/**
 * src/components/DropZone.jsx
 * Technical empty-state blueprint dropzone with collapsible schema specification.
 */

import React, { useState, useRef } from "react";
import { t } from "../core/i18n.js";
import { validateBuilding } from "../core/validate.js";

export default function DropZone({ lang, onLoaded, onError }) {
  const [isOver, setIsOver] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const res = validateBuilding(e.target.result);
      if (res.ok) {
        onLoaded(res.data);
      } else {
        onError(res.errors);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsOver(false);
    const file = e.dataTransfer?.files?.[0];
    handleFile(file);
  };

  const handleLoadSample = async () => {
    try {
      const res = await fetch("./sample/building.json");
      if (!res.ok) throw new Error("Could not fetch sample/building.json");
      const data = await res.json();
      const val = validateBuilding(data);
      if (val.ok) {
        onLoaded(val.data);
      } else {
        onError(val.errors);
      }
    } catch (err) {
      onError([{ code: "INVALID_JSON", params: { message: err.message } }]);
    }
  };

  const schemaExample = `{
  "building": "Science Complex Level 1",
  "nodes": [
    { "id": "R1", "label": "Room 101", "type": "room", "x": 120, "y": 140 },
    { "id": "C1", "label": "Corridor West", "type": "junction", "x": 280, "y": 140 },
    { "id": "E1", "label": "Exit North-East", "type": "exit", "x": 600, "y": 140 }
  ],
  "edges": [
    { "id": "e1", "from": "R1", "to": "C1", "cost": 2 },
    { "id": "e2", "from": "C1", "to": "E1", "cost": 3 }
  ],
  "initial_state": {
    "blocked_nodes": [],
    "blocked_edges": [],
    "closed_exits": []
  }
}`;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px"
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: "none" }}
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsOver(true);
        }}
        onDragLeave={() => setIsOver(false)}
        onDrop={handleDrop}
        style={{
          maxWidth: "520px",
          width: "100%",
          padding: "36px 24px",
          backgroundColor: isOver ? "var(--raised)" : "var(--surface)",
          border: `2px dashed ${isOver ? "var(--route)" : "var(--line-2)"}`,
          borderRadius: "var(--radius-md)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          boxShadow: isOver ? "0 0 16px rgba(212, 242, 90, 0.15)" : "none",
          transition: "all 150ms ease"
        }}
      >
        {/* Line-drawn floor plan glyph */}
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "var(--radius-sm)",
            backgroundColor: "var(--raised)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid var(--line)"
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--route)" strokeWidth="1.6">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9M15 9v12" />
          </svg>
        </div>

        {/* Headings */}
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>
            {t(lang, "dropzoneTitle")}
          </h2>
          <p style={{ fontSize: "12px", color: "var(--text-2)" }}>
            {t(lang, "dropzoneSubtitle")}
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
          <button
            className="btn-primary"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {t(lang, "importFile")}
          </button>

          <button onClick={handleLoadSample}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
            {t(lang, "loadSample")}
          </button>
        </div>

        {/* Collapsible Schema Reference */}
        <div style={{ width: "100%", marginTop: "12px" }}>
          <button
            onClick={() => setShowSchema(!showSchema)}
            style={{
              backgroundColor: "transparent",
              border: "none",
              color: "var(--text-3)",
              fontSize: "11px",
              padding: "4px 8px"
            }}
          >
            {showSchema ? "▲" : "▼"} {t(lang, "schemaReference")}
          </button>

          {showSchema && (
            <pre
              className="font-mono"
              style={{
                marginTop: "8px",
                padding: "12px",
                backgroundColor: "var(--bg)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius-sm)",
                fontSize: "11px",
                textAlign: "left",
                color: "var(--text-2)",
                overflowX: "auto",
                lineHeight: "1.4"
              }}
            >
              {schemaExample}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
