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
