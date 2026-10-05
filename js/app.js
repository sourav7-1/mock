/**
 * js/app.js
 * Main application coordinator for Smart Escape.
 */

import { validateBuilding } from "./validate.js";
import { findEvacuationRoute } from "./router.js";
import { renderGraph, renderSidePanel } from "./render.js";
import { t, setLanguage, getLanguage, updateDomTranslations } from "./i18n.js";

// Embedded fallback sample so offline / file:// protocol always works
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
  walkthrough: {
    active: false,
    index: 0,
    timer: null
  },
  highContrast: false
};

// DOM references
let svgMap = null;
let sidePanelEl = null;
let fileInputEl = null;
let errorModalEl = null;
let errorListEl = null;
let toastEl = null;
let walkthroughBarEl = null;

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Initializes the application
 */
export function initApp() {
  svgMap = document.getElementById("svgMap");
  sidePanelEl = document.getElementById("sidePanel");
  fileInputEl = document.getElementById("fileInput");
  errorModalEl = document.getElementById("errorModal");
  errorListEl = document.getElementById("errorList");
  toastEl = document.getElementById("toast");
  walkthroughBarEl = document.getElementById("walkthroughBar");

  bindEvents();
  loadSavedState();

  if (!appState.graph) {
    loadSampleBuilding();
  } else {
    recomputeAndRender();
  }
}

/**
 * Binds UI Event Listeners
 */
function bindEvents() {
  // Mode selection buttons
  const btnSelectStart = document.getElementById("btnSelectStart");
  const btnToggleHazard = document.getElementById("btnToggleHazard");

  if (btnSelectStart && btnToggleHazard) {
    btnSelectStart.addEventListener("click", () => setInteractionMode("select"));
    btnToggleHazard.addEventListener("click", () => setInteractionMode("hazard"));
  }

  // Load sample button
  const btnLoadSample = document.getElementById("btnLoadSample");
  if (btnLoadSample) {
    btnLoadSample.addEventListener("click", () => loadSampleBuilding());
  }

  // Reset button
  const btnReset = document.getElementById("btnReset");
  if (btnReset) {
    btnReset.addEventListener("click", () => handleReset());
  }

  // File Upload
  const btnUpload = document.getElementById("btnUpload");
  if (btnUpload && fileInputEl) {
    btnUpload.addEventListener("click", () => fileInputEl.click());
    fileInputEl.addEventListener("change", handleFileSelect);
  }

  // Drag and Drop on Map Container
  const mapContainer = document.getElementById("mapContainer");
  if (mapContainer) {
    mapContainer.addEventListener("dragover", (e) => {
      e.preventDefault();
      mapContainer.classList.add("drag-over");
    });
    mapContainer.addEventListener("dragleave", (e) => {
      e.preventDefault();
      mapContainer.classList.remove("drag-over");
    });
    mapContainer.addEventListener("drop", handleFileDrop);
  }

  // Language Toggle
  const btnLangToggle = document.getElementById("btnLangToggle");
  if (btnLangToggle) {
    btnLangToggle.addEventListener("click", () => {
      const nextLang = getLanguage() === "en" ? "bn" : "en";
      setLanguage(nextLang);
      btnLangToggle.textContent = nextLang === "en" ? "বাংলা" : "English";
      saveStateToStorage();
      recomputeAndRender();
    });
  }

  // High Contrast Toggle
  const btnThemeToggle = document.getElementById("btnThemeToggle");
  if (btnThemeToggle) {
    btnThemeToggle.addEventListener("click", () => {
      appState.highContrast = !appState.highContrast;
      document.body.classList.toggle("high-contrast", appState.highContrast);
      btnThemeToggle.textContent = appState.highContrast
        ? t("themeToggleActive")
        : t("themeToggle");
      saveStateToStorage();
    });
  }

  // Export PNG
  const btnExportPng = document.getElementById("btnExportPng");
  if (btnExportPng) {
    btnExportPng.addEventListener("click", exportMapAsPng);
  }

  // Modal dismiss button
  const btnDismissError = document.getElementById("btnDismissError");
  if (btnDismissError && errorModalEl) {
    btnDismissError.addEventListener("click", () => {
      errorModalEl.classList.remove("visible");
    });
  }

  // Walkthrough controls
  const wtPrev = document.getElementById("wtPrev");
  const wtPlay = document.getElementById("wtPlay");
  const wtNext = document.getElementById("wtNext");
  const wtStop = document.getElementById("wtStop");

  if (wtPrev) wtPrev.addEventListener("click", () => stepWalkthrough(-1));
  if (wtNext) wtNext.addEventListener("click", () => stepWalkthrough(1));
  if (wtPlay) wtPlay.addEventListener("click", toggleWalkthroughPlay);
  if (wtStop) wtStop.addEventListener("click", stopWalkthrough);
}

