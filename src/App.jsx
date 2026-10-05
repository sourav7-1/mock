/**
 * src/App.jsx
 * Main Application Shell for Smart Escape.
 */

import React, { useState, useEffect } from "react";
import { useSimulator } from "./state/useSimulator.js";
import TopBar from "./components/TopBar.jsx";
import MapCanvas from "./components/MapCanvas.jsx";
import Inspector from "./components/Inspector.jsx";
import StatusConsole from "./components/StatusConsole.jsx";
import DropZone from "./components/DropZone.jsx";
import ErrorPanel from "./components/ErrorPanel.jsx";
import Toast from "./components/Toast.jsx";
import CommandPalette from "./components/CommandPalette.jsx";
import Legend from "./components/Legend.jsx";
import ShortcutsHelp from "./components/ShortcutsHelp.jsx";
import CoachMarks from "./components/CoachMarks.jsx";

export default function App() {
  const sim = useSimulator();
  const [errors, setErrors] = useState(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState(null);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if inside an input or textarea
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          sim.actions.redo();
        } else {
          sim.actions.undo();
        }
        return;
      }

      if (e.key === "Escape") {
        setShortcutsOpen(false);
        setPaletteOpen(false);
        setErrors(null);
        sim.actions.setHoverItem(null);
        return;
      }

      const key = e.key.toLowerCase();
      if (key === "s") {
        e.preventDefault();
        sim.actions.setMode("select");
      } else if (key === "h") {
        e.preventDefault();
        sim.actions.setMode("hazard");
      } else if (key === "r") {
        e.preventDefault();
        sim.actions.resetState();
      } else if (key === "l") {
        e.preventDefault();
        sim.actions.setLang(sim.lang === "en" ? "bn" : "en");
      } else if (key === "t") {
        e.preventDefault();
        sim.actions.setTheme(sim.theme === "dark" ? "light" : "dark");
      } else if (key === "p") {
        e.preventDefault();
        sim.actions.setWalkerPlaying(!sim.walkerPlaying);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sim.actions, sim.lang, sim.theme, sim.walkerPlaying]);

  // Export Map to PNG
  const handleExportPng = () => {
    const svgEl = document.querySelector(".map-canvas-svg");
    if (!svgEl) return;

    try {
      const serializer = new XMLSerializer();
      let source = serializer.serializeToString(svgEl);

      // Add name spaces
      if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = svgEl.clientWidth * 2 || 1600;
        canvas.height = svgEl.clientHeight * 2 || 1200;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = sim.theme === "dark" ? "#111410" : "#F1EDE2";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);

        const a = document.createElement("a");
        const bName = (sim.graph?.building || "smart_escape")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "_");
        a.download = `${bName}_${Date.now()}.png`;
        a.href = canvas.toDataURL("image/png");
        a.click();
      };

      img.src = url;
    } catch (err) {
      console.error("Export PNG failed:", err);
    }
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <TopBar
        graph={sim.graph}
        route={sim.route}
        lang={sim.lang}
        theme={sim.theme}
        actions={sim.actions}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onError={(errs) => setErrors(errs)}
      />

      {/* Main Workspace */}
      <div className="main-workspace">
        {!sim.graph ? (
          <DropZone
            lang={sim.lang}
            onLoaded={(g) => sim.actions.loadGraph(g)}
            onError={(errs) => setErrors(errs)}
          />
        ) : (
          <>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
              <MapCanvas
                graph={sim.graph}
                state={sim.state}
                start={sim.start}
                route={sim.route}
                previousRoute={sim.previousRoute}
                hoverPreview={sim.hoverPreview}
                mode={sim.mode}
                lang={sim.lang}
                walkerEnabled={sim.walkerEnabled}
                walkerPlaying={sim.walkerPlaying}
                walkerSpeed={sim.walkerSpeed}
                activeTimelineIndex={sim.activeTimelineIndex}
                highlightedElement={highlightedElement}
                actions={sim.actions}
              />
              <Legend lang={sim.lang} />
              <StatusConsole
                route={sim.route}
                lang={sim.lang}
                lastCostDelta={sim.lastCostDelta}
                walkerEnabled={sim.walkerEnabled}
                walkerPlaying={sim.walkerPlaying}
                walkerSpeed={sim.walkerSpeed}
                actions={sim.actions}
              />
            </div>

            <Inspector
              graph={sim.graph}
              state={sim.state}
              start={sim.start}
              route={sim.route}
              mode={sim.mode}
              lang={sim.lang}
              history={sim.history}
              activeTimelineIndex={sim.activeTimelineIndex}
              onHighlight={setHighlightedElement}
              actions={sim.actions}
              onExportPng={handleExportPng}
            />
          </>
        )}
      </div>

      {/* Overlays, Toasts and Modals */}
      <ErrorPanel
        errors={errors}
        lang={sim.lang}
        onClose={() => setErrors(null)}
      />

      <Toast
        toast={sim.toast}
        lang={sim.lang}
        onUndo={sim.actions.undo}
        onDismiss={sim.actions.dismissToast}
      />

      <CommandPalette
        isOpen={paletteOpen}
        graph={sim.graph}
        lang={sim.lang}
        onClose={() => setPaletteOpen(false)}
        actions={sim.actions}
        onFocusElement={(id) => setHighlightedElement(id)}
      />

      <ShortcutsHelp
        isOpen={shortcutsOpen}
        lang={sim.lang}
        onClose={() => setShortcutsOpen(false)}
      />

      <CoachMarks lang={sim.lang} />
    </div>
  );
}
