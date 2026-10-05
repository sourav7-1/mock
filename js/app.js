/**
 * js/app.js
 * Night-shift Operations Console Controller
 * Pan/Zoom engine, hover preview, route diff, undo stack, command palette, and coach marks.
 */

import { validateBuilding } from "./validate.js";
import { findEvacuationRoute } from "./router.js";
import { renderGraph, renderInspector } from "./render.js";
import { t, setLanguage, getLanguage, updateDomTranslations } from "./i18n.js";

// Offline Embedded Fallback
const FALLBACK_SAMPLE_JSON = {
  building: "Science Complex Level 1",
  nodes: [
    { id: "R1", label: "Room 101", type: "room", x: 120, y: 140 },
    { id: "R2", label: "Room 102", type: "room", x: 120, y: 360 },
    { id: "C1", label: "Corridor West", type: "junction", x: 280, y: 140 },
    { id: "C2", label: "Corridor East", type: "junction", x: 440, y: 140 },
    { id: "C3", label: "Hallway West", type: "junction", x: 280, y: 360 },
    { id: "C4", label: "Hallway East", type: "junction", x: 440, y: 360 },
    { id: "E1", label: "Exit North-East", type: "exit", x: 600, y: 140 },
    { id: "E2", label: "Exit South-East", type: "exit", x: 600, y: 360 }
  ],
  edges: [
    { id: "e1", from: "R1", to: "C1", cost: 2 },
    { id: "e2", from: "C1", to: "C2", cost: 2 },
    { id: "e3", from: "C2", to: "E1", cost: 3 },
    { id: "e4", from: "C1", to: "C3", cost: 4 },
    { id: "e5", from: "R2", to: "C3", cost: 2 },
    { id: "e6", from: "C3", to: "C4", cost: 2 },
    { id: "e7", from: "C4", to: "E2", cost: 3 }
  ],
  initial_state: {
    blocked_nodes: [],
    blocked_edges: [],
    closed_exits: []
  }
};

// Application State
let appState = {
  graph: null,
  originalInitialState: null,
  currentStart: "R1",
  activeMode: "select", // "select" | "hazard"
  state: {
    blocked_nodes: [],
    blocked_edges: [],
    closed_exits: []
  },
  routeResult: null,
  ghostRoute: null,
  diffRoute: null,
  diffTimer: null,
  costDeltaStr: null,
  highlightedSegment: null,
  undoStack: [],
  theme: "dark", // Dark theme is default
  zoom: { x: 0, y: 0, scale: 1 },
  isPanning: false,
  panStart: { x: 0, y: 0 }
};

// DOM References
let svgCanvas = null;
let canvasViewport = null;
let statusConsoleEl = null;
let controlInspectorEl = null;
let fileInputEl = null;
let inlineValBoxEl = null;
let valIssuesListEl = null;
let emptyFrameEl = null;
let consoleTooltipEl = null;
let consoleToastEl = null;
let toastMsgEl = null;
let toastTimer = null;
let commandPaletteEl = null;
let paletteInputEl = null;
let paletteResultsListEl = null;
let shortcutsPopoverEl = null;
let coachMarksBarEl = null;
let failureOverlayEl = null;
let failTitleEl = null;
let failDescEl = null;
let btnFailActionEl = null;
let systemDotEl = null;
let systemStatusTextEl = null;

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function initApp() {
  svgCanvas = document.getElementById("svgCanvas");
  canvasViewport = document.getElementById("canvasViewport");
  statusConsoleEl = document.getElementById("statusConsole");
  controlInspectorEl = document.getElementById("controlInspector");
  fileInputEl = document.getElementById("fileInput");
  inlineValBoxEl = document.getElementById("inlineValBox");
  valIssuesListEl = document.getElementById("valIssuesList");
  emptyFrameEl = document.getElementById("emptyFrame");
  consoleTooltipEl = document.getElementById("consoleTooltip");
  consoleToastEl = document.getElementById("consoleToast");
  toastMsgEl = document.getElementById("toastMsg");
  commandPaletteEl = document.getElementById("commandPalette");
  paletteInputEl = document.getElementById("paletteInput");
  paletteResultsListEl = document.getElementById("paletteResultsList");
  shortcutsPopoverEl = document.getElementById("shortcutsPopover");
  coachMarksBarEl = document.getElementById("coachMarksBar");
  failureOverlayEl = document.getElementById("failureOverlay");
  failTitleEl = document.getElementById("failTitle");
  failDescEl = document.getElementById("failDesc");
  btnFailActionEl = document.getElementById("btnFailAction");
  systemDotEl = document.getElementById("systemDot");
  systemStatusTextEl = document.getElementById("systemStatusText");

  bindEvents();
  loadSavedState();

  if (!appState.graph) {
    loadSampleBuilding();
  } else {
    recomputeAndRender();
  }

  checkFirstRunCoach();
}