/**
 * Sets interaction mode ("select" or "hazard")
 */
function setInteractionMode(mode) {
  appState.activeMode = mode;
  const btnSelectStart = document.getElementById("btnSelectStart");
  const btnToggleHazard = document.getElementById("btnToggleHazard");

  if (btnSelectStart && btnToggleHazard) {
    if (mode === "select") {
      btnSelectStart.classList.add("btn-active");
      btnSelectStart.setAttribute("aria-pressed", "true");
      btnToggleHazard.classList.remove("btn-active");
      btnToggleHazard.setAttribute("aria-pressed", "false");
    } else {
      btnSelectStart.classList.remove("btn-active");
      btnSelectStart.setAttribute("aria-pressed", "false");
      btnToggleHazard.classList.add("btn-active");
      btnToggleHazard.setAttribute("aria-pressed", "true");
    }
  }
}

/**
 * Loads sample building from sample/building.json (or fallback)
 */
async function loadSampleBuilding() {
  try {
    const res = await fetch("sample/building.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    processLoadedData(data);
  } catch (err) {
    console.warn("Fetch failed, using embedded sample:", err);
    processLoadedData(FALLBACK_SAMPLE_JSON);
  }
}

/**
 * Handles file input change
 */
function handleFileSelect(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  readFile(file);
  e.target.value = "";
}

/**
 * Handles drag and drop file drop
 */
function handleFileDrop(e) {
  e.preventDefault();
  const mapContainer = document.getElementById("mapContainer");
  if (mapContainer) mapContainer.classList.remove("drag-over");

  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
    readFile(e.dataTransfer.files[0]);
  }
}

/**
 * Reads file with FileReader and validates
 */
function readFile(file) {
  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const content = evt.target.result;
      processLoadedData(content);
    } catch (err) {
      showErrorModal([t("errInvalidJson", { msg: err.message })]);
    }
  };
  reader.onerror = () => {
    showErrorModal(["Failed to read the local file"]);
  };
  reader.readAsText(file);
}

/**
 * Validates and sets loaded building data
 */
function processLoadedData(raw) {
  const result = validateBuilding(raw);
  if (!result.valid) {
    showErrorModal(result.errors);
    return;
  }

  const data = result.data;
  appState.graph = {
    building: data.building,
    nodes: data.nodes,
    edges: data.edges,
    initial_state: deepClone(data.initial_state)
  };

  appState.originalInitialState = deepClone(data.initial_state);
  appState.state = deepClone(data.initial_state);

  // Set default start: pick first room if available, else first junction
  const candidate =
    data.nodes.find((n) => n.type === "room" && !appState.state.blocked_nodes.includes(n.id)) ||
    data.nodes.find((n) => n.type === "junction" && !appState.state.blocked_nodes.includes(n.id));

  appState.currentStart = candidate ? candidate.id : null;

  stopWalkthrough();
  saveStateToStorage();
  recomputeAndRender();
}

/**
 * Shows validation error modal listing every problem found
 */
function showErrorModal(errors) {
  if (!errorModalEl || !errorListEl) {
    alert("Validation Errors:\n\n" + errors.join("\n"));
    return;
  }

  errorListEl.innerHTML = errors
    .map((err) => `<li class="error-item">${escapeHtml(err)}</li>`)
    .join("");

  errorModalEl.classList.add("visible");
}

/**
 * Shows temporary toast message
 */
