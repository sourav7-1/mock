/**
 * js/i18n.js
 * Night-shift Control Room I18n Dictionary
 * High-precision safety operations terminology in English and natural Bangla.
 */

export const translations = {
  en: {
    // Header & System Bar
    appTitle: "SMART ESCAPE",
    appSubtitle: "FACILITY EGRESS CONTROL SYSTEM",
    systemArmed: "SYSTEM ARMED",
    systemDisarmed: "ROUTE FAULT",
    systemWarning: "ALERT ACTIVE",
    langEn: "EN",
    langBn: "বাং",
    themeToggleDark: "Night Shift",
    themeToggleLight: "Day Shift",
    importBtn: "Import",
    resetBtn: "Reset (R)",
    shortcutsBtn: "Shortcuts (?)",
    shortcutsTitle: "Console Key Commands",
    commandPaletteTitle: "Command Palette",
    commandPalettePlaceholder: "Type a node ID, corridor, or action (e.g., 'R1', 'C2', 'reset')...",
    paletteHint: "Use ↑↓ to navigate, Enter to select, Esc to close",

    // Action Modes
    modeSection: "DISPATCH MODE",
    modeSelectStart: "Select Start",
    modeSelectStartHint: "S",
    modeToggleHazard: "Toggle Hazards",
    modeToggleHazardHint: "H",

    // Terminal Status Console (Exact Required Strings)
    statusConsoleRoute: "ROUTE",
    statusConsoleExit: "EXIT",
    statusConsoleCost: "COST",
    statusNoRoute: "No route available",
    statusStartBlocked: "Starting location blocked",
    statusOk: "Active egress path clear",
    statusNoStart: "No start origin selected",
    unblockStartAction: "Unblock Start",

    // Map Zoom / Pan Controls
    zoomIn: "Zoom In (+)",
    zoomOut: "Zoom Out (−)",
    zoomFit: "Fit View (F)",

    // Route Transit Timeline
    secTransit: "EGRESS TIMELINE",
    stepOrigin: "ORIGIN",
    stepEgress: "SAFETY EXIT",
    stepJunction: "JUNCTION",
    stepRoom: "ROOM",
    totalPathCost: "Total Path Cost",
    noRouteDetails: "No valid path available from current origin.",

    // Hazard Manager
    secHazards: "ACTIVE RESTRICTIONS",
    subLocations: "Blocked Locations",
    subCorridors: "Blocked Corridors",
    subExits: "Closed Exits",
    clearAll: "Clear",
    noHazardsActive: "All pathways nominal. Zero restrictions.",
    undoToastMsg: "Hazard toggled on {id}",
    undoBtn: "Undo (Ctrl+Z)",

    // Legend
    secLegend: "SIGNAGE REFERENCE",
    legendRoom: "Occupant Room",
    legendJunction: "Corridor Junction",
    legendExit: "Safety Exit (Jade)",
    legendStart: "Start Origin (Bone)",
    legendRoute: "Active Route (Hi-Vis Lime)",
    legendHazard: "Blocked Hazard (Vermilion)",
    legendClosed: "Closed Exit (Saffron)",

    // Metadata
    secMeta: "SYSTEM TELEMETRY",
    metaBuilding: "Facility",
    metaNodes: "Nodal Points",
    metaEdges: "Corridor Links",
    metaState: "Operational State",
    metaStateNormal: "Normal",

    // Failure State Hints
    failureNoRouteTitle: "EGRESS COMPROMISED",
    failureNoRouteDesc: "All exit pathways from this origin are severed by active corridor or node hazards.",
    failureStartBlockedTitle: "ORIGIN COMPROMISED",
    failureStartBlockedDesc: "The selected starting location is currently blocked by a hazard.",

    // Coach Marks (First-Run Guidance)
    coach1Title: "1. Select Origin",
    coach1Desc: "Click any room or junction in 'Select Start' mode (or press 'S') to designate the evacuation origin.",
    coach2Title: "2. Deploy Hazards",
    coach2Desc: "Switch to 'Toggle Hazards' mode (press 'H') and click nodes, corridors, or exits to simulate emergency blockages.",
    coach3Title: "3. Live Wayfinding",
    coach3Desc: "The console computes the mathematically shortest exit in real-time, previewing reroutes on hover.",
    coachDismiss: "Acknowledge Console",

    // Validation Report
    valTitle: "File rejected",
    valSubtitle: "The building specification failed structural integrity checks:",
    dismiss: "Dismiss",

    // Specific Errors
    errInvalidJson: "Invalid JSON format: {msg}",
    errRootObject: "Root must be a JSON object",
    errBuildingString: "'building' must be a non-empty string",
    errNodesArray: "'nodes' must be an array (2 to 60 nodes)",
    errNodeCount: "Node count must be between 2 and 60 (found {count})",
    errEdgeCount: "Edge count must be between 1 and 150 (found {count})",
    errNodeObject: "Node at index {index} must be an object",
    errNodeIdRequired: "Node at index {index} requires a non-empty string 'id'",
    errNodeDuplicateId: "Duplicate node ID: '{id}'",
    errNodeLabelRequired: "Node '{id}' requires a non-empty 'label'",
    errNodeTypeInvalid: "Node '{id}' type must be room, junction, or exit (got '{type}')",
    errNodeCoordsInvalid: "Node '{id}' coordinates (x, y) must be finite numbers",
    errNeedRoomOrJunction: "Graph requires at least one room or junction",
    errNeedExit: "Graph requires at least one exit",
    errEdgesArray: "'edges' must be an array (1 to 150 edges)",
    errEdgeObject: "Edge at index {index} must be an object",
    errEdgeIdRequired: "Edge at index {index} requires a non-empty string 'id'",
    errEdgeDuplicateId: "Duplicate edge ID: '{id}'",
    errEdgeUnknownNode: "Edge '{id}' connects to non-existent node '{nodeId}'",
    errEdgeSelfLoop: "Self-loop forbidden on edge '{id}' (from '{from}' to '{to}')",
    errEdgeDuplicatePair: "Duplicate edge pair between '{from}' and '{to}'",
    errEdgeCostInvalid: "Edge '{id}' cost must be a positive integer (found {cost})",
    errInitialStateObject: "'initial_state' must contain blocked_nodes, blocked_edges, closed_exits",
    errBlockedNodeInvalid: "blocked_nodes contains invalid or non-room/junction ID: '{id}'",
    errBlockedEdgeInvalid: "blocked_edges contains unknown edge ID: '{id}'",
    errClosedExitInvalid: "closed_exits contains invalid or non-exit ID: '{id}'",

    // Hover Tooltip
    tooltipType: "TYPE",
    tooltipStatus: "STATUS",
    tooltipCost: "COST"
  },

  bn: {
    // Header & System Bar
    appTitle: "স্মার্ট এস্কেপ",
    appSubtitle: "জরুরি স্থানান্তর নিয়ন্ত্রণ কেন্দ্র",
    systemArmed: "সিস্টেম প্রস্তুত",
    systemDisarmed: "পথ বিচ্ছিন্ন",
    systemWarning: "সতর্কতা জারি",
    langEn: "EN",
    langBn: "বাং",
    themeToggleDark: "নাইট শিফট",
    themeToggleLight: "ডে শিফট",
    importBtn: "ফাইল লোড",
    resetBtn: "রিসেট (R)",
    shortcutsBtn: "শর্টকাট (?)",
    shortcutsTitle: "কন্ট্রোল কমান্ডসমূহ",
    commandPaletteTitle: "কমান্ড প্যালেট",
    commandPalettePlaceholder: "নোড আইডি, করিডোর বা কমান্ড লিখুন (যেমন 'R1', 'C2')...",
    paletteHint: "↑↓ দিয়ে নেভিগেট করুন, Enter চাপুন, বন্ধ করতে Esc",

    // Action Modes
    modeSection: "অপারেশন মোড",
    modeSelectStart: "শুরুর স্থান",
    modeSelectStartHint: "S",
    modeToggleHazard: "বাধা পরিবর্তন",
    modeToggleHazardHint: "H",

    // Terminal Status Console (Exact Required Strings)
    statusConsoleRoute: "নিষ্ক্রমণ পথ",
    statusConsoleExit: "প্রস্থান",
    statusConsoleCost: "মোট খরচ",
    statusNoRoute: "কোনো পথ পাওয়া যায়নি",
    statusStartBlocked: "শুরুর স্থান অবরুদ্ধ",
    statusOk: "নিরাপদ স্থানান্তর পথ সক্রিয়",
    statusNoStart: "কোনো শুরুর স্থান নির্বাচন করা হয়নি",
    unblockStartAction: "শুরুর স্থান মুক্ত করুন",

    // Map Zoom / Pan Controls
    zoomIn: "জুম ইন (+)",
    zoomOut: "জুম আউট (−)",
    zoomFit: "ভিউ ফিট (F)",

    // Route Transit Timeline
    secTransit: "স্থানান্তর রুট টাইমলাইন",
    stepOrigin: "প্রারম্ভিক বিন্দু",
    stepEgress: "জরুরি প্রস্থান",
    stepJunction: "সংযোগস্থল",
    stepRoom: "কক্ষ (রুম)",
    totalPathCost: "সর্বমোট পথ খরচ",
    noRouteDetails: "বর্তমান অবস্থান থেকে কোনো নির্গমন পথ উপলব্ধ নেই।",

    // Hazard Manager
    secHazards: "সক্রিয় প্রতিবন্ধকতা",
    subLocations: "অবরুদ্ধ অবস্থান",
    subCorridors: "অবরুদ্ধ করিডোর",
    subExits: "বন্ধ প্রস্থান",
    clearAll: "মুছুন",
    noHazardsActive: "সকল পথ স্বাভাবিক। কোনো প্রতিবন্ধকতা নেই।",
    undoToastMsg: "{id}-এ বাধা পরিবর্তন করা হয়েছে",
    undoBtn: "পূর্বাবস্থা (Ctrl+Z)",

    // Legend
    secLegend: "চিহ্ন পরিচিতি",
    legendRoom: "রুম (ব্যবহারকারী এলাকা)",
    legendJunction: "করিডোর সংযোগস্থল",
    legendExit: "জরুরি প্রস্থান (জেড-টিল)",
    legendStart: "শুরুর অবস্থান (বোন)",
    legendRoute: "নিষ্ক্রমণ পথ (হাই-ভিস লাইম)",
    legendHazard: "অবরুদ্ধ নোড/করিডোর (ভার্মিলিয়ন)",
    legendClosed: "বন্ধ প্রস্থান (জাফরান)",

    // Metadata
    secMeta: "সিস্টেম টেলিমেট্রি",
    metaBuilding: "ভবনের নাম",
    metaNodes: "নোড সংখ্যা",
    metaEdges: "করিডোর সংখ্যা",
    metaState: "কার্যকরী অবস্থা",
    metaStateNormal: "স্বাভাবিক",

    // Failure State Hints
    failureNoRouteTitle: "নিষ্ক্রমণ পথ অবরুদ্ধ",
    failureNoRouteDesc: "করিডোর বা নোডের বাধার কারণে এই স্থান থেকে সকল প্রস্থান পথ বিচ্ছিন্ন হয়ে পড়েছে।",
    failureStartBlockedTitle: "শুরুর স্থান অবরুদ্ধ",
    failureStartBlockedDesc: "নির্বাচিত প্রারম্ভিক অবস্থানটিতে বর্তমানে একটি বিপদ/বাধা বিদ্যমান।",

    // Coach Marks
    coach1Title: "১. শুরুর স্থান নির্বাচন",
    coach1Desc: "স্থানান্তর শুরু করতে 'শুরুর স্থান' মোডে (বা 'S' চেপে) যেকোনো রুম বা সংযোগস্থলে ক্লিক করুন।",
    coach2Title: "২. বিপদ তৈরি করুন",
    coach2Desc: "'বাধা পরিবর্তন' মোডে (বা 'H' চেপে) ক্লিক করে পথ অবরুদ্ধ করুন বা প্রস্থান বন্ধ করুন।",
    coach3Title: "৩. লাইভ গতিপথ",
    coach3Desc: "সিমুলেটর তৎক্ষণাৎ সবচেয়ে নিরাপদ সংক্ষিপ্ততম পথ গণনা করবে এবং হোভারে নতুন পথ দেখাবে।",
    coachDismiss: "বুঝেছি",

    // Validation Report
    valTitle: "ফাইলটি গ্রহণযোগ্য নয়",
    valSubtitle: "ভবন ফাইলে কাঠামোগত ত্রুটি পাওয়া গেছে:",
    dismiss: "বাতিল করুন",

    // Specific Errors
    errInvalidJson: "অবৈধ জেসন ফরম্যাট: {msg}",
    errRootObject: "রুট অবশ্যই একটি অবজেক্ট হতে হবে",
    errBuildingString: "'building' অবশ্যই একটি অ-খালি স্ট্রিং হতে হবে",
    errNodesArray: "'nodes' অবশ্যই ২ থেকে ৬০ টি নোডের অ্যারে হতে হবে",
    errNodeCount: "নোডের সংখ্যা ২ থেকে ৬০ এর মধ্যে হতে হবে (পাওয়া গেছে {count})",
    errEdgeCount: "এজের সংখ্যা ১ থেকে ১৫০ এর মধ্যে হতে হবে (পাওয়া গেছে {count})",
    errNodeObject: "{index} নম্বর নোডটি একটি অবজেক্ট হতে হবে",
    errNodeIdRequired: "{index} নম্বর নোডের 'id' আবশ্যক",
    errNodeDuplicateId: "পুনরাবৃত্ত নোড আইডি: '{id}'",
    errNodeLabelRequired: "নোড '{id}'-এ লেবেল প্রয়োজন",
    errNodeTypeInvalid: "নোড '{id}'-এর ধরন অবৈধ ('{type}')",
    errNodeCoordsInvalid: "নোড '{id}'-এর স্থানাঙ্ক সসীম সংখ্যা হতে হবে",
    errNeedRoomOrJunction: "কমপক্ষে একটি রুম বা সংযোগস্থল থাকতে হবে",
    errNeedExit: "কমপক্ষে একটি প্রস্থান থাকতে হবে",
    errEdgesArray: "'edges' অবশ্যই ১ থেকে ১৫০ টি এজের অ্যারে হতে হবে",
    errEdgeObject: "{index} নম্বর এজটি একটি অবজেক্ট হতে হবে",
    errEdgeIdRequired: "{index} নম্বর এজের 'id' আবশ্যক",
    errEdgeDuplicateId: "পুনরাবৃত্ত এজ আইডি: '{id}'",
    errEdgeUnknownNode: "এজ '{id}' অজানা নোড '{nodeId}'-কে নির্দেশ করছে",
    errEdgeSelfLoop: "এজ '{id}'-এ সেল্ফ-লুপ অনুমোদিত নয় ('{from}')",
    errEdgeDuplicatePair: "'{from}' ও '{to}'-এর মাঝে একাধিক এজ বিদ্যমান",
    errEdgeCostInvalid: "এজ '{id}'-এর খরচ অবশ্যই ধনাত্মক পূর্ণসংখ্যা হতে হবে",
    errInitialStateObject: "'initial_state'-এ blocked_nodes, blocked_edges, closed_exits থাকতে হবে",
    errBlockedNodeInvalid: "blocked_nodes-এ অবৈধ আইডি: '{id}'",
    errBlockedEdgeInvalid: "blocked_edges-এ অজানা এজ আইডি: '{id}'",
    errClosedExitInvalid: "closed_exits-এ অবৈধ আইডি: '{id}'",

    // Hover Tooltip
    tooltipType: "ধরন",
    tooltipStatus: "অবস্থা",
    tooltipCost: "খরচ"
  }
};

let currentLang = "en";

export function getLanguage() {
  return currentLang;
}

export function setLanguage(lang) {
  if (translations[lang]) {
    currentLang = lang;
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      updateDomTranslations();
    }
  }
}

export function t(key, params = {}) {
  const dict = translations[currentLang] || translations.en;
  let text = dict[key] || translations.en[key] || key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, "g"), v);
  }
  return text;
}

export function updateDomTranslations() {
  if (typeof document === "undefined") return;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) {
      el.textContent = t(key);
    }
  });

  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (key) {
      el.title = t(key);
    }
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    if (key) {
      el.setAttribute("aria-label", t(key));
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (key) {
      el.setAttribute("placeholder", t(key));
    }
  });
}
