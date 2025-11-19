/**
 * app.js — Core logic for The Healing Mic podcast app.
 *
 * Responsibilities:
 * - Fetch show previews and show details from the Podcast API.
 * - Manage theme (light/dark) with localStorage.
 * - Handle favourites (episodes & shows) with localStorage persistence.
 * - Track listening progress and finished episodes.
 * - Mount a global audio player that works across all pages.
 * - Render the Home, Show, and Favourites views.
 *
 * Live data: https://podcast-api.netlify.app
 */
const API_BASE = "https://podcast-api.netlify.app";
const GENRES = {
  1: "Personal Growth",
  2: "Investigative Journalism",
  3: "History",
  4: "Comedy",
  5: "Entertainment",
  6: "Business",
  7: "Fiction",
  8: "News",
  9: "Kids and Family",
};

/* =========================
   BASIC UTILS
========================= */

async function getJSON(url, signal) {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

/**
 * Fetch a list of podcast previews (used by the Home page).
 *
 * @param {AbortSignal} [signal]
 * @returns {Promise<Array<Object>>}
 */
export async function fetchPreviews(signal) {
  return getJSON(`${API_BASE}/`, signal);
}

/**
 * Fetch full details for a single show, including seasons and episodes.
 *
 * @param {string|number} id
 * @param {AbortSignal} [signal]
 * @returns {Promise<Object>}
 */
export async function fetchShowById(id, signal) {
  return getJSON(`${API_BASE}/id/${id}`, signal);
}

function $(sel, root = document) {
  return root.querySelector(sel);
}

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function fmtDateTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString();
}

function truncate(s = "", n = 120) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function genreNames(ids = []) {
  return ids.map((id) => GENRES[id] ?? `Genre ${id}`);
}
/* =========================
   THEME
========================= */

const THEME_KEY = "earbuzz:theme";

/**
 * Initialise the current theme (light/dark) and attach the toggle button handler.
 * Persists the theme in localStorage.
 */
export function initTheme() {
  const btn = $("#themeToggle");
  const saved = localStorage.getItem(THEME_KEY) || "light";

  function setTheme(mode) {
    document.documentElement.classList.toggle("dark", mode === "dark");
    localStorage.setItem(THEME_KEY, mode);
    if (btn) btn.textContent = mode === "dark" ? "☀️ Light" : "🌙 Dark";
  }

  // No button (page not fully mounted)
  if (!btn) {
    setTheme(saved);
    return;
  }

  // Prevent attaching the toggle handler more than once (StrictMode + re-mounts)
  if (btn.dataset.themeBound === "1") {
    setTheme(saved);
    return;
  }

  setTheme(saved);

  btn.addEventListener("click", () => {
    const next = document.documentElement.classList.contains("dark")
      ? "light"
      : "dark";
    setTheme(next);
  });

  btn.dataset.themeBound = "1";
}

/* =========================
   FAVOURITES STORAGE
========================= */

const FAVS_KEY = "earbuzz:favs:v1";
/**
 * FavItem {
 *  id: string;        // "show:<id>" or "showId:season:episode"
 *  title: string;
 *  showId: string;
 *  showTitle: string;
 *  season: number;
 *  episode: number;
 *  cover?: string;
 *  audio?: string;    // episode audio URL (for playback from favourites)
 *  addedAt: number;
 * }
 */

function readFavs() {
  try {
    const raw = localStorage.getItem(FAVS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeFavs(list) {
  localStorage.setItem(FAVS_KEY, JSON.stringify(list));
}

export function loadFavs() {
  return readFavs();
}

export function isFaved(id) {
  return readFavs().some((f) => f.id === id);
}

export function toggleFav(item) {
  const list = readFavs();
  const i = list.findIndex((f) => f.id === item.id);
  if (i >= 0) {
    list.splice(i, 1);
  } else {
    list.push({ ...item, addedAt: item.addedAt ?? Date.now() });
  }
  writeFavs(list);
  return list;
}

export function clearFavs() {
  writeFavs([]);
}

/* =========================
   LISTENING PROGRESS
========================= */

const LAST_TRACK_KEY = "earbuzz:lastTrack:v1";
const LAST_TRACK_STATE_KEY = "earbuzz:lastTrackState:v1"; // "playing" | "paused"
const PROG_KEY = "earbuzz:progress:v1";
/** { [episodeId]: { t:number, finished?:boolean, duration?:number } } */

function readProg() {
  try {
    const raw = localStorage.getItem(PROG_KEY);
    const map = raw ? JSON.parse(raw) : {};
    return map && typeof map === "object" ? map : {};
  } catch {
    return {};
  }
}

function writeProg(map) {
  localStorage.setItem(PROG_KEY, JSON.stringify(map));
}

export function saveProgress(id, t, finished, duration) {
  const map = readProg();
  const prev = map[id] || {};
  map[id] = {
    t,
    finished: finished || prev.finished,
    duration: typeof duration === "number" ? duration : prev.duration ?? 0,
  };
  writeProg(map);
}

export function loadProgress(id) {
  const entry = readProg()[id];
  return entry?.t ?? 0;
}

export function markFinished(id, duration) {
  const map = readProg();
  const prev = map[id] || {};
  map[id] = {
    t: prev.t ?? (typeof duration === "number" ? duration : 0),
    finished: true,
    duration: typeof duration === "number" ? duration : prev.duration ?? 0,
  };
  writeProg(map);
}

export function getProgress(id) {
  const map = readProg();
  return map[id] || null;
}

export function clearAllProgress() {
  localStorage.removeItem(PROG_KEY);
  // also clear last track so everything is fresh
  localStorage.removeItem(LAST_TRACK_KEY);
  localStorage.removeItem(LAST_TRACK_STATE_KEY);
  sessionStorage.removeItem(LAST_TRACK_KEY);
}

/* Helper to render a status pill */
function renderProgressPill(id) {
  const p = getProgress(id);
  if (!p) return "";

  if (p.finished) {
    return `<span class="status-pill finished">Finished</span>`;
  }

  let label = "In progress";
  if (p.duration && p.duration > 0 && p.t >= 0) {
    const pct = Math.round((p.t / p.duration) * 100);
    if (isFinite(pct) && pct >= 0 && pct <= 100) {
      label = `In progress • ${pct}%`;
    }
  }
  return `<span class="status-pill in-progress">${label}</span>`;
}
/* =========================
   HEART BUTTON (HTML)
========================= */

function renderHeartBtn(active) {
  return `
    <button
      class="heart ${active ? "on" : ""}"
      aria-pressed="${active}"
      aria-label="${active ? "Unfavourite" : "Favourite"}"
      type="button"
    >
      <svg viewBox="0 0 24 24">
        <path d="M12 21s-6-4.35-9-7.5C1 12 1 8.5 4 7s5 1 8 4c3-3 5-4.5 8-3s3 5 1 6.5C18 16.65 12 21 12 21z"/>
      </svg>
    </button>
  `;
}