function showToast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add("toast-show");
  clearTimeout(toastEl._timer);
  toastEl._timer = setTimeout(() => {
    toastEl.classList.remove("toast-show");
  }, 2400);
}

/**
 * Handles Node Click
 */
function handleNodeClick(nodeId, nodeType) {
  if (appState.activeMode === "select") {
    // Select Start Mode
    if (nodeType === "exit") {
      showToast(t("exitBlockedAlert"));
      return;
    }

    if (appState.state.blocked_nodes.includes(nodeId)) {
      showToast(t("nodeBlockedAlert"));
      // Prompt: "Clicking a blocked node in select mode shows a message instead."
      return;
    }

    appState.currentStart = nodeId;
    recomputeAndRender();
  } else {
    // Hazard Mode: click room/junction -> block/unblock; click exit -> close/reopen
    toggleNodeHazard(nodeId, nodeType);
  }
}

/**
 * Handles Node Context Menu (Right-Click)
 */
function handleNodeContextMenu(nodeId, nodeType) {
  toggleNodeHazard(nodeId, nodeType);
}

/**
 * Toggles Hazard on Node
 */
function toggleNodeHazard(nodeId, nodeType) {
  if (nodeType === "exit") {
    const idx = appState.state.closed_exits.indexOf(nodeId);
    if (idx >= 0) {
      appState.state.closed_exits.splice(idx, 1);
    } else {
      appState.state.closed_exits.push(nodeId);
    }
  } else {
    const idx = appState.state.blocked_nodes.indexOf(nodeId);
    if (idx >= 0) {
      appState.state.blocked_nodes.splice(idx, 1);
    } else {
      appState.state.blocked_nodes.push(nodeId);
    }
  }

  recomputeAndRender();
}

/**
 * Handles Edge Click or Context Menu
 */
function handleEdgeClick(edgeId) {
  toggleEdgeHazard(edgeId);
}

function handleEdgeContextMenu(edgeId) {
  toggleEdgeHazard(edgeId);
}

function toggleEdgeHazard(edgeId) {
  const idx = appState.state.blocked_edges.indexOf(edgeId);
  if (idx >= 0) {
    appState.state.blocked_edges.splice(idx, 1);
  } else {
    appState.state.blocked_edges.push(edgeId);
  }
  recomputeAndRender();
}

/**
 * Removes individual hazard from side panel chips
 */
function handleRemoveHazard(type, id) {
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

  recomputeAndRender();
}

/**
 * Handles Reset button:
 * "Reset button restores the file's original initial_state (deep-copied on load)
 * and keeps the loaded graph. Keep the start selection unless the start becomes blocked."
 */
function handleReset() {
  if (!appState.originalInitialState) return;

  appState.state = deepClone(appState.originalInitialState);

  // If start is blocked in original initial_state, reset start
  if (appState.state.blocked_nodes.includes(appState.currentStart)) {
    const candidate = appState.graph.nodes.find(
      (n) => n.type !== "exit" && !appState.state.blocked_nodes.includes(n.id)
    );
    appState.currentStart = candidate ? candidate.id : null;
  }

  stopWalkthrough();
  recomputeAndRender();
}

/**
 * Recomputes route and updates SVG & Side Panel
 */
function recomputeAndRender() {
  if (!appState.graph) return;

  // Calculate route
  appState.routeResult = findEvacuationRoute(
    appState.graph,
    appState.currentStart,
    appState.state
  );

  // Render SVG Graph
  renderGraph(svgMap, {
    graph: appState.graph,
    state: appState.state,
    startId: appState.currentStart,
    routeResult: appState.routeResult,
    walkthroughIndex: appState.walkthrough.active ? appState.walkthrough.index : -1,
    onNodeClick: handleNodeClick,
    onEdgeClick: handleEdgeClick,
    onNodeContextMenu: handleNodeContextMenu,
    onEdgeContextMenu: handleEdgeContextMenu
  });

  // Render Side Panel
  renderSidePanel(sidePanelEl, {
    graph: appState.graph,
    state: appState.state,
    startId: appState.currentStart,
    routeResult: appState.routeResult,
    onRemoveHazard: handleRemoveHazard
  });

  updateWalkthroughUI();
  saveStateToStorage();
}