function bindEvents() {
  // Theme Toggle
  const btnThemeToggle = document.getElementById("btnThemeToggle");
  if (btnThemeToggle) {
    btnThemeToggle.addEventListener("click", toggleTheme);
  }

  // Language Segmented Control
  const btnLangEn = document.getElementById("btnLangEn");
  const btnLangBn = document.getElementById("btnLangBn");
  if (btnLangEn && btnLangBn) {
    btnLangEn.addEventListener("click", () => setAppLanguage("en"));
    btnLangBn.addEventListener("click", () => setAppLanguage("bn"));
  }

  // File Upload
  const btnUpload = document.getElementById("btnUpload");
  if (btnUpload && fileInputEl) {
    btnUpload.addEventListener("click", () => fileInputEl.click());
    fileInputEl.addEventListener("change", handleFileSelect);
  }

  const btnEmptyUpload = document.getElementById("btnEmptyUpload");
  if (btnEmptyUpload && fileInputEl) {
    btnEmptyUpload.addEventListener("click", () => fileInputEl.click());
  }

  // Sample Building
  const btnLoadSample = document.getElementById("btnLoadSample");
  if (btnLoadSample) {
    btnLoadSample.addEventListener("click", loadSampleBuilding);
  }

  const btnEmptySample = document.getElementById("btnEmptySample");
  if (btnEmptySample) {
    btnEmptySample.addEventListener("click", loadSampleBuilding);
  }

  // Reset Hazards
  const btnReset = document.getElementById("btnReset");
  if (btnReset) {
    btnReset.addEventListener("click", handleReset);
  }

  // Export PNG
  const btnExportPng = document.getElementById("btnExportPng");
  if (btnExportPng) {
    btnExportPng.addEventListener("click", exportMapAsPng);
  }

  // Zoom Controls
  const btnZoomIn = document.getElementById("btnZoomIn");
  const btnZoomOut = document.getElementById("btnZoomOut");
  const btnZoomFit = document.getElementById("btnZoomFit");

  if (btnZoomIn) btnZoomIn.addEventListener("click", () => adjustZoom(1.2));
  if (btnZoomOut) btnZoomOut.addEventListener("click", () => adjustZoom(0.8));
  if (btnZoomFit) btnZoomFit.addEventListener("click", fitZoom);

  // Pan & Wheel Zoom on Canvas Viewport
  if (canvasViewport) {
    canvasViewport.addEventListener("wheel", handleWheelZoom, { passive: false });
    canvasViewport.addEventListener("mousedown", handlePanStart);
    window.addEventListener("mousemove", handlePanMove);
    window.addEventListener("mouseup", handlePanEnd);

    // Drag-and-drop
    canvasViewport.addEventListener("dragover", (e) => e.preventDefault());
    canvasViewport.addEventListener("drop", handleFileDrop);
  }

  // Toast Undo
  const btnToastUndo = document.getElementById("btnToastUndo");
  if (btnToastUndo) {
    btnToastUndo.addEventListener("click", handleUndo);
  }

  // Command Palette
  const btnCommandPalette = document.getElementById("btnCommandPalette");
  if (btnCommandPalette) {
    btnCommandPalette.addEventListener("click", openCommandPalette);
  }

  if (paletteInputEl) {
    paletteInputEl.addEventListener("input", handlePaletteSearch);
    paletteInputEl.addEventListener("keydown", handlePaletteKeydown);
  }

  if (commandPaletteEl) {
    commandPaletteEl.addEventListener("click", (e) => {
      if (e.target === commandPaletteEl) closeCommandPalette();
    });
  }

  // Shortcuts Dialog
  const btnShortcuts = document.getElementById("btnShortcuts");
  const btnCloseShortcuts = document.getElementById("btnCloseShortcuts");
  if (btnShortcuts && shortcutsPopoverEl) {
    btnShortcuts.addEventListener("click", () => {
      shortcutsPopoverEl.classList.toggle("visible");
    });
  }
  if (btnCloseShortcuts && shortcutsPopoverEl) {
    btnCloseShortcuts.addEventListener("click", () => {
      shortcutsPopoverEl.classList.remove("visible");
    });
  }

  // Dismiss Validation
  const btnDismissVal = document.getElementById("btnDismissVal");
  if (btnDismissVal && inlineValBoxEl) {
    btnDismissVal.addEventListener("click", () => {
      inlineValBoxEl.classList.remove("visible");
    });
  }

  // Dismiss Coach Marks
  const btnDismissCoach = document.getElementById("btnDismissCoach");
  if (btnDismissCoach && coachMarksBarEl) {
    btnDismissCoach.addEventListener("click", () => {
      coachMarksBarEl.classList.remove("visible");
      try {
        localStorage.setItem("coach_dismissed", "true");
      } catch (_) {}
    });
  }

  // Failure Action (Unblock start)
  if (btnFailActionEl) {
    btnFailActionEl.addEventListener("click", handleUnblockStart);
  }

  // Global Keydown Handler
  window.addEventListener("keydown", handleGlobalShortcuts);
}

