/**
 * src/state/useSimulator.js
 * State management for Smart Escape using useReducer with undo/redo history,
 * route computation, and persistent user preferences.
 */

import { useReducer, useEffect, useMemo, useCallback } from "react";
import { findEvacuationRoute, previewRoute } from "../core/router.js";
import { deepClone, formatCostDelta } from "../core/graph.js";

function getStoredPref(key, fallback) {
  try {
    const val = localStorage.getItem(`smart_escape_${key}`);
    return val !== null ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function setStoredPref(key, value) {
  try {
    localStorage.setItem(`smart_escape_${key}`, JSON.stringify(value));
  } catch {
    // Ignore quota or disabled localStorage
  }
}

const initialSimulatorState = {
  graph: null,
  initialState: null,
  state: {
    blocked_nodes: [],
    blocked_edges: [],
    closed_exits: []
  },
  start: null,
  mode: "select", // "select" (Select start, S) or "hazard" (Toggle hazards, H)
  history: {
    past: [],
    future: []
  },
  lang: getStoredPref("lang", "en"),
  theme: getStoredPref("theme", "dark"),
  lastCostDelta: null,
  previousRoute: null,
  hoverItem: null,
  toast: null,
  walkerEnabled: true,
  walkerPlaying: true,
  walkerSpeed: 1, // 0.5, 1, 2
  activeTimelineIndex: 0
};

function simulatorReducer(state, action) {
  switch (action.type) {
    case "LOAD_GRAPH": {
      const graph = action.payload;
      const initialCopy = deepClone(graph.initial_state || {
        blocked_nodes: [],
        blocked_edges: [],
        closed_exits: []
      });

      // Find first unblocked room or junction as default start
      const blockedSet = new Set(initialCopy.blocked_nodes || []);
      const candidateStart = graph.nodes.find(
        (n) => n.type !== "exit" && !blockedSet.has(n.id)
      );

      return {
        ...state,
        graph,
        initialState: deepClone(initialCopy),
        state: deepClone(initialCopy),
        start: candidateStart ? candidateStart.id : null,
        history: { past: [], future: [] },
        previousRoute: null,
        lastCostDelta: null,
        activeTimelineIndex: 0
      };
    }

    case "SET_START": {
      const newStart = action.payload;
      if (newStart === state.start) return state;

      return {
        ...state,
        start: newStart,
        activeTimelineIndex: 0
      };
    }

    case "SET_MODE": {
      return {
        ...state,
        mode: action.payload,
        hoverItem: null
      };
    }

    case "TOGGLE_HAZARD": {
      const { type, id } = action.payload;
      const currentPast = state.history.past;
      const snapshot = deepClone(state.state);

      const nextState = deepClone(state.state);

      if (type === "exit") {
        if (nextState.closed_exits.includes(id)) {
          nextState.closed_exits = nextState.closed_exits.filter((x) => x !== id);
        } else {
          nextState.closed_exits.push(id);
        }
      } else if (type === "edge") {
        if (nextState.blocked_edges.includes(id)) {
          nextState.blocked_edges = nextState.blocked_edges.filter((x) => x !== id);
        } else {
          nextState.blocked_edges.push(id);
        }
      } else {
        // node
        if (nextState.blocked_nodes.includes(id)) {
          nextState.blocked_nodes = nextState.blocked_nodes.filter((x) => x !== id);
        } else {
          nextState.blocked_nodes.push(id);
        }
      }

      return {
        ...state,
        state: nextState,
        history: {
          past: [...currentPast, snapshot],
          future: []
        },
        toast: { messageKey: "hazardToggled", params: { id }, showUndo: true, id: Date.now() },
        activeTimelineIndex: 0
      };
    }

    case "CLEAR_HAZARDS_GROUP": {
      const group = action.payload; // "nodes" | "edges" | "exits"
      const snapshot = deepClone(state.state);
      const nextState = deepClone(state.state);

      if (group === "nodes") nextState.blocked_nodes = [];
      if (group === "edges") nextState.blocked_edges = [];
      if (group === "exits") nextState.closed_exits = [];

      return {
        ...state,
        state: nextState,
        history: {
          past: [...state.history.past, snapshot],
          future: []
        },
        toast: { messageKey: "hazardToggled", params: { id: group }, showUndo: true, id: Date.now() },
        activeTimelineIndex: 0
      };
    }

    case "RESET_STATE": {
      if (!state.initialState) return state;
      const snapshot = deepClone(state.state);
      const restored = deepClone(state.initialState);

      // Keep start unless it becomes blocked in restored initial state
      const blockedSet = new Set(restored.blocked_nodes || []);
      let newStart = state.start;
      if (blockedSet.has(newStart)) {
        const candidate = state.graph?.nodes.find(
          (n) => n.type !== "exit" && !blockedSet.has(n.id)
        );
        newStart = candidate ? candidate.id : null;
      }

      return {
        ...state,
        state: restored,
        start: newStart,
        history: {
          past: [...state.history.past, snapshot],
          future: []
        },
        toast: { messageKey: "reset", params: {}, showUndo: true, id: Date.now() },
        activeTimelineIndex: 0
      };
    }

    case "UNDO": {
      if (state.history.past.length === 0) return state;
      const previous = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(0, -1);
      const newFuture = [deepClone(state.state), ...state.history.future];

      return {
        ...state,
        state: deepClone(previous),
        history: {
          past: newPast,
          future: newFuture
        },
        toast: { messageKey: "undoPerformed", params: {}, showUndo: false, id: Date.now() },
        activeTimelineIndex: 0
      };
    }

    case "REDO": {
      if (state.history.future.length === 0) return state;
      const next = state.history.future[0];
      const newFuture = state.history.future.slice(1);
      const newPast = [...state.history.past, deepClone(state.state)];

      return {
        ...state,
        state: deepClone(next),
        history: {
          past: newPast,
          future: newFuture
        },
        toast: { messageKey: "redoPerformed", params: {}, showUndo: false, id: Date.now() },
        activeTimelineIndex: 0
      };
    }

    case "SET_LANG": {
      setStoredPref("lang", action.payload);
      return { ...state, lang: action.payload };
    }

    case "SET_THEME": {
      setStoredPref("theme", action.payload);
      return { ...state, theme: action.payload };
    }

    case "SET_HOVER_ITEM": {
      return { ...state, hoverItem: action.payload };
    }

    case "SET_TOAST": {
      return { ...state, toast: action.payload };
    }

    case "DISMISS_TOAST": {
      return { ...state, toast: null };
    }

    case "SET_WALKER_ENABLED": {
      return { ...state, walkerEnabled: action.payload };
    }

    case "SET_WALKER_PLAYING": {
      return { ...state, walkerPlaying: action.payload };
    }

    case "SET_WALKER_SPEED": {
      return { ...state, walkerSpeed: action.payload };
    }

    case "SET_ACTIVE_TIMELINE_INDEX": {
      return { ...state, activeTimelineIndex: action.payload };
    }

    case "RECORD_ROUTE_CHANGE": {
      return {
        ...state,
        previousRoute: action.payload.previousRoute,
        lastCostDelta: action.payload.costDelta
      };
    }

    default:
      return state;
  }
}

export function useSimulator() {
  const [state, dispatch] = useReducer(simulatorReducer, initialSimulatorState);

  // Apply HTML language attribute
  useEffect(() => {
    document.documentElement.lang = state.lang;
  }, [state.lang]);

  // Apply theme dataset
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", state.theme);
  }, [state.theme]);

  // Compute live evacuation route
  const route = useMemo(() => {
    if (!state.graph || !state.start) {
      return { status: state.start ? "no_route" : "no_start" };
    }
    return findEvacuationRoute(state.graph, state.state, state.start);
  }, [state.graph, state.state, state.start]);

  // Track route changes for ghost and cost delta
  useEffect(() => {
    if (!route) return;

    if (state.previousRoute && state.previousRoute.cost !== undefined) {
      if (route.status === "ok" && route.cost !== state.previousRoute.cost) {
        const delta = formatCostDelta(state.previousRoute.cost, route.cost);
        dispatch({
          type: "RECORD_ROUTE_CHANGE",
          payload: { previousRoute: state.previousRoute, costDelta: delta }
        });
      } else if (route.status !== "ok" && state.previousRoute.status === "ok") {
        const delta = formatCostDelta(state.previousRoute.cost, 0, true);
        dispatch({
          type: "RECORD_ROUTE_CHANGE",
          payload: { previousRoute: state.previousRoute, costDelta: delta }
        });
      }
    }

    if (route.status === "ok") {
      dispatch({
        type: "RECORD_ROUTE_CHANGE",
        payload: { previousRoute: route, costDelta: state.lastCostDelta }
      });
    }
  }, [route?.status, route?.cost, route?.path?.join(",")]);

  // Compute hover preview if in hazard mode and hovering
  const hoverPreview = useMemo(() => {
    if (state.mode !== "hazard" || !state.hoverItem || !state.graph || !state.start) {
      return null;
    }
    return previewRoute(state.graph, state.state, state.start, state.hoverItem);
  }, [state.mode, state.hoverItem, state.graph, state.state, state.start]);

  // Action dispatchers
  const loadGraph = useCallback((graph) => dispatch({ type: "LOAD_GRAPH", payload: graph }), []);
  const setStart = useCallback((id) => dispatch({ type: "SET_START", payload: id }), []);
  const setMode = useCallback((mode) => dispatch({ type: "SET_MODE", payload: mode }), []);
  const toggleHazard = useCallback((payload) => dispatch({ type: "TOGGLE_HAZARD", payload }), []);
  const clearHazardsGroup = useCallback((group) => dispatch({ type: "CLEAR_HAZARDS_GROUP", payload: group }), []);
  const resetState = useCallback(() => dispatch({ type: "RESET_STATE" }), []);
  const undo = useCallback(() => dispatch({ type: "UNDO" }), []);
  const redo = useCallback(() => dispatch({ type: "REDO" }), []);
  const setLang = useCallback((lang) => dispatch({ type: "SET_LANG", payload: lang }), []);
  const setTheme = useCallback((theme) => dispatch({ type: "SET_THEME", payload: theme }), []);
  const setHoverItem = useCallback((item) => dispatch({ type: "SET_HOVER_ITEM", payload: item }), []);
  const showToast = useCallback((toast) => dispatch({ type: "SET_TOAST", payload: toast }), []);
  const dismissToast = useCallback(() => dispatch({ type: "DISMISS_TOAST" }), []);
  const setWalkerEnabled = useCallback((enabled) => dispatch({ type: "SET_WALKER_ENABLED", payload: enabled }), []);
  const setWalkerPlaying = useCallback((playing) => dispatch({ type: "SET_WALKER_PLAYING", payload: playing }), []);
  const setWalkerSpeed = useCallback((speed) => dispatch({ type: "SET_WALKER_SPEED", payload: speed }), []);
  const setActiveTimelineIndex = useCallback((idx) => dispatch({ type: "SET_ACTIVE_TIMELINE_INDEX", payload: idx }), []);

  return {
    ...state,
    route,
    hoverPreview,
    actions: {
      loadGraph,
      setStart,
      setMode,
      toggleHazard,
      clearHazardsGroup,
      resetState,
      undo,
      redo,
      setLang,
      setTheme,
      setHoverItem,
      showToast,
      dismissToast,
      setWalkerEnabled,
      setWalkerPlaying,
      setWalkerSpeed,
      setActiveTimelineIndex
    }
  };
}