/**
 * Walkthrough System
 */
function updateWalkthroughUI() {
  if (!walkthroughBarEl) return;

  const isOk = appState.routeResult && appState.routeResult.status === "ok";
  if (!isOk) {
    stopWalkthrough();
    walkthroughBarEl.classList.remove("visible");
    return;
  }

  walkthroughBarEl.classList.add("visible");
  const path = appState.routeResult.path;
  const currentStep = appState.walkthrough.index + 1;
  const totalSteps = path.length;
  const currentNode = path[appState.walkthrough.index] || path[0];

  const infoEl = document.getElementById("wtInfo");
  if (infoEl) {
    infoEl.textContent = t("walkthroughStep", {
      current: currentStep,
      total: totalSteps,
      node: currentNode
    });
  }

  const wtPlay = document.getElementById("wtPlay");
  if (wtPlay) {
    wtPlay.textContent = appState.walkthrough.timer ? t("walkthroughPause") : t("walkthroughPlay");
  }
}

function stepWalkthrough(delta) {
  if (!appState.routeResult || appState.routeResult.status !== "ok") return;
  const path = appState.routeResult.path;
  appState.walkthrough.active = true;

  let newIdx = appState.walkthrough.index + delta;
  if (newIdx < 0) newIdx = 0;
  if (newIdx >= path.length) newIdx = path.length - 1;

  appState.walkthrough.index = newIdx;
  recomputeAndRender();
}

function toggleWalkthroughPlay() {
  if (appState.walkthrough.timer) {
    clearInterval(appState.walkthrough.timer);
    appState.walkthrough.timer = null;
    updateWalkthroughUI();
  } else {
    appState.walkthrough.active = true;
    appState.walkthrough.timer = setInterval(() => {
      const path = appState.routeResult ? appState.routeResult.path : [];
      if (appState.walkthrough.index >= path.length - 1) {
        clearInterval(appState.walkthrough.timer);
        appState.walkthrough.timer = null;
        updateWalkthroughUI();
      } else {
        stepWalkthrough(1);
      }
    }, 700);
    updateWalkthroughUI();
  }
}

function stopWalkthrough() {
  if (appState.walkthrough.timer) {
    clearInterval(appState.walkthrough.timer);
    appState.walkthrough.timer = null;
  }
  appState.walkthrough.active = false;
  appState.walkthrough.index = 0;
}

/**
 * LocalStorage save & restore (safely wrapped in try/catch)
 */
function saveStateToStorage() {
  try {
    const payload = {
      graph: appState.graph,
      originalInitialState: appState.originalInitialState,
      currentStart: appState.currentStart,
      state: appState.state,
      lang: getLanguage(),
      highContrast: appState.highContrast
    };
    localStorage.setItem("smart_escape_save", JSON.stringify(payload));
  } catch (err) {
    // Storage quota or security policy
  }
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
        setLanguage(parsed.lang);
        const btnLangToggle = document.getElementById("btnLangToggle");
        if (btnLangToggle) btnLangToggle.textContent = parsed.lang === "en" ? "বাংলা" : "English";
      }
      if (parsed.highContrast) {
        appState.highContrast = true;
        document.body.classList.add("high-contrast");
        const btnThemeToggle = document.getElementById("btnThemeToggle");
        if (btnThemeToggle) btnThemeToggle.textContent = t("themeToggleActive");
      }
    }
  } catch (err) {
    console.warn("Failed to load state from localStorage:", err);
  }
}

/**
 * Exports SVG Map to PNG via Canvas
 */
function exportMapAsPng() {
  if (!svgMap) return;

  const svgData = new XMLSerializer().serializeToString(svgMap);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 1000;
    const ctx = canvas.getContext("2d");

    // Background fill
    ctx.fillStyle = appState.highContrast ? "#000000" : "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);

    // Trigger download
    const a = document.createElement("a");
    a.download = "smart-escape-route.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  };
  img.src = url;
}

function escapeHtml(str) {
  if (typeof str !== "string") return String(str);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Auto-run on DOMContentLoaded
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initApp);
}
