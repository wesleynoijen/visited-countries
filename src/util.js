// =============================================================================
//  Small, dependency-free helpers.
// =============================================================================

/**
 * Normalise a country code for comparison: trim + uppercase.
 * Returns '' for anything that isn't a non-empty string.
 */
export function normalizeCode(code) {
  return typeof code === 'string' ? code.trim().toUpperCase() : '';
}

/**
 * Turn an ISO 3166-1 alpha-2 code into a flag emoji (e.g. 'NL' -> 🇳🇱).
 * Renders as a flag on iOS / macOS / Android and degrades to letters elsewhere.
 * Returns '' when no valid 2-letter code is available.
 */
export function flagEmoji(alpha2) {
  const cc = normalizeCode(alpha2);
  if (!/^[A-Z]{2}$/.test(cc)) return '';
  const A = 0x1f1e6; // regional indicator 'A'
  return String.fromCodePoint(A + (cc.charCodeAt(0) - 65), A + (cc.charCodeAt(1) - 65));
}

/** Case/locale-aware sort of objects by their `name` property. */
export function byName(a, b) {
  return a.name.localeCompare(b.name);
}

/** Create an element with optional class, text and attributes. */
export function el(tag, { className, text, attrs } = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  if (attrs) for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

/** A small round colour swatch element. */
export function colorDot(color, { ring = false } = {}) {
  const dot = el('span', { className: ring ? 'dot dot--ring' : 'dot' });
  dot.style.setProperty('--dot-color', color);
  return dot;
}
