/**
 * src/core/graph.js
 * Graph geometry, bounding box, and SVG path smoothing utilities.
 */

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Calculates bounding box of graph nodes with padding.
 */
export function calculateBounds(nodes, padding = 48) {
  if (!nodes || nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600, centerX: 400, centerY: 300 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach((n) => {
    if (n.x < minX) minX = n.x;
    if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.y > maxY) maxY = n.y;
  });

  const width = Math.max(100, maxX - minX + padding * 2);
  const height = Math.max(100, maxY - minY + padding * 2);

  return {
    minX: minX - padding,
    minY: minY - padding,
    maxX: maxX + padding,
    maxY: maxY + padding,
    width,
    height,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2
  };
}

/**
 * Generates an SVG path string through an array of points {x, y} with rounded corners (radius ~10px).
 */
export function generateSmoothRoutePath(points, cornerRadius = 10) {
  if (!points || points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    // Vectors
    const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
    const v2 = { x: next.x - curr.x, y: next.y - curr.y };

    const len1 = Math.hypot(v1.x, v1.y);
    const len2 = Math.hypot(v2.x, v2.y);

    if (len1 === 0 || len2 === 0) {
      d += ` L ${curr.x} ${curr.y}`;
      continue;
    }

    // Radius cannot exceed half of either segment
    const r = Math.min(cornerRadius, len1 / 2, len2 / 2);

    // Point before corner
    const pStart = {
      x: curr.x - (v1.x / len1) * r,
      y: curr.y - (v1.y / len1) * r
    };

    // Point after corner
    const pEnd = {
      x: curr.x + (v2.x / len2) * r,
      y: curr.y + (v2.y / len2) * r
    };

    d += ` L ${pStart.x} ${pStart.y} Q ${curr.x} ${curr.y}, ${pEnd.x} ${pEnd.y}`;
  }

  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

/**
 * Formats cost change comparison: e.g. "COST 7 → 11 (+4)" or "NO ROUTE"
 */
export function formatCostDelta(oldCost, newCost, isNoRoute = false) {
  if (isNoRoute) {
    return `COST ${oldCost} → NO ROUTE`;
  }
  if (oldCost === undefined || oldCost === null) {
    return `COST ${newCost}`;
  }
  const diff = newCost - oldCost;
  const sign = diff > 0 ? `+${diff}` : diff === 0 ? "0" : `${diff}`;
  return `COST ${oldCost} → ${newCost} (${sign})`;
}