function handleGlobalShortcuts(e) {
  // Ignore inside inputs or textarea except Escape / Ctrl
  const isInput = e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA";

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    openCommandPalette();
    return;
  }

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
    e.preventDefault();
    handleUndo();
    return;
  }

  if (e.key === "Escape") {
    if (commandPaletteEl && commandPaletteEl.classList.contains("visible")) {
      closeCommandPalette();
      return;
    }
    if (shortcutsPopoverEl && shortcutsPopoverEl.classList.contains("visible")) {
      shortcutsPopoverEl.classList.remove("visible");
      return;
    }
    if (inlineValBoxEl && inlineValBoxEl.classList.contains("visible")) {
      inlineValBoxEl.classList.remove("visible");
      return;
    }
    return;
  }

  if (isInput) return;

  const k = e.key.toLowerCase();
  if (k === "s") {
    e.preventDefault();
    setInteractionMode("select");
  } else if (k === "h") {
    e.preventDefault();
    setInteractionMode("hazard");
  } else if (k === "r") {
    e.preventDefault();
    handleReset();
  } else if (k === "l") {
    e.preventDefault();
    const nextLang = getLanguage() === "en" ? "bn" : "en";
    setAppLanguage(nextLang);
  } else if (k === "t") {
    e.preventDefault();
    toggleTheme();
  } else if (k === "f") {
    e.preventDefault();
    fitZoom();
  } else if (e.key === "?" || (e.shiftKey && e.key === "?")) {
    e.preventDefault();
    if (shortcutsPopoverEl) shortcutsPopoverEl.classList.toggle("visible");
  }
}

// Pan & Zoom Engine
function handleWheelZoom(e) {
  e.preventDefault();
  const rect = canvasViewport.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const delta = e.deltaY < 0 ? 1.12 : 0.88;
  const newScale = Math.min(Math.max(appState.zoom.scale * delta, 0.4), 4);

  // Zoom centered at cursor
  appState.zoom.x = mouseX - (mouseX - appState.zoom.x) * (newScale / appState.zoom.scale);
  appState.zoom.y = mouseY - (mouseY - appState.zoom.y) * (newScale / appState.zoom.scale);
  appState.zoom.scale = newScale;

  updateCanvasTransform();
}

function handlePanStart(e) {
  // Only start pan on viewport or svg background, not on interactive nodes/edges
  if (e.target.closest(".node-g") || e.target.closest(".edge-item") || e.target.closest(".map-view-controls")) {
    return;
  }
  appState.isPanning = true;
  appState.panStart = { x: e.clientX - appState.zoom.x, y: e.clientY - appState.zoom.y };
}

function handlePanMove(e) {
  if (!appState.isPanning) return;
  appState.zoom.x = e.clientX - appState.panStart.x;
  appState.zoom.y = e.clientY - appState.panStart.y;
  updateCanvasTransform();
}

function handlePanEnd() {
  appState.isPanning = false;
}

function adjustZoom(factor) {
  const rect = canvasViewport.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const newScale = Math.min(Math.max(appState.zoom.scale * factor, 0.4), 4);

  appState.zoom.x = centerX - (centerX - appState.zoom.x) * (newScale / appState.zoom.scale);
  appState.zoom.y = centerY - (centerY - appState.zoom.y) * (newScale / appState.zoom.scale);
  appState.zoom.scale = newScale;

  updateCanvasTransform();
}

