// =============================================================================
//  Light / dark.
//
//  The OS setting decides until the reader presses the toggle in the header.
//  From then on their choice is remembered and wins — that is the whole model,
//  and it is why `data-theme` on <html> is the single source of truth: the
//  stylesheet, the toggle icon and the map basemap all read it from there.
//
//  A tiny inline script in index.html applies the stored choice before the
//  first paint, so the page never flashes the theme you did not ask for. This
//  module takes over from it once the app boots.
// =============================================================================

const STORAGE_KEY = 'visited-countries:theme';

/** Page background per theme, for the mobile browser chrome. */
const CHROME = { light: '#f2f2f7', dark: '#000000' };

export function createTheme() {
  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const button = document.getElementById('theme-toggle');
  const listeners = new Set();

  /** The theme actually on screen: the chosen one, or whatever the OS says. */
  function current() {
    const chosen = root.dataset.theme;
    return chosen === 'light' || chosen === 'dark' ? chosen : system.matches ? 'dark' : 'light';
  }

  function announce() {
    const mode = current();

    if (button) {
      button.setAttribute('aria-pressed', String(mode === 'dark'));
      button.title = mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    }

    // Both meta tags carry the resolved colour: an explicit choice has to beat
    // the media queries they were written with, and when no choice is active
    // the resolved colour is the one the OS would have picked anyway.
    for (const id of ['theme-color-light', 'theme-color-dark']) {
      document.getElementById(id)?.setAttribute('content', CHROME[mode]);
    }

    for (const listener of listeners) listener(mode);
  }

  function choose(mode) {
    root.dataset.theme = mode;
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (err) {
      // Private mode: the choice holds for this visit and is forgotten after.
    }
    announce();
  }

  button?.addEventListener('click', () => choose(current() === 'dark' ? 'light' : 'dark'));

  // Without a choice of their own, follow the OS as it changes through the day.
  system.addEventListener('change', () => {
    if (!root.dataset.theme) announce();
  });

  announce();

  return {
    current,
    /** Call `fn` with the theme now, and again whenever it changes. */
    subscribe(fn) {
      listeners.add(fn);
      fn(current());
    },
  };
}
