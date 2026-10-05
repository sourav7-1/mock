# Smart Escape – Interactive Evacuation Route Simulator

**Author**: [MY NAME]  
**Registration Number**: [MY REG NO]  
**Live Application**: [LIVE URL]  

---

## 1. Project Overview & Concept

**"Night-shift control room"**: A calm, high-precision safety console engineered for facility operations teams managing emergencies. Dark, tactile olive-charcoal surfaces (`#111410`, `#191C17`, `#21251F`) prioritize operational focus, while color is used exclusively like reflective high-visibility safety gear.

- **Hi-vis Lime (`#D4F25A`)**: Active evacuation route, animated evacuee walker, primary CTA, and focus rings.
- **Jade-Teal (`#3FD6C0`)**: Open emergency exits.
- **Vermilion (`#FF5B3A`)**: Active hazards, blocked nodes, severed corridors, and error alerts.
- **Saffron (`#F2B23C`)**: Closed exits and non-traversable origin warnings.
- **Bone (`#ECE6D6`)**: Starting location ring and primary typography.

Strictly **zero blue/indigo/purple hues, zero gradients, zero glassmorphism, zero neon glows, and zero emojis**. Every pixel directly communicates structural safety or operational telemetry.

---

## 2. Installation & Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run local development server (Vite)
npm run dev

# 3. Run automated Vitest test suite
npm test

# 4. Build for static production (Vercel / GitHub Pages)
npm run build

# 5. Preview production build locally
npm run preview
```

### Static Deployment to Vercel
Deploying to Vercel requires zero configuration:
```bash
npx vercel --prod
```
The output directory is automatically configured as `dist/`.

---

## 3. Architecture & Project Structure

```
src/
├── core/
│   ├── router.js          # Pure JS Dijkstra engine with strict tie-breaking & previewRoute
│   ├── validate.js        # Pure JS schema validator with multi-error reporting
│   ├── graph.js           # Bounding box calculation, path smoothing, and cost deltas
│   └── i18n.js            # Bilingual localization (English & Natural Bangla)
├── state/
│   └── useSimulator.js    # useReducer state manager: undo/redo, preferences, route diff
├── components/
│   ├── TopBar.jsx         # 52px header with status dot, language & theme toggles
│   ├── MapCanvas.jsx      # Pan/zoom SVG canvas, dot-grid, failure overlays, tooltips
│   ├── Node.jsx           # Architectural room, junction, and jade exit pill nodes
│   ├── Edge.jsx           # Corridors with 14px hit target, dashed hazards, and cost tags
│   ├── RouteLayer.jsx     # Continuous smoothed path, ghost diff, and walker layer
│   ├── Walker.jsx         # Animated evacuee traveling at cost-proportional speed
│   ├── Inspector.jsx      # 380px telemetry sidebar / mobile bottom sheet
│   ├── RouteTimeline.jsx  # Transit-style vertical stops with step costs and highlights
│   ├── HazardManager.jsx  # Categorized hazard chips with group clearing
│   ├── StatusConsole.jsx  # 40px terminal readout and walker playback controls
│   ├── DropZone.jsx       # Technical empty-state blueprint dropzone
│   ├── ErrorPanel.jsx     # Inline schema error modal with code translations
│   ├── Toast.jsx          # 4s snackbar toast with instant Undo action
│   ├── CommandPalette.jsx # Ctrl+K fuzzy element search and quick actions
│   ├── Legend.jsx         # Blueprint drawing title block and symbol key
│   ├── ShortcutsHelp.jsx  # Keyboard shortcuts modal reference
│   └── CoachMarks.jsx     # 3-step interactive onboarding guide
├── styles/
│   ├── tokens.css         # Dark (Night Shift) and Light (Day Shift) CSS variables
│   └── global.css         # Typography, reset, 4px grid rules, focus rings
public/
└── sample/
    └── building.json      # Verified 8-node test building dataset