function fitZoom() {
  appState.zoom = { x: 0, y: 0, scale: 1 };
  updateCanvasTransform();
}

function updateCanvasTransform() {
  const rootG = document.getElementById("viewportTransformGroup");
  if (rootG) {
    rootG.setAttribute(
      "transform",
      `translate(${appState.zoom.x}, ${appState.zoom.y}) scale(${appState.zoom.scale})`
    );
  }
}

function setInteractionMode(mode) {
  appState.activeMode = mode;
  if (canvasViewport) {
    canvasViewport.classList.toggle("mode-select", mode === "select");
    canvasViewport.classList.toggle("mode-hazard", mode === "hazard");
  }
  appState.ghostRoute = null;
  recomputeAndRender();
}

function toggleTheme() {
  appState.theme = appState.theme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", appState.theme);

  const themeText = document.getElementById("themeToggleText");
  if (themeText) {
    themeText.textContent = appState.theme === "dark" ? t("themeToggleDark") : t("themeToggleLight");
  }

  saveStateToStorage();
}

function setAppLanguage(lang) {
  setLanguage(lang);

  const btnLangEn = document.getElementById("btnLangEn");
  const btnLangBn = document.getElementById("btnLangBn");
  if (btnLangEn && btnLangBn) {
    btnLangEn.classList.toggle("active", lang === "en");
    btnLangEn.setAttribute("aria-pressed", lang === "en");
    btnLangBn.classList.toggle("active", lang === "bn");
    btnLangBn.setAttribute("aria-pressed", lang === "bn");
  }

  const themeText = document.getElementById("themeToggleText");
  if (themeText) {
    themeText.textContent = appState.theme === "dark" ? t("themeToggleDark") : t("themeToggleLight");
  }

  saveStateToStorage();
  recomputeAndRender();
}

async function loadSampleBuilding() {
  try {
    const res = await fetch("sample/building.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    processLoadedData(data);
  } catch (err) {
    console.warn("Fetch failed, using embedded fallback:", err);
    processLoadedData(FALLBACK_SAMPLE_JSON);
  }
}

function handleFileSelect(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  readFile(file);
  e.target.value = "";
}

function handleFileDrop(e) {
  e.preventDefault();
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
    readFile(e.dataTransfer.files[0]);
  }
}

function readFile(file) {
  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      processLoadedData(evt.target.result);
    } catch (err) {
      showValidationReport([t("errInvalidJson", { msg: err.message })]);
    }
  };
  reader.onerror = () => {
    showValidationReport(["Failed to read the selected file."]);
  };
  reader.readAsText(file);
}

function processLoadedData(raw) {
  const result = validateBuilding(raw);
  if (!result.valid) {
    showValidationReport(result.errors);
    return;
  }

  if (inlineValBoxEl) inlineValBoxEl.classList.remove("visible");

  const data = result.data;
  appState.graph = {
    building: data.building,
    nodes: data.nodes,
    edges: data.edges,
    initial_state: deepClone(data.initial_state)
  };

  appState.originalInitialState = deepClone(data.initial_state);
  appState.state = deepClone(data.initial_state);
  appState.undoStack = [];
  appState.diffRoute = null;
  appState.costDeltaStr = null;

  const candidate =
    data.nodes.find((n) => n.type === "room" && !appState.state.blocked_nodes.includes(n.id)) ||
    data.nodes.find((n) => n.type === "junction" && !appState.state.blocked_nodes.includes(n.id));

  appState.currentStart = candidate ? candidate.id : null;

  if (emptyFrameEl) emptyFrameEl.classList.remove("visible");

  const headerFacilityName = document.getElementById("headerFacilityName");
  if (headerFacilityName) headerFacilityName.textContent = data.building;

  fitZoom();
  saveStateToStorage();
  recomputeAndRender();
}

function showValidationReport(errors) {
  if (!inlineValBoxEl || !valIssuesListEl) {
    alert("Validation Errors:\n\n" + errors.join("\n"));
    return;
  }

  valIssuesListEl.innerHTML = errors
    .map((err) => `<li class="val-issue-line">${err}</li>`)
    .join("");

  inlineValBoxEl.classList.add("visible");
}

