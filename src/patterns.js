// =============================================================================
//  SVG diagonal-stripe patterns for countries visited by more than one person.
//  Patterns are injected into Leaflet's overlay <svg> and referenced via
//  `fill="url(#id)"`. Identical colour-lists reuse the same pattern.
// =============================================================================

const SVGNS = 'http://www.w3.org/2000/svg';

/**
 * @param {SVGSVGElement} svg the Leaflet overlay <svg>
 * @param {{stripeWidth?: number}} options
 */
export function createStripeManager(svg, { stripeWidth = 9 } = {}) {
  let defs = svg.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS(SVGNS, 'defs');
    svg.insertBefore(defs, svg.firstChild);
  }

  const cache = new Map();
  let counter = 0;

  /**
   * Diagonal stripes of `colors` (in order). Returns a `url(#id)` fill string.
   * @param {string[]} colors
   */
  function fillFor(colors) {
    const key = colors.join('|');
    const cached = cache.get(key);
    if (cached) return cached;

    const n = colors.length;
    const tile = stripeWidth * n;
    const id = `stripe-${counter++}`;

    const pattern = document.createElementNS(SVGNS, 'pattern');
    pattern.setAttribute('id', id);
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');
    pattern.setAttribute('width', String(tile));
    pattern.setAttribute('height', String(tile));
    pattern.setAttribute('patternTransform', 'rotate(45)');

    colors.forEach((color, i) => {
      const rect = document.createElementNS(SVGNS, 'rect');
      rect.setAttribute('x', String(i * stripeWidth));
      rect.setAttribute('y', '0');
      rect.setAttribute('width', String(stripeWidth));
      rect.setAttribute('height', String(tile));
      rect.setAttribute('fill', color);
      pattern.appendChild(rect);
    });

    defs.appendChild(pattern);
    const url = `url(#${id})`;
    cache.set(key, url);
    return url;
  }

  return { fillFor };
}