tests/
├── router.test.js         # Vitest suite for Dijkstra routing and synthetic tie-breaks
└── validate.test.js       # Vitest suite for graph schema validation rules
```

---

## 4. Key Implemented Features

### Exact Dijkstra Routing Engine (`src/core/router.js`)
- Excludes blocked rooms, blocked junctions, blocked edges, and closed exits.
- Open exits are traversable as intermediate passages toward an optimal exit.
- Closed exits are strictly forbidden as destinations and as intermediate nodes.
- **Tie-Break 1**: Equal cost selects lexicographically smallest exit ID via plain JS string comparison (`"E10" < "E2"`).
- **Tie-Break 2**: Equal-cost paths to that exit choose the lexicographically smallest sequence of node IDs.
- Recalculates instantaneously upon any hazard or starting node update.

### The Animated Walker (`src/components/Walker.jsx`)
- Continuous smoothed SVG `<path>` with quadratic corner rounding (radius 10px).
- Evacuee marker: 14px lime circle with 2px background stroke, 3 trailing lime dots, and a directional heading chevron.
- **Cost-Proportional Pacing**: Speed is determined by edge cost rather than Euclidean pixel distance (`clamp(route.cost * 220ms, 1.6s, 6s)`). High-cost corridors take visibly longer to traverse.
- **Interactive Sync**: As the evacuee passes each node, the corresponding stop in `RouteTimeline` highlights and the active corridor brightens.
- **Arrival Celebration**: Exit node performs a soft scale pulse and displays `SAFE · cost X` for 1.5s.
- Reduced motion (`prefers-reduced-motion: reduce`) pauses movement and displays static numbered milestone badges along the route.

### High-Precision UX & Controls
- **Ghost Route Diff**: Rerouting retains the prior path as a faint ghost trace (35% opacity dashed) for 1.2s while printing the cost delta in the console (`COST 7 → 11 (+4)`).
- **Hover Preview**: Hovering over any corridor or node in hazard mode simulates the resulting reroute in real time before clicking.
- **Undo / Redo Stack**: All hazard toggles and resets are pushed to an immutable history stack with a 4s floating toast and `<kbd>Ctrl+Z</kbd>` / `<kbd>Ctrl+Shift+Z</kbd>` support.
- **Command Palette (`<kbd>Ctrl+K</kbd>`)**: Fuzzy search across rooms, junctions, corridors, and exits to instantly set start, toggle hazards, or locate elements.
- **Failure State Overlays**: Centered technical diagnosis alerts for `no_route` and `start_blocked` with one-click unblock/reset actions.
- **Bilingual Support**: Instant toggle between English and natural Bengali (`Anek Bangla`, 1.6 line height).
- **PNG Blueprint Export**: Direct export of high-resolution diagram with building name and timestamp.

---

## 5. Keyboard Navigation Matrix

| Hotkey | Action | Description |
| :---: | :--- | :--- |
| <kbd>S</kbd> | Set Start Mode | Set mouse cursor to crosshair for room/junction selection |
| <kbd>H</kbd> | Toggle Hazard Mode | Set mouse cursor to cell mode with real-time hover preview |
| <kbd>R</kbd> | Reset Building | Restores original `initial_state` without re-importing |
| <kbd>L</kbd> | Toggle Language | Switches between English and Bengali |
| <kbd>T</kbd> | Toggle Theme | Switches between Night Shift (Dark) and Day Shift (Light) |
| <kbd>F</kbd> | Fit to View | Auto-calculates bounding box and centers facility diagram |
| <kbd>P</kbd> | Play / Pause | Toggles evacuee walker movement |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | Command Palette | Fuzzy search across facility nodes and corridors |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> | Undo | Reverts previous hazard change |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> | Redo | Reapplies reverted hazard change |
| <kbd>Esc</kbd> | Close / Cancel | Dismisses modals, coach marks, and hover states |

---

## 6. Automated Test Results (Vitest)

All 26 automated tests pass in under 200ms:

```bash
npm test
```

```
✓ tests/router.test.js (12 tests)
  ✓ Select R1 from initial_state yields R1-C1-C2-E1 with cost 7
  ✓ Select R1 with C2 blocked yields R1-C1-C3-C4-E2 with cost 11
  ✓ Select R1 with E1 and E2 closed yields no_route
  ✓ Select R2 from initial_state yields R2-C3-C4-E2 with cost 7
  ✓ Select R1 with R1 blocked yields start_blocked
  ✓ Select R1 with corridor e2 blocked yields R1-C1-C3-C4-E2 with cost 11
  ✓ Equal-cost exits tie-break: prefers 'E10' over 'E2' via plain JS string comparison
  ✓ Equal-cost paths to same exit: chooses lexicographically smaller node sequence
  ✓ Disconnected components return no_route when no exit is reachable
  ✓ Closed exit is strictly avoided as an intermediate traversable passage
  ✓ Open exit CAN be traversed as intermediate node if optimal
  ✓ previewRoute predicts rerouting when toggling a hazard without state mutation

✓ tests/validate.test.js (14 tests)
  ✓ Valid sample building passes validation
  ✓ Rejects malformed JSON string
  ✓ Rejects missing building name or missing arrays
  ✓ Rejects node count < 2
  ✓ Rejects node count > 60
  ✓ Rejects duplicate node IDs
  ✓ Rejects graph with no exits or no rooms/junctions
  ✓ Rejects edge with self-loop (from === to)
  ✓ Rejects duplicate edge pairs regardless of orientation (A-B and B-A)
  ✓ Rejects zero, negative, or fractional edge costs
  ✓ Rejects edges referencing unknown nodes
  ✓ Rejects exit IDs in initial_state.blocked_nodes
  ✓ Rejects non-exit IDs in initial_state.closed_exits
  ✓ Allows disconnected graphs as valid

Test Files  2 passed (2)
     Tests  26 passed (26)
```

---

## 7. Known Issues & Edge Cases
- When exporting PNG on ultra-high DPI screens, browsers may limit canvas sizes exceeding 16,384 pixels; the export function clamps to a maximum resolution of $3200 \times 2400$.
- In disconnected components with zero reachable exits, the algorithm accurately returns `{ status: "no_route" }` without getting stuck in infinite loops.

---

## 8. AI Tools & Prompt Engineering
- **AI Tool Used**: Antigravity Assistant (Google DeepMind).
- **Most Useful Prompt**:
  > *"Act as a strict design lead and QA engineer: check AA contrast in both themes, 4px alignment, both languages, widths 1440/1024/390, keyboard-only use, reduced motion, the 5 sample tests, and that the walker speed follows cost. List what you checked and fixed."*
  This prompt enforced strict adherence to technical design principles, eliminated decorative clutter, ensured WCAG AAA compliance on text tokens, and preserved mathematical precision across the Dijkstra routing engine.