function handleNodeClick(nodeId, nodeType) {
  if (appState.activeMode === "select") {
    if (nodeType === "exit") return; // Exits cannot be start

    appState.currentStart = nodeId;
    recomputeAndRender();
  } else {
    pushUndoState();
    toggleNodeHazard(nodeId, nodeType);
    triggerUndoToast(nodeId);
  }
}

function handleNodeContextMenu(nodeId, nodeType) {
  pushUndoState();
  toggleNodeHazard(nodeId, nodeType);
  triggerUndoToast(nodeId);
}

function toggleNodeHazard(nodeId, nodeType) {
  savePreviousRouteForDiff();

  if (nodeType === "exit") {
    const idx = appState.state.closed_exits.indexOf(nodeId);
    if (idx >= 0) appState.state.closed_exits.splice(idx, 1);
    else appState.state.closed_exits.push(nodeId);
  } else {
    const idx = appState.state.blocked_nodes.indexOf(nodeId);
    if (idx >= 0) appState.state.blocked_nodes.splice(idx, 1);
    else appState.state.blocked_nodes.push(nodeId);
  }

  appState.ghostRoute = null;
  recomputeAndRender();
}

function handleEdgeClick(edgeId) {
  pushUndoState();
  toggleEdgeHazard(edgeId);
  triggerUndoToast(edgeId);
}

function handleEdgeContextMenu(edgeId) {
  pushUndoState();
  toggleEdgeHazard(edgeId);
  triggerUndoToast(edgeId);
}

function toggleEdgeHazard(edgeId) {
  savePreviousRouteForDiff();

  const idx = appState.state.blocked_edges.indexOf(edgeId);
  if (idx >= 0) appState.state.blocked_edges.splice(idx, 1);
  else appState.state.blocked_edges.push(edgeId);

  appState.ghostRoute = null;
  recomputeAndRender();
}

function handleRemoveHazard(type, id) {
  pushUndoState();
  savePreviousRouteForDiff();

  if (type === "node") {
    const idx = appState.state.blocked_nodes.indexOf(id);
    if (idx >= 0) appState.state.blocked_nodes.splice(idx, 1);
  } else if (type === "edge") {
    const idx = appState.state.blocked_edges.indexOf(id);
    if (idx >= 0) appState.state.blocked_edges.splice(idx, 1);
  } else if (type === "exit") {
    const idx = appState.state.closed_exits.indexOf(id);
    if (idx >= 0) appState.state.closed_exits.splice(idx, 1);
  }

  appState.ghostRoute = null;
  recomputeAndRender();
}

function handleClearGroup(group) {
  pushUndoState();
  savePreviousRouteForDiff();

  if (group === "nodes") appState.state.blocked_nodes = [];
  else if (group === "edges") appState.state.blocked_edges = [];
  else if (group === "exits") appState.state.closed_exits = [];

  recomputeAndRender();
}

function handleReset() {
  if (!appState.originalInitialState) return;

  pushUndoState();
  savePreviousRouteForDiff();
  appState.state = deepClone(appState.originalInitialState);

  if (appState.state.blocked_nodes.includes(appState.currentStart)) {
    const candidate = appState.graph.nodes.find(
      (n) => n.type !== "exit" && !appState.state.blocked_nodes.includes(n.id)
    );
    appState.currentStart = candidate ? candidate.id : null;
  }

  appState.ghostRoute = null;
  recomputeAndRender();
}

function handleUnblockStart() {
  if (!appState.currentStart) return;
  pushUndoState();
  savePreviousRouteForDiff();

  const idx = appState.state.blocked_nodes.indexOf(appState.currentStart);
  if (idx >= 0) {
    appState.state.blocked_nodes.splice(idx, 1);
  }

  recomputeAndRender();
}

// Route Diff Calculation
function savePreviousRouteForDiff() {
  if (appState.routeResult && appState.routeResult.status === "ok") {
    appState.diffRoute = [...appState.routeResult.path];
    const prevCost = appState.routeResult.cost;

    clearTimeout(appState.diffTimer);
    appState.diffTimer = setTimeout(() => {
      appState.diffRoute = null;
      appState.costDeltaStr = null;
      recomputeAndRender();
    }, 1200);

    appState._prevCostForDiff = prevCost;
  }
}

