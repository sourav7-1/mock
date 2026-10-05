/**
 * js/i18n.js
 * Internationalization (English & Bangla) for Smart Escape
 */

export const translations = {
  en: {
    // Header & Meta
    appTitle: "Smart Escape – Interactive Evacuation Route Simulator",
    appSubtitle: "Real-time emergency evacuation simulator and obstacle rerouter",
    languageToggle: "বাংলা",
    themeToggle: "High Contrast",
    themeToggleActive: "Standard Mode",
    exportPng: "Export PNG",

    // Action Bar
    modeSelectStart: "Select Start",
    modeToggleHazard: "Toggle Hazard",
    loadSample: "Load Sample",
    uploadBtn: "Upload JSON",
    resetBtn: "Reset Hazards",

    // Status Messages (must match exact requirement)
    statusNoRoute: "No route available",
    statusStartBlocked: "Starting location blocked",
    statusOk: "Optimal evacuation route active",
    statusNoStart: "No start location selected",

    // Side Panel Headings & Labels
    panelTitle: "Evacuation Status",
    buildingLabel: "Building",
    startNodeLabel: "Current Start",
    statusLabel: "Status",
    routeLabel: "Evacuation Route",
    chosenExitLabel: "Chosen Exit",
    totalCostLabel: "Total Cost",
    noneSelected: "None selected",

    // Hazards section
    hazardsHeader: "Active Hazards",
    blockedNodesLabel: "Blocked Nodes",
    blockedEdgesLabel: "Blocked Corridors",
    closedExitsLabel: "Closed Exits",
    noHazards: "None (corridors clear)",
    clickToUndo: "Click item to remove hazard",

    // Walkthrough controls
    walkthroughTitle: "Route Walkthrough",
    walkthroughStep: "Step {current} of {total}: {node}",
    walkthroughPrev: "Previous",
    walkthroughNext: "Next",
    walkthroughPlay: "Play",
    walkthroughPause: "Pause",
    walkthroughStop: "Stop",

    // Legend
    legendTitle: "Map Legend",
    legendRoom: "Room",
    legendJunction: "Corridor / Junction",
    legendExit: "Emergency Exit",
    legendStart: "Start Location",
    legendBlockedNode: "Blocked Node",
    legendClosedExit: "Closed Exit",
    legendBlockedEdge: "Blocked Corridor",
    legendRoute: "Evacuation Path",

    // Instructions
    instructionsTitle: "Quick Instructions",
    instructionsText: "• Use 'Select Start' mode to set where evacuation begins (rooms/junctions only).\n• Use 'Toggle Hazard' mode (or right-click) to block nodes, corridors, or close exits.\n• The simulator instantly calculates the safest, shortest exit path.",

    // Dropzone / File input
    dropzoneText: "Drag & drop building.json here, or click to browse",

    // Validation Errors
    validationTitle: "Building File Validation Error",
    errInvalidJson: "Invalid JSON format: {msg}",
    errRootObject: "JSON root must be an object",
    errBuildingString: "'building' field must be a non-empty string",
    errNodesArray: "'nodes' field must be an array",
    errNodeCount: "Node count must be between 2 and 60 (found {count})",
    errEdgeCount: "Edge count must be between 1 and 150 (found {count})",
    errNodeObject: "Node at index {index} must be an object",
    errNodeIdRequired: "Node at index {index} is missing a non-empty 'id' string",
    errNodeDuplicateId: "Duplicate node ID: '{id}'",
    errNodeLabelRequired: "Node '{id}' must have a non-empty string 'label'",
    errNodeTypeInvalid: "Node '{id}' type must be 'room', 'junction', or 'exit' (found '{type}')",
    errNodeCoordsInvalid: "Node '{id}' coordinates (x, y) must be finite numbers",
    errNeedRoomOrJunction: "Building must contain at least one room or junction",
    errNeedExit: "Building must contain at least one exit",
    errEdgesArray: "'edges' field must be an array",
    errEdgeObject: "Edge at index {index} must be an object",
    errEdgeIdRequired: "Edge at index {index} is missing a non-empty 'id' string",
    errEdgeDuplicateId: "Duplicate edge ID: '{id}'",
    errEdgeUnknownNode: "Edge '{id}' references non-existent node '{nodeId}'",
    errEdgeSelfLoop: "Self-loop edge not allowed on edge '{id}' (from '{from}' to '{to}')",
    errEdgeDuplicatePair: "Duplicate edge pair between nodes '{from}' and '{to}'",
    errEdgeCostInvalid: "Edge '{id}' cost must be a positive integer (found {cost})",
    errInitialStateObject: "'initial_state' must be an object with blocked_nodes, blocked_edges, and closed_exits arrays",
    errBlockedNodeInvalid: "blocked_nodes contains invalid or non-room/junction ID: '{id}'",
    errBlockedEdgeInvalid: "blocked_edges contains unknown edge ID: '{id}'",
    errClosedExitInvalid: "closed_exits contains invalid or non-exit ID: '{id}'",

    // General
    dismiss: "Dismiss",
    exitBlockedAlert: "Exits cannot be chosen as the starting point.",
    nodeBlockedAlert: "Starting location blocked"
  },
  bn: {
    // Header & Meta
    appTitle: "স্মার্ট এস্কেপ – ইন্টারঅ্যাক্টিভ ইভাকুয়েশন রুট সিমুলেটর",
    appSubtitle: "জরুরি স্থানান্তর পথ পরিকল্পনা ও রিয়েল-টাইম বাধা সিমুলেটর",
    languageToggle: "English",
    themeToggle: "উচ্চ বৈসাদৃশ্য",
    themeToggleActive: "সাধারণ মোড",
    exportPng: "পিএনজি সংরক্ষণ",

    // Action Bar
    modeSelectStart: "শুরুর স্থান নির্বাচন",
    modeToggleHazard: "বিপদ/বাধা পরিবর্তন",
    loadSample: "নমুনা লোড করুন",
    uploadBtn: "জেসন আপলোড",
    resetBtn: "রিসেট করুন",

    // Status Messages (exact Bangla equivalents)
    statusNoRoute: "কোনো পথ পাওয়া যায়নি",
    statusStartBlocked: "শুরুর স্থান অবরুদ্ধ",
    statusOk: "নিরাপদ স্থানান্তর পথ সক্রিয়",
    statusNoStart: "কোনো শুরুর স্থান নির্বাচিত নয়",

    // Side Panel Headings & Labels
    panelTitle: "স্থানান্তর অবস্থা",
    buildingLabel: "ভবন",
    startNodeLabel: "বর্তমান শুরুর স্থান",
    statusLabel: "অবস্থা",
    routeLabel: "নিষ্ক্রমণ পথ",
    chosenExitLabel: "নির্বাচিত প্রস্থান",
    totalCostLabel: "মোট খরচ",
    noneSelected: "কোনোটি নির্বাচিত নয়",

    // Hazards section
    hazardsHeader: "সক্রিয় বিপদ ও প্রতিবন্ধকতা",
    blockedNodesLabel: "অবরুদ্ধ নোডসমূহ",
    blockedEdgesLabel: "অবরুদ্ধ করিডোরসমূহ",
    closedExitsLabel: "বন্ধ প্রস্থানসমূহ",
    noHazards: "কোনোটি নেই (সকল করিডোর উন্মুক্ত)",
    clickToUndo: "প্রতিবন্ধকতা সরাতে ক্লিক করুন",

    // Walkthrough controls
    walkthroughTitle: "ধাপে ধাপে পথনির্দেশ",
    walkthroughStep: "ধাপ {current} / {total}: {node}",
    walkthroughPrev: "পূর্ববর্তী",
    walkthroughNext: "পরবর্তী",
    walkthroughPlay: "চালান",
    walkthroughPause: "থামান",
    walkthroughStop: "বন্ধ করুন",

    // Legend
    legendTitle: "মানচিত্র সংকেত",
    legendRoom: "রুম (কক্ষ)",
    legendJunction: "করিডোর / সংযোগস্থল",
    legendExit: "জরুরি প্রস্থান",
    legendStart: "শুরুর স্থান",
    legendBlockedNode: "অবরুদ্ধ নোড (বিপদ)",
    legendClosedExit: "বন্ধ প্রস্থান",
    legendBlockedEdge: "অবরুদ্ধ করিডোর",
    legendRoute: "নিষ্ক্রমণ পথ",

    // Instructions
    instructionsTitle: "ব্যবহার নির্দেশিকা",
    instructionsText: "• 'শুরুর স্থান নির্বাচন' মোডে যেকোনো রুম বা সংযোগস্থলে ক্লিক করে স্থানান্তর শুরু করুন।\n• 'বিপদ/বাধা পরিবর্তন' মোডে (বা রাইট-ক্লিকে) নোড, করিডোর বা প্রস্থান অবরুদ্ধ করুন।\n• সিমুলেটর তৎক্ষণাৎ সবচেয়ে নিরাপদ ও সংক্ষিপ্ততম পথ নির্ণয় করবে।",

    // Dropzone / File input
    dropzoneText: "এখানে building.json ড্রপ করুন অথবা নির্বাচন করতে ক্লিক করুন",

    // Validation Errors
    validationTitle: "ভবন ফাইল যাচাইকরণ ত্রুটি",
    errInvalidJson: "অবৈধ জেসন ফরম্যাট: {msg}",
    errRootObject: "জেসন রুট অবশ্যই একটি অবজেক্ট হতে হবে",
    errBuildingString: "'building' ফিল্ডটি একটি অ-খালি স্ট্রিং হতে হবে",
    errNodesArray: "'nodes' ফিল্ডটি অবশ্যই একটি অ্যারে হতে হবে",
    errNodeCount: "নোডের সংখ্যা ২ থেকে ৬০ এর মধ্যে হতে হবে (পাওয়া গেছে {count})",
    errEdgeCount: "এজের সংখ্যা ১ থেকে ১৫০ এর মধ্যে হতে হবে (পাওয়া গেছে {count})",
    errNodeObject: "{index} নম্বর নোডটি একটি অবজেক্ট হতে হবে",
    errNodeIdRequired: "{index} নম্বর নোডের একটি সঠিক অ-খালি 'id' প্রয়োজন",
    errNodeDuplicateId: "পুনরাবৃত্ত নোড আইডি: '{id}'",
    errNodeLabelRequired: "নোড '{id}'-এ একটি অ-খালি 'label' আবশ্যক",
    errNodeTypeInvalid: "নোড '{id}'-এর ধরন অবশ্যই 'room', 'junction', অথবা 'exit' হতে হবে (পাওয়া গেছে '{type}')",
    errNodeCoordsInvalid: "নোড '{id}'-এর স্থানাঙ্ক (x, y) সসীম সংখ্যা হতে হবে",
    errNeedRoomOrJunction: "ভবনে অন্তত একটি রুম বা সংযোগস্থল থাকতে হবে",
    errNeedExit: "ভবনে অন্তত একটি জরুরি প্রস্থান থাকতে হবে",
    errEdgesArray: "'edges' ফিল্ডটি অবশ্যই একটি অ্যারে হতে হবে",
    errEdgeObject: "{index} নম্বর এজটি একটি অবজেক্ট হতে হবে",
    errEdgeIdRequired: "{index} নম্বর এজের একটি সঠিক অ-খালি 'id' প্রয়োজন",
    errEdgeDuplicateId: "পুনরাবৃত্ত এজ আইডি: '{id}'",
    errEdgeUnknownNode: "এজ '{id}' বিদ্যমান নেই এমন নোড '{nodeId}'-কে নির্দেশ করছে",
    errEdgeSelfLoop: "এজ '{id}'-এ সেল্ফ-লুপ অনুমোদিত নয় (from '{from}' to '{to}')",
    errEdgeDuplicatePair: "'{from}' এবং '{to}'-এর মধ্যে পুনরাবৃত্ত এজ বিদ্যমান",
    errEdgeCostInvalid: "এজ '{id}'-এর খরচ অবশ্যই ধনাত্মক পূর্ণসংখ্যা হতে হবে (পাওয়া গেছে {cost})",
    errInitialStateObject: "'initial_state' অবশ্যই blocked_nodes, blocked_edges, এবং closed_exits অ্যারে সংবলিত অবজেক্ট হতে হবে",
    errBlockedNodeInvalid: "blocked_nodes-এ অবৈধ বা রুম/জাংশন বহির্ভূত আইডি: '{id}'",
    errBlockedEdgeInvalid: "blocked_edges-এ অজানা এজ আইডি: '{id}'",
    errClosedExitInvalid: "closed_exits-এ অবৈধ বা প্রস্থান বহির্ভূত আইডি: '{id}'",

    // General
    dismiss: "বাতিল করুন",
    exitBlockedAlert: "প্রস্থানকে শুরুর স্থান হিসেবে নির্বাচন করা যাবে না।",
    nodeBlockedAlert: "শুরুর স্থান অবরুদ্ধ"
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

