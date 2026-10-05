/**
 * src/core/i18n.js
 * Comprehensive bilingual dictionary (English & Natural Bangla) for Smart Escape.
 */

export const translations = {
  en: {
    appTitle: "Smart Escape",
    subtitle: "Interactive Evacuation Route Simulator",
    facility: "FACILITY",
    systemArmed: "SYSTEM ARMED",
    routeOk: "ROUTE OK",
    noRoute: "NO ROUTE",
    startBlocked: "START BLOCKED",
    noStart: "SELECT START",

    // Actions & Controls
    selectStart: "Select start",
    toggleHazards: "Toggle hazards",
    importFile: "Import",
    loadSample: "Load sample",
    reset: "Reset",
    exportPng: "Export PNG",
    shortcuts: "Shortcuts",
    fitView: "Fit view",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    walkerToggle: "Walker",
    play: "Play",
    pause: "Pause",
    replay: "Replay",
    speed: "Speed",
    undo: "Undo",
    redo: "Redo",

    // Inspector
    inspectorTitle: "EVACUATION TELEMETRY",
    startLocation: "START LOCATION",
    destinationExit: "TARGET EXIT",
    totalCost: "TOTAL COST",
    transitStops: "TRANSIT TIMELINE",
    hazardsHeader: "ACTIVE HAZARDS",
    hazardLocations: "Locations",
    hazardCorridors: "Corridors",
    hazardExits: "Closed Exits",
    clearGroup: "Clear",
    noHazardsActive: "No active hazards in facility.",
    noRouteTimeline: "No viable path to display.",

    // Statuses
    statusNoRoute: "No route available",
    statusStartBlocked: "Starting location blocked",
    statusSelectStart: "Select an unblocked room or junction to begin",
    statusSafeArrival: "SAFE ARRIVAL",
    unblockStartAction: "Unblock start",
    resetHazardsAction: "Reset hazards",
    hazardCutoffHint: "Hazards have severed all paths to viable emergency exits.",

    // Command palette
    palettePlaceholder: "Search rooms, junctions, exits, corridors...",
    paletteNoResults: "No matching elements found",
    paletteActionStart: "Set as start location",
    paletteActionToggle: "Toggle hazard state",
    paletteActionFocus: "Focus on map",

    // Coach marks
    coachStep1Title: "1. Import Building",
    coachStep1Desc: "Load your building schema JSON or use our verified sample facility.",
    coachStep2Title: "2. Designate Start",
    coachStep2Desc: "Click any accessible room or hallway junction to calculate the route.",
    coachStep3Title: "3. Simulate Hazards",
    coachStep3Desc: "Switch to hazard mode (H) to block paths and observe real-time rerouting.",
    dismiss: "Got it",

    // Dropzone & Empty State
    dropzoneTitle: "Drop building.json or import a file",
    dropzoneSubtitle: "Drag & drop your facility layout JSON here, or choose an option below",
    schemaReference: "Accepted Schema Specification",

    // Errors
    fileRejected: "File rejected",
    fixIssuesPrompt: "Please correct the following schema violations:",

    // Error Codes
    INVALID_JSON: "Malformed JSON file: {message}",
    INVALID_ROOT_OBJECT: "Root of JSON must be an object.",
    INVALID_BUILDING_NAME: "Building name must be a non-empty string.",
    MISSING_NODES_ARRAY: "Missing 'nodes' array.",
    MISSING_EDGES_ARRAY: "Missing 'edges' array.",
    MISSING_INITIAL_STATE: "Missing 'initial_state' object.",
    NODE_COUNT_OUT_OF_RANGE: "Facility must contain 2 to 60 nodes (found {count}).",
    EDGE_COUNT_OUT_OF_RANGE: "Facility must contain 1 to 150 corridors/edges (found {count}).",
    INVALID_NODE_OBJECT: "Node #{index} is invalid.",
    INVALID_NODE_ID: "Node #{index} is missing a non-empty string ID.",
    DUPLICATE_NODE_ID: "Duplicate node ID: '{id}'",
    INVALID_NODE_LABEL: "Node '{id}' must have a non-empty label.",
    INVALID_NODE_TYPE: "Node '{id}' has invalid type '{type}'. Allowed: room, junction, exit.",
    INVALID_NODE_COORDINATES: "Node '{id}' coordinates (x: {x}, y: {y}) must be finite numbers.",
    NO_ROOM_OR_JUNCTION: "Building must contain at least one room or junction.",
    NO_EXIT_NODE: "Building must contain at least one designated exit.",
    INVALID_EDGE_OBJECT: "Corridor #{index} is invalid.",
    INVALID_EDGE_ID: "Corridor #{index} is missing a valid string ID.",
    DUPLICATE_EDGE_ID: "Duplicate corridor ID: '{id}'",
    EDGE_UNKNOWN_NODE: "Corridor '{id}' references unknown endpoint '{endpoint}'.",
    EDGE_SELF_LOOP: "Corridor '{id}' is an invalid self-loop on node '{node}'.",
    EDGE_DUPLICATE_PAIR: "Duplicate corridor between '{from}' and '{to}' (ID: '{id}').",
    EDGE_INVALID_COST: "Corridor '{id}' cost must be a positive integer (got {cost}).",
    INVALID_INITIAL_STATE_ARRAY: "initial_state.{field} must be an array.",
    UNKNOWN_BLOCKED_NODE: "initial_state.blocked_nodes contains unknown node ID '{id}'.",
    BLOCKED_NODE_IS_EXIT: "initial_state.blocked_nodes contains exit '{id}' (exits belong in closed_exits).",
    UNKNOWN_BLOCKED_EDGE: "initial_state.blocked_edges contains unknown edge ID '{id}'.",
    UNKNOWN_CLOSED_EXIT: "initial_state.closed_exits contains unknown exit ID '{id}'.",
    CLOSED_EXIT_NOT_EXIT: "initial_state.closed_exits contains non-exit ID '{id}'.",

    // Tooltips & Toasts
    exitCannotBeStart: "Exits cannot be designated as starting locations",
    startNodeIsBlocked: "Selected starting room is currently blocked by a hazard",
    hazardToggled: "Toggled hazard on '{id}'",
    undoPerformed: "Undid hazard modification",
    redoPerformed: "Redid hazard modification",
    costChange: "Predicted cost change",
    safeArrivalTag: "SAFE",

    // Legend
    legendRoom: "Room",
    legendJunction: "Junction",
    legendExit: "Emergency Exit",
    legendBlocked: "Blocked / Hazard",
    legendClosedExit: "Closed Exit",
    legendRoute: "Active Route",

    // Shortcuts dialog
    shortcutsTitle: "Console Hotkeys",
    shortcutS: "Set Start mode",
    shortcutH: "Toggle Hazard mode",
    shortcutR: "Reset to initial state",
    shortcutL: "Toggle Language (EN / বাং)",
    shortcutT: "Toggle Theme (Night / Day)",
    shortcutF: "Fit diagram to screen",
    shortcutP: "Play / Pause route walker",
    shortcutCtrlK: "Open command palette",
    shortcutCtrlZ: "Undo hazard change",
    shortcutEsc: "Close modals / clear preview"
  },

  bn: {
    appTitle: "স্মার্ট এস্কেপ",
    subtitle: "জরুরি স্থানান্তর পথ সিমুলেটর",
    facility: "ভবন",
    systemArmed: "নিয়ন্ত্রণ ব্যবস্থা সক্রিয়",
    routeOk: "পথ প্রস্তুত",
    noRoute: "পথ নেই",
    startBlocked: "শুরু অবরুদ্ধ",
    noStart: "শুরুর স্থান নির্বাচন",

    // Actions & Controls
    selectStart: "শুরু নির্বাচন",
    toggleHazards: "বিপদ টগল",
    importFile: "আমদানি",
    loadSample: "নমুনা লোড",
    reset: "পুনরুদ্ধার",
    exportPng: "পিএনজি এক্সপোর্ট",
    shortcuts: "শর্টকাট",
    fitView: "ফিট ভিউ",
    zoomIn: "বড় করুন",
    zoomOut: "ছোট করুন",
    walkerToggle: "ওয়াকার",
    play: "চালান",
    pause: "থামান",
    replay: "পুনরায়",
    speed: "গতি",
    undo: "পূর্বাবস্থায়",
    redo: "পুনরায়",

    // Inspector
    inspectorTitle: "স্থানান্তর টেলিমেট্রি",
    startLocation: "শুরুর স্থান",
    destinationExit: "গন্তব্য বহির্গমন",
    totalCost: "মোট দূরত্ব/সময়",
    transitStops: "যাত্রাপথের ধাপসমূহ",
    hazardsHeader: "সক্রিয় প্রতিবন্ধকতা",
    hazardLocations: "স্থানসমূহ",
    hazardCorridors: "করিডোরসমূহ",
    hazardExits: "বন্ধ বহির্গমন",
    clearGroup: "মুছুন",
    noHazardsActive: "ভবনে কোনো সক্রিয় প্রতিবন্ধকতা নেই।",
    noRouteTimeline: "প্রদর্শনের মতো কোনো কার্যকর পথ নেই।",

    // Statuses
    statusNoRoute: "কোনো পথ পাওয়া যায়নি",
    statusStartBlocked: "শুরুর স্থানটি বন্ধ",
    statusSelectStart: "শুরু করতে একটি উন্মুক্ত রুম বা জংশন নির্বাচন করুন",
    statusSafeArrival: "নিরাপদ পৌঁছানো",
    unblockStartAction: "শুরুর স্থান খুলুন",
    resetHazardsAction: "বিপদসমূহ পরিষ্কার করুন",
    hazardCutoffHint: "প্রতিবন্ধকতার কারণে বহির্গমনের সমস্ত বিকল্প বিচ্ছিন্ন হয়ে গেছে।",

    // Command palette
    palettePlaceholder: "রুম, জংশন, বহির্গমন বা করিডোর খুঁজুন...",
    paletteNoResults: "কোনো উপাদান মেলেনি",
    paletteActionStart: "শুরুর স্থান হিসেবে নির্ধারণ করুন",
    paletteActionToggle: "বিপদ অবস্থা পরিবর্তন করুন",
    paletteActionFocus: "মানচিত্রে দেখুন",

    // Coach marks
    coachStep1Title: "১. ভবন আমদানি",
    coachStep1Desc: "আপনার নিজস্ব JSON ফাইল যুক্ত করুন অথবা নমুনা ভবন ব্যবহার করুন।",
    coachStep2Title: "২. শুরুর স্থান নির্ধারণ",
    coachStep2Desc: "পথ নির্ধারণ করতে যেকোনো খোলা রুম বা জংশনে ক্লিক করুন।",
    coachStep3Title: "৩. বিপদ সিমুলেশন",
    coachStep3Desc: "বিপদ মোডে (H) গিয়ে করিডোর বা রুম বন্ধ করে তাৎক্ষণিক নতুন পথ দেখুন।",
    dismiss: "বুঝেছি",

    // Dropzone & Empty State
    dropzoneTitle: "building.json ড্রপ করুন অথবা ফাইল বেছে নিন",
    dropzoneSubtitle: "এখানে আপনার ভবনের নকশা JSON ফাইল ড্রপ করুন",
    schemaReference: "অনুমোদিত স্কিমা বিবরণ",

    // Errors
    fileRejected: "ফাইলটি গ্রহণযোগ্য নয়",
    fixIssuesPrompt: "অনুগ্রহ করে নিম্নলিখিত ত্রুটিগুলি সংশোধন করুন:",

    // Error Codes
    INVALID_JSON: "ত্রুটিপূর্ণ JSON ফাইল: {message}",
    INVALID_ROOT_OBJECT: "ফাইলের মূল অংশটি একটি অবজেক্ট হতে হবে।",
    INVALID_BUILDING_NAME: "ভবনের একটি নাম থাকা বাধ্যতামূলক।",
    MISSING_NODES_ARRAY: "'nodes' অ্যারে অনুপস্থিত।",
    MISSING_EDGES_ARRAY: "'edges' অ্যারে অনুপস্থিত।",
    MISSING_INITIAL_STATE: "'initial_state' অবজেক্ট অনুপস্থিত।",
    NODE_COUNT_OUT_OF_RANGE: "ভবনে ২ থেকে ৬০টি নোড থাকতে হবে (পাওয়া গেছে {count}টি)।",
    EDGE_COUNT_OUT_OF_RANGE: "ভবনে ১ থেকে ১৫০টি করিডোর থাকতে হবে (পাওয়া গেছে {count}টি)।",
    INVALID_NODE_OBJECT: "নোড #{index} ত্রুটিপূর্ণ।",
    INVALID_NODE_ID: "নোড #{index}-এর আইডি সঠিক নয়।",
    DUPLICATE_NODE_ID: "একই নোড আইডি পুনরাবৃত্তি হয়েছে: '{id}'",
    INVALID_NODE_LABEL: "নোড '{id}'-এর নাম থাকা আবশ্যক।",
    INVALID_NODE_TYPE: "নোড '{id}'-এর ধরন '{type}' অবৈধ। অনুমোদিত: room, junction, exit।",
    INVALID_NODE_COORDINATES: "নোড '{id}'-এর স্থানাঙ্ক (x: {x}, y: {y}) সঠিক সংখ্যা নয়।",
    NO_ROOM_OR_JUNCTION: "ভবনে অন্তত একটি রুম অথবা জংশন থাকতে হবে।",
    NO_EXIT_NODE: "ভবনে অন্তত একটি বহির্গমন পথ (exit) থাকা আবশ্যক।",
    INVALID_EDGE_OBJECT: "করিডোর #{index} ত্রুটিপূর্ণ।",
    INVALID_EDGE_ID: "করিডোর #{index}-এর আইডি সঠিক নয়।",
    DUPLICATE_EDGE_ID: "একই করিডোর আইডি একাধিকবার রয়েছে: '{id}'",
    EDGE_UNKNOWN_NODE: "করিডোর '{id}' অজানা নোড '{endpoint}'-কে নির্দেশ করছে।",
    EDGE_SELF_LOOP: "করিডোর '{id}' একটি অবৈধ সেলফ-লুপ ('{node}'-এ)।",
    EDGE_DUPLICATE_PAIR: "'{from}' ও '{to}'-এর মধ্যে একাধিক করিডোর রয়েছে (আইডি: '{id}')।",
    EDGE_INVALID_COST: "করিডোর '{id}'-এর দূরত্ব বা সময় একটি ধনাত্মক পূর্ণসংখ্যা হতে হবে (পাওয়া গেছে {cost})।",
    INVALID_INITIAL_STATE_ARRAY: "initial_state.{field} একটি অ্যারে হতে হবে।",
    UNKNOWN_BLOCKED_NODE: "initial_state.blocked_nodes-এ অজানা নোড আইডি '{id}' রয়েছে।",
    BLOCKED_NODE_IS_EXIT: "initial_state.blocked_nodes-এ বহির্গমন '{id}' যুক্ত আছে (বহির্গমন closed_exits-এ থাকতে হবে)।",
    UNKNOWN_BLOCKED_EDGE: "initial_state.blocked_edges-এ অজানা করিডোর আইডি '{id}' রয়েছে।",
    UNKNOWN_CLOSED_EXIT: "initial_state.closed_exits-এ অজানা বহির্গমন আইডি '{id}' রয়েছে।",
    CLOSED_EXIT_NOT_EXIT: "initial_state.closed_exits-এ সাধারণ নোড '{id}' যুক্ত আছে।",

    // Tooltips & Toasts
    exitCannotBeStart: "জরুরি বহির্গমনকে শুরুর স্থান নির্ধারণ করা যাবে না",
    startNodeIsBlocked: "নির্বাচিত শুরুর স্থানটিতে বর্তমানে বিপদ রয়েছে",
    hazardToggled: "'{id}'-এ বিপদ অবস্থা পরিবর্তিত হয়েছে",
    undoPerformed: "পূর্বাবস্থায় ফিরিয়ে নেওয়া হয়েছে",
    redoPerformed: "পুনরায় প্রয়োগ করা হয়েছে",
    costChange: "সম্ভাব্য দূরত্ব পরিবর্তন",
    safeArrivalTag: "নিরাপদ",

    // Legend
    legendRoom: "কক্ষ (Room)",
    legendJunction: "জংশন (Junction)",
    legendExit: "জরুরি বহির্গমন (Exit)",
    legendBlocked: "অবরুদ্ধ / বিপদ",
    legendClosedExit: "বন্ধ বহির্গমন",
    legendRoute: "সক্রিয় উদ্ধার পথ",

    // Shortcuts dialog
    shortcutsTitle: "কন্ট্রোল রুম কীবোর্ড শর্টকাট",
    shortcutS: "শুরু নির্বাচন মোড",
    shortcutH: "বিপদ মোড টগল",
    shortcutR: "আদি অবস্থায় ফিরুন",
    shortcutL: "ভাষা পরিবর্তন (EN / বাং)",
    shortcutT: "থিম পরিবর্তন (Night / Day)",
    shortcutF: "মানচিত্র ফিট করুন",
    shortcutP: "ওয়াকার চালু / বন্ধ",
    shortcutCtrlK: "কমান্ড প্যালেট খুলুন",
    shortcutCtrlZ: "বিপদ পরিবর্তন পূর্বাবস্থায় নিন",
    shortcutEsc: "উইন্ডো বন্ধ করুন"
  }
};

/**
 * Translates a key with optional dynamic parameter interpolation.
 */
export function t(lang, key, params = {}) {
  const dict = translations[lang] || translations.en;
  let str = dict[key] || translations.en[key] || key;

  Object.entries(params).forEach(([k, v]) => {
    str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  });

  return str;
}