// Hover Preview (In Hazard Mode: compute preview before click)
function handleElementHover(info) {
  if (!consoleTooltipEl) return;

  if (!info) {
    consoleTooltipEl.classList.remove("visible");
    if (appState.ghostRoute) {
      appState.ghostRoute = null;
      recomputeAndRender();
    }
    return;
  }

  const rect = canvasViewport.getBoundingClientRect();
  const x = info.evt.clientX - rect.left + 14;
  const y = info.evt.clientY - rect.top + 14;

  consoleTooltipEl.style.left = `${x}px`;
  consoleTooltipEl.style.top = `${y}px`;

  if (info.type === "node") {
    consoleTooltipEl.innerHTML = `
      <div class="tooltip-title-mono">${info.id} · ${escapeHtml(info.label)}</div>
      <div class="tooltip-sub-mono">${t("tooltipType")}: ${info.nodeType.toUpperCase()}</div>
      <div class="tooltip-sub-mono">${t("tooltipStatus")}: ${info.status}</div>
    `;

    // If in hazard mode, preview effect of toggling this node
    if (appState.activeMode === "hazard" && appState.graph && appState.currentStart) {
      computeGhostPreview("node", info.id, info.nodeType);
    }
  } else {
    consoleTooltipEl.innerHTML = `
      <div class="tooltip-title-mono">CORRIDOR ${info.id} (${info.label})</div>
      <div class="tooltip-sub-mono">${t("tooltipCost")}: ${info.cost}</div>
      <div class="tooltip-sub-mono">${t("tooltipStatus")}: ${info.status}</div>
    `;

    if (appState.activeMode === "hazard" && appState.graph && appState.currentStart) {
      computeGhostPreview("edge", info.id);
    }
  }

  consoleTooltipEl.classList.add("visible");
}

function computeGhostPreview(type, id, nodeType = "room") {
  const previewState = deepClone(appState.state);

  if (type === "node") {
    if (nodeType === "exit") {
      const idx = previewState.closed_exits.indexOf(id);
      if (idx >= 0) previewState.closed_exits.splice(idx, 1);
      else previewState.closed_exits.push(id);
    } else {
      const idx = previewState.blocked_nodes.indexOf(id);
      if (idx >= 0) previewState.blocked_nodes.splice(idx, 1);
      else previewState.blocked_nodes.push(id);
    }
  } else {
    const idx = previewState.blocked_edges.indexOf(id);
    if (idx >= 0) previewState.blocked_edges.splice(idx, 1);
    else previewState.blocked_edges.push(id);
  }

  const previewRes = findEvacuationRoute(appState.graph, appState.currentStart, previewState);
  if (previewRes && previewRes.status === "ok") {
    appState.ghostRoute = previewRes.path;
    recomputeAndRender();
  }
}

// Undo Stack & Toast
function pushUndoState() {
  appState.undoStack.push(deepClone(appState.state));
  if (appState.undoStack.length > 20) appState.undoStack.shift();
}

function handleUndo() {
  if (appState.undoStack.length === 0) return;
  savePreviousRouteForDiff();
  appState.state = appState.undoStack.pop();
  if (consoleToastEl) consoleToastEl.classList.remove("visible");
  recomputeAndRender();
}

function triggerUndoToast(targetId) {
  if (!consoleToastEl || !toastMsgEl) return;
  toastMsgEl.textContent = t("undoToastMsg", { id: targetId });
  consoleToastEl.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    consoleToastEl.classList.remove("visible");
  }, 4000);
}

// Command Palette System (Ctrl+K)
function openCommandPalette() {
  if (!commandPaletteEl || !paletteInputEl) return;
  commandPaletteEl.classList.add("visible");
  paletteInputEl.value = "";
  paletteInputEl.focus();
  renderPaletteResults("");
}

function closeCommandPalette() {
  if (commandPaletteEl) commandPaletteEl.classList.remove("visible");
}

function handlePaletteSearch(e) {
  renderPaletteResults(e.target.value.trim().toLowerCase());
}

function handlePaletteKeydown(e) {
  const items = paletteResultsListEl.querySelectorAll(".palette-item");
  let selectedIdx = Array.from(items).findIndex((el) => el.classList.contains("selected"));

  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (items.length === 0) return;
    if (selectedIdx >= 0) items[selectedIdx].classList.remove("selected");
    selectedIdx = (selectedIdx + 1) % items.length;
    items[selectedIdx].classList.add("selected");
    items[selectedIdx].scrollIntoView({ block: "nearest" });
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (items.length === 0) return;
    if (selectedIdx >= 0) items[selectedIdx].classList.remove("selected");
    selectedIdx = (selectedIdx - 1 + items.length) % items.length;
    items[selectedIdx].classList.add("selected");
    items[selectedIdx].scrollIntoView({ block: "nearest" });
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (selectedIdx >= 0 && items[selectedIdx]) {
      items[selectedIdx].click();
    }
  }
}

function renderPaletteResults(query) {
  if (!paletteResultsListEl || !appState.graph) return;

  const results = [];

  // Match nodes
  appState.graph.nodes.forEach((n) => {
    if (!query || n.id.toLowerCase().includes(query) || n.label.toLowerCase().includes(query)) {
      results.push({
        type: "node",
        id: n.id,
        label: n.label,
        sub: n.type.toUpperCase()
      });
    }
  });

  // Match edges
  appState.graph.edges.forEach((e) => {
    if (!query || e.id.toLowerCase().includes(query) || e.from.toLowerCase().includes(query) || e.to.toLowerCase().includes(query)) {
      results.push({
        type: "edge",
        id: e.id,
        label: `${e.from} ↔ ${e.to} (Cost ${e.cost})`,
        sub: "CORRIDOR"
      });
    }
  });

  // Action commands
  if (!query || "reset".includes(query)) {
    results.push({ type: "action", id: "reset", label: "Reset Hazards to Initial State", sub: "ACTION" });
  }
  if (!query || "theme".includes(query)) {
    results.push({ type: "action", id: "theme", label: "Toggle Night/Day Shift Theme", sub: "ACTION" });
  }

  paletteResultsListEl.innerHTML = results
    .slice(0, 10)
    .map(
      (item, idx) => `
    <li class="palette-item ${idx === 0 ? "selected" : ""}" data-type="${item.type}" data-id="${item.id}">
      <div class="palette-item-left">
        <span class="mono" style="font-weight: 600;">${item.id}</span>
        <span>${escapeHtml(item.label)}</span>
      </div>
      <span class="palette-item-badge">${item.sub}</span>
    </li>
  `
    )
    .join("");

  paletteResultsListEl.querySelectorAll(".palette-item").forEach((li) => {
    li.addEventListener("click", () => {
      const type = li.getAttribute("data-type");
      const id = li.getAttribute("data-id");

      if (type === "action") {
        if (id === "reset") handleReset();
        else if (id === "theme") toggleTheme();
      } else if (type === "node") {
        if (appState.activeMode === "select") {
          const node = appState.graph.nodes.find((n) => n.id === id);
          if (node && node.type !== "exit") {
            appState.currentStart = id;
            recomputeAndRender();
          }
        } else {
          const node = appState.graph.nodes.find((n) => n.id === id);
          if (node) toggleNodeHazard(id, node.type);
        }
      } else if (type === "edge") {
        toggleEdgeHazard(id);
      }

      closeCommandPalette();
    });
  });
}

function checkFirstRunCoach() {
  try {
    const dismissed = localStorage.getItem("coach_dismissed");
    if (!dismissed && coachMarksBarEl) {
      coachMarksBarEl.classList.add("visible");
    }
  } catch (_) {}
}

function handleTransitHover(segment) {
  appState.highlightedSegment = segment;
  recomputeAndRender();
}

function recomputeAndRender() {
  if (!appState.graph) {
    if (emptyFrameEl) emptyFrameEl.classList.add("visible");
    return;
  }

  // Calculate route
  appState.routeResult = findEvacuationRoute(
    appState.graph,
    appState.currentStart,
    appState.state
  );

  // Compute Cost Delta if in diff mode
  if (appState._prevCostForDiff !== undefined && appState.routeResult.status === "ok") {
    const prev = appState._prevCostForDiff;
    const cur = appState.routeResult.cost;
    const diff = cur - prev;
    const sign = diff >= 0 ? `+${diff}` : `${diff}`;
    appState.costDeltaStr = `${prev} → ${cur} (${sign})`;
    delete appState._prevCostForDiff;
  }

  // Update System Armed Indicator Dot
  if (systemDotEl && systemStatusTextEl) {
    if (!appState.currentStart) {
      systemDotEl.className = "system-dot";
      systemStatusTextEl.textContent = t("systemArmed");
    } else if (appState.routeResult.status === "start_blocked") {
      systemDotEl.className = "system-dot dot-amber";
      systemStatusTextEl.textContent = t("systemWarning");
    } else if (appState.routeResult.status === "no_route") {
      systemDotEl.className = "system-dot dot-hazard";
      systemStatusTextEl.textContent = t("systemDisarmed");
    } else {
      systemDotEl.className = "system-dot";
      systemStatusTextEl.textContent = t("systemArmed");
    }
  }

  // Failure State Canvas Overlays
  if (failureOverlayEl && failTitleEl && failDescEl && btnFailActionEl) {
    if (appState.routeResult && appState.routeResult.status === "no_route") {
      failureOverlayEl.className = "canvas-failure-overlay visible fail-hazard";
      failTitleEl.textContent = t("failureNoRouteTitle");
      failDescEl.textContent = t("failureNoRouteDesc");
      btnFailActionEl.style.display = "none";
    } else if (appState.routeResult && appState.routeResult.status === "start_blocked") {
      failureOverlayEl.className = "canvas-failure-overlay visible fail-amber";
      failTitleEl.textContent = t("failureStartBlockedTitle");
      failDescEl.textContent = t("failureStartBlockedDesc");
      btnFailActionEl.textContent = t("unblockStartAction");
      btnFailActionEl.style.display = "inline-flex";
    } else {
      failureOverlayEl.classList.remove("visible");
    }
  }

  // Render SVG Graph
  renderGraph(svgCanvas, {
    graph: appState.graph,
    state: appState.state,
    startId: appState.currentStart,
    routeResult: appState.routeResult,
    ghostRoute: appState.ghostRoute,
    diffRoute: appState.diffRoute,
    highlightedSegment: appState.highlightedSegment,
    zoomTransform: appState.zoom,
    onNodeClick: handleNodeClick,
    onEdgeClick: handleEdgeClick,
    onNodeContextMenu: handleNodeContextMenu,
    onEdgeContextMenu: handleEdgeContextMenu,
    onElementHover: handleElementHover
  });

  // Render Operations Inspector & Bottom Terminal Console
  renderInspector(controlInspectorEl, statusConsoleEl, {
    graph: appState.graph,
    state: appState.state,
    startId: appState.currentStart,
    routeResult: appState.routeResult,
    activeMode: appState.activeMode,
    costDelta: appState.costDeltaStr,
    onModeChange: setInteractionMode,
    onRemoveHazard: handleRemoveHazard,
    onClearGroup: handleClearGroup,
    onTransitHover: handleTransitHover,
    onUnblockStart: handleUnblockStart
  });

  saveStateToStorage();
}

function saveStateToStorage() {
  try {
    const payload = {
      graph: appState.graph,
      originalInitialState: appState.originalInitialState,
      currentStart: appState.currentStart,
      state: appState.state,
      lang: getLanguage(),
      theme: appState.theme
    };
    localStorage.setItem("smart_escape_save", JSON.stringify(payload));
  } catch (_) {}
}

function loadSavedState() {
  try {
    const saved = localStorage.getItem("smart_escape_save");
    if (!saved) return;
    const parsed = JSON.parse(saved);
    if (parsed.graph && parsed.graph.nodes) {
      appState.graph = parsed.graph;
      appState.originalInitialState = parsed.originalInitialState || parsed.graph.initial_state;
      appState.currentStart = parsed.currentStart;
      appState.state = parsed.state || parsed.graph.initial_state;

      if (parsed.lang) {
        setAppLanguage(parsed.lang);
      }
      if (parsed.theme) {
        appState.theme = parsed.theme;
        document.documentElement.setAttribute("data-theme", appState.theme);
        const themeText = document.getElementById("themeToggleText");
        if (themeText) {
          themeText.textContent = appState.theme === "dark" ? t("themeToggleDark") : t("themeToggleLight");
        }
      }

      const headerFacilityName = document.getElementById("headerFacilityName");
      if (headerFacilityName && appState.graph.building) {
        headerFacilityName.textContent = appState.graph.building;
      }
    }
  } catch (_) {}
}

function exportMapAsPng() {
  if (!svgCanvas) return;

  const svgData = new XMLSerializer().serializeToString(svgCanvas);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = appState.theme === "dark" ? "#111410" : "#F1EDE2";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);

    const slug = (appState.graph?.building || "egress-map").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const a = document.createElement("a");
    a.download = `smart-escape-${slug}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  };
  img.src = url;
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initApp);
}
