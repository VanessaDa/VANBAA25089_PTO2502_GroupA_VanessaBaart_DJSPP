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
/* =========================
   GLOBAL AUDIO PLAYER
========================= */

/**
 * Mount the global audio player.
 * Restores last played track, listens for .play action buttons,
 * and syncs progress + state in localStorage/sessionStorage.
 */
export function mountPlayer() {
  // Prevent multiple initialisations (StrictMode + per-route calls)
  if (window.__earbuzzPlayerMounted) {
    return;
  }
  window.__earbuzzPlayerMounted = true;

  const audio = $("#audio");
  const playBtn = $("#playToggle");
  const back10 = $("#back10");
  const fwd10 = $("#fwd10");
  const range = $("#progress");
  const nowTitle = $("#nowTitle");
  const nowSub = $("#nowSub");

  if (!audio || !playBtn || !range || !nowTitle || !nowSub) {
    console.warn("mountPlayer: missing core player elements");
    return;
  }

  let current = null; // { id, title, subtitle, src }

  // Restore last track + state if we have one
  try {
    const rawTrack =
      sessionStorage.getItem(LAST_TRACK_KEY) ||
      localStorage.getItem(LAST_TRACK_KEY);
    const rawState = localStorage.getItem(LAST_TRACK_STATE_KEY);

    const last = rawTrack ? JSON.parse(rawTrack) : null;
    const lastState = rawState === "playing" ? "playing" : "paused";

    if (last && last.id && last.src) {
      current = last;
      audio.src = last.src;

      const t = loadProgress(last.id);
      if (!isNaN(t) && t > 0) audio.currentTime = t;

      nowTitle.textContent = last.title || "Now Playing";
      nowSub.textContent = last.subtitle || "";

      // Auto-resume if user was playing before navigation
      if (lastState === "playing") {
        audio
          .play()
          .then(() => {
            playBtn.textContent = "⏸";
          })
          .catch(() => {
            // If browser blocks autoplay, just show paused state
            playBtn.textContent = "▶️";
          });
      } else {
        playBtn.textContent = "▶️";
      }
    }
  } catch {
    // ignore
  }

  function setLastState(state) {
    localStorage.setItem(LAST_TRACK_STATE_KEY, state);
  }

  // Main play / pause toggle in footer
  playBtn.addEventListener("click", async () => {
    if (!audio.src) return;
    if (audio.paused) {
      try {
        await audio.play();
        playBtn.textContent = "⏸";
        setLastState("playing");
      } catch (err) {
        console.error("Footer playToggle error", err);
      }
    } else {
      audio.pause();
      playBtn.textContent = "▶️";
      setLastState("paused");
    }
  });

  back10?.addEventListener("click", () => {
    audio.currentTime = Math.max(0, audio.currentTime - 10);
  });

  fwd10?.addEventListener("click", () => {
    audio.currentTime = Math.min(
      audio.duration || audio.currentTime + 10,
      audio.currentTime + 10
    );
  });

  range.addEventListener("input", (e) => {
    const v = Number(e.target.value);
    if (audio.duration) {
      audio.currentTime = (v / 100) * audio.duration;
    }
  });

  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    range.value = String(Math.max(0, Math.min(100, Math.floor(pct))));
    if (current?.id) {
      saveProgress(current.id, audio.currentTime, false, audio.duration || 0);
    }
  });

  audio.addEventListener("ended", () => {
    if (current?.id) {
      markFinished(current.id, audio.duration || 0);
    }
    playBtn.textContent = "▶️";
    setLastState("paused");
  });

  // Warn if user reloads while audio is playing
  window.addEventListener("beforeunload", (e) => {
    if (!audio.paused) {
      setLastState("playing");
      const msg =
        "Audio is currently playing. Are you sure you want to leave this page?";
      e.preventDefault();
      e.returnValue = msg;
      return msg;
    } else {
      setLastState("paused");
    }
  });

  async function setTrack(track) {
    if (!track.src) {
      console.warn("setTrack called without audio src", track);
      return;
    }

    current = { ...track };

    audio.src = current.src;
    nowTitle.textContent = current.title || "Now Playing";
    nowSub.textContent = current.subtitle || "";
    sessionStorage.setItem(LAST_TRACK_KEY, JSON.stringify(current));
    localStorage.setItem(LAST_TRACK_KEY, JSON.stringify(current));

    const t = loadProgress(current.id);
    if (!isNaN(t) && t > 0) audio.currentTime = t;

    try {
      await audio.play();
      playBtn.textContent = "⏸";
      setLastState("playing");
    } catch (err) {
      console.error("Audio play error", err);
      playBtn.textContent = "▶️";
      setLastState("paused");
    }
  }

  // Make it visible globally for other module code
  window.__setTrack = setTrack;

  // Delegated click handler for ANY `.action.play` button
  document.addEventListener("click", async (event) => {
    const btn = event.target.closest(".action.play");
    if (!btn) return;

    const audioUrl = btn.dataset.audioUrl;
    const showId = btn.dataset.showId;

    try {
      // CASE 1: Episode favourite – we already have an audio URL
      if (audioUrl) {
        const id =
          btn.dataset.episodeId ||
          btn.dataset.id ||
          `temp:${Date.now().toString(36)}`;

        const title = btn.dataset.title || "Now Playing";
        const subtitle = btn.dataset.subtitle || "";

        await setTrack({ id, title, subtitle, src: audioUrl });
        return;
      }

      // CASE 2: Show favourite – fetch first episode and play it
      if (showId) {
        const show = await fetchShowById(showId);
        const firstSeason = show.seasons?.[0];
        const firstEp = firstSeason?.episodes?.[0];

        if (!firstSeason || !firstEp) {
          console.warn("No episodes found for show", showId);
          return;
        }

        const audio = firstEp.file || firstEp.audioUrl || "";

        if (!audio) {
          console.warn("No audio URL for first episode of show", showId);
          return;
        }

        const id = `${show.id}:${firstSeason.season}:${firstEp.episode}`;
        const title =
          `S${firstSeason.season}E${firstEp.episode} — ` +
          (firstEp.title || show.title);
        const subtitle = show.title;

        await setTrack({ id, title, subtitle, src: audio });
      }
    } catch (err) {
      console.error("Error handling Play button", err);
    }
  });
}

/* =========================
   HOME PAGE
========================= */

/**
 * Render the Home page: carousel, grid, filters, sorting.
 */
export async function renderHome() {
  const carousel = $("#carousel");
  const grid = $("#grid");
  const genreFilter = $("#genreFilter");
  const sortSelect = $("#sortSelect");
  if (!carousel || !grid) return;

  // show loading state while we fetch
  carousel.innerHTML = `
    <li class="card">
      <div class="loading">
        <div class="spinner"></div>
        <p>Loading recommended shows…</p>
      </div>
    </li>
  `;
  grid.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading shows…</p>
    </div>
  `;

  // genre dropdown
  if (genreFilter && genreFilter.children.length <= 1) {
    const frag = document.createDocumentFragment();
    Object.entries(GENRES).forEach(([id, name]) => {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = name;
      frag.appendChild(opt);
    });
    genreFilter.appendChild(frag);
  }

  const ctrl = new AbortController();

  try {
    const data = await fetchPreviews(ctrl.signal);
    let items = data;

    function applyFilters() {
      let list = items.slice();
      const g = genreFilter?.value || "All Genres";
      const s = sortSelect?.value || "newest";

      if (g !== "All Genres") {
        const gid = Number(g);
        list = list.filter((it) => it.genres?.includes(gid));
      }

      if (s === "oldest") {
        list.sort((a, b) => new Date(a.updated) - new Date(b.updated));
      } else {
        list.sort((a, b) => new Date(b.updated) - new Date(a.updated));
      }

      renderCarousel(list.slice(0, 10));
      renderGrid(list);
    }

    genreFilter?.addEventListener("change", applyFilters);
    sortSelect?.addEventListener("change", applyFilters);

    applyFilters();
  } catch (e) {
    grid.innerHTML = `<p role="alert">Failed to load shows: ${
      e.message || e
    }</p>`;
  }

  function renderCarousel(list) {
    carousel.innerHTML = "";

    list.forEach((show) => {
      const showFavId = `show:${show.id}`;
      const active = isFaved(showFavId);
      const li = document.createElement("li");
      li.className = "card";
      li.style.width = "260px";

      li.innerHTML = `
        ${renderHeartBtn(active)}
        <a class="card-link" href="#/show/${show.id}">
          <img src="${show.image}" alt="" class="cover" />
          <h3>${show.title}</h3>
          <div class="badges">
            ${genreNames(show.genres)
              .slice(0, 3)
              .map((g) => `<span class="badge">${g}</span>`)
              .join("")}
          </div>
        </a>
      `;

      const heart = li.querySelector(".heart");
      heart.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        toggleFav({
          id: showFavId,
          title: show.title,
          showId: String(show.id),
          showTitle: show.title,
          season: 0,
          episode: 0,
          cover: show.image,
        });
        heart.classList.toggle("on", isFaved(showFavId));
      });

      carousel.appendChild(li);
    });

    // loop back to start when user scrolls to end
    carousel.addEventListener("scroll", () => {
      const atEnd =
        carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 4;

      if (atEnd) {
        carousel.scrollTo({ left: 0, behavior: "smooth" });
      }
    });
  }

  function renderGrid(list) {
    grid.innerHTML = "";
    list.forEach((show) => {
      const showFavId = `show:${show.id}`;
      const active = isFaved(showFavId);
      const card = document.createElement("article");
      card.className = "card show-card";
      card.innerHTML = `
        ${renderHeartBtn(active)}
        <a class="card-link" href="#/show/${show.id}">
          <img class="cover" src="${show.image}" alt="">
          <h3>${show.title}</h3>
          <div class="pills">
            <span class="pill">${show.seasons ?? 0} seasons</span>
            <span class="pill">Updated ${fmtDate(show.updated)}</span>
          </div>
        </a>
      `;
      const heart = card.querySelector(".heart");
      heart.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        toggleFav({
          id: showFavId,
          title: show.title,
          showId: String(show.id),
          showTitle: show.title,
          season: 0,
          episode: 0,
          cover: show.image,
        });
        heart.classList.toggle("on", isFaved(showFavId));
      });
      grid.appendChild(card);
    });
  }
}
/* =========================
   SHOW PAGE
========================= */

/**
 * Render the Show page.
 * If idFromReact is provided (React HashRouter), that ID is used.
 * Otherwise falls back to ?id= from the URL (vanilla usage).
 */
export async function renderShow(idFromReact) {
  const cover = $("#showCover");
  const titleEl = $("#showTitle");
  const descEl = $("#showDescription");
  const genresEl = $("#genres");
  const updatedEl = $("#updatedMeta");
  const seasonsMeta = $("#seasonsMeta");
  const seasonSelect = $("#seasonSelect");
  const list = $("#episodeList");
  if (!list || !seasonSelect) return;

  // initial loading state
  list.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading show details…</p>
    </div>
  `;

  const searchId = new URLSearchParams(window.location.search || "").get("id");
  const id = idFromReact ?? searchId;

  if (!id) {
    list.innerHTML = `<p role="alert">Missing show id.</p>`;
    return;
  }

  const ctrl = new AbortController();
  try {
    const show = await fetchShowById(id, ctrl.signal);

    if (cover) {
      cover.src = show.image;
    }
    if (titleEl) {
      titleEl.textContent = show.title;
    }

    // === DESCRIPTION WITH READ MORE / READ LESS ===
    if (descEl) {
      descEl.innerHTML = "";
      const fullText = show.description || "";
      const limit = 350;

      if (fullText.length > limit) {
        const shortSpan = document.createElement("span");
        shortSpan.className = "desc-short";
        shortSpan.textContent = fullText.slice(0, limit) + "...";

        const fullSpan = document.createElement("span");
        fullSpan.className = "desc-full";
        fullSpan.textContent = fullText;
        fullSpan.style.display = "none";

        const toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.className = "read-more-toggle";
        toggleBtn.textContent = "Read more";

        toggleBtn.addEventListener("click", () => {
          const expanded = fullSpan.style.display === "inline";
          if (expanded) {
            fullSpan.style.display = "none";
            shortSpan.style.display = "inline";
            toggleBtn.textContent = "Read more";
          } else {
            fullSpan.style.display = "inline";
            shortSpan.style.display = "none";
            toggleBtn.textContent = "Read less";
          }
        });

        descEl.append(shortSpan, fullSpan, toggleBtn);
      } else {
        descEl.textContent = fullText;
      }
    }
    // === END DESCRIPTION BLOCK ===

    if (genresEl) {
      genresEl.innerHTML = genreNames(show.genres)
        .map((g) => `<span class="genre">${g}</span>`)
        .join("");
    }

    if (updatedEl) {
      updatedEl.textContent = show.updated
        ? `Updated ${fmtDate(show.updated)}`
        : "";
    }

    if (seasonsMeta) {
      seasonsMeta.textContent = `${show.seasons?.length || 0} season(s)`;
    }

    // build season dropdown
    seasonSelect.innerHTML = "";
    show.seasons
      .slice()
      .sort((a, b) => a.season - b.season)
      .forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s.season;
        opt.textContent = `S${s.season}${s.title ? ` — ${s.title}` : ""}`;
        seasonSelect.appendChild(opt);
      });

    function currentSeason() {
      const sn = Number(seasonSelect.value || show.seasons?.[0]?.season || 1);
      return show.seasons.find((s) => s.season === sn);
    }

    seasonSelect.addEventListener("change", () =>
      renderSeason(currentSeason())
    );

    renderSeason(currentSeason());

    function renderSeason(season) {
      list.innerHTML = "";
      if (!season) {
        list.innerHTML = `<p class="muted">No episodes for this season.</p>`;
        return;
      }

      season.episodes.forEach((ep) => {
        const eid = `${show.id}:${season.season}:${ep.episode}`;
        const etitle = ep.title || `Episode ${ep.episode}`;
        const audio = ep.file || ep.audioUrl || "";

        const row = document.createElement("div");
        row.className = "episode-row";
        row.innerHTML = `
          <img class="ep-cover" src="${season.image || show.image}" alt="">
          <div>
            <div class="ep-title">${etitle}</div>
            <div class="ep-summary">${truncate(ep.description || "", 200)}</div>
            <div class="ep-meta">
              <span class="muted">S${season.season} • E${ep.episode}</span>
              <span class="ep-progress"></span>
            </div>
          </div>
          <div class="actions">
            ${renderHeartBtn(isFaved(eid))}
            <button
              class="action play"
              type="button"
              data-episode-id="${eid}"
              data-audio-url="${audio}"
              data-title="S${season.season}E${ep.episode} — ${etitle}"
              data-subtitle="${show.title}"
            >
              Play
            </button>
          </div>
        `;

        // inject progress pill
        const progressSlot = row.querySelector(".ep-progress");
        if (progressSlot) {
          progressSlot.innerHTML = renderProgressPill(eid);
        }

        const heart = row.querySelector(".heart");
        heart.addEventListener("click", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          toggleFav({
            id: eid,
            title: etitle,
            showId: String(show.id),
            showTitle: show.title,
            season: season.season,
            episode: ep.episode,
            cover: season.image || show.image,
            audio,
          });
          heart.classList.toggle("on", isFaved(eid));
        });

        list.appendChild(row);
      });
    }
  } catch (e) {
    list.innerHTML = `<p role="alert">Failed to load show: ${
      e.message || e
    }</p>`;
  }
}
/* =========================
   FAVOURITES PAGE
========================= */

/**
 * Render the Favourites page with sorting, filtering, grouping, and removal.
 */
export function renderFavourites() {
  const container = $("#favContainer");
  const sortSel = $("#favSort");
  const filterSel = $("#favShowFilter");
  const clearBtn = $("#clearFavs");
  if (!container || !sortSel || !filterSel) return;

  let favs = loadFavs();

  // Add "Reset listening history" button into the toolbar (only on this page)
  const toolbar = document.querySelector(".toolbar");
  if (toolbar && !document.querySelector("#resetHistory")) {
    const resetBtn = document.createElement("button");
    resetBtn.id = "resetHistory";
    resetBtn.type = "button";
    resetBtn.className = "btn btn-danger";
    resetBtn.textContent = "Reset listening history";
    toolbar.appendChild(resetBtn);

    resetBtn.addEventListener("click", () => {
      if (confirm("Reset all listening progress for all episodes?")) {
        clearAllProgress();
        render();
      }
    });
  }

  // Populate the "Filter by show" dropdown
  function refreshFilter() {
    const shows = [...new Set(favs.map((f) => f.showTitle))].sort((a, b) =>
      a.localeCompare(b)
    );
    filterSel.innerHTML =
      `<option value="__all">All Shows</option>` +
      shows.map((s) => `<option value="${s}">${s}</option>`).join("");
  }

  function render() {
    const sort = sortSel.value;
    const filter = filterSel.value;
    let list = favs.slice();

    // Filter by show
    if (filter !== "__all") {
      list = list.filter((f) => f.showTitle === filter);
    }

    // Sorting
    switch (sort) {
      case "oldest":
        list.sort((a, b) => a.addedAt - b.addedAt);
        break;
      case "az":
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "za":
        list.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default: // newest
        list.sort((a, b) => b.addedAt - a.addedAt);
    }

    // Group by show title
    const groups = new Map();
    list.forEach((f) => {
      if (!groups.has(f.showTitle)) groups.set(f.showTitle, []);
      groups.get(f.showTitle).push(f);
    });

    container.innerHTML = "";
    if (list.length === 0) {
      container.innerHTML = `<p class="muted">No favourites yet. Add some from a show page ♥</p>`;
      return;
    }

    for (const [showTitle, items] of groups.entries()) {
      const sec = document.createElement("section");

      sec.innerHTML = `
        <div class="group">
          ${showTitle} <span class="count">(${items.length} episodes)</span>
        </div>
        <div class="episode-list"></div>
      `;

      const wrap = sec.querySelector(".episode-list");

      items.forEach((f) => {
        const cover = f.cover || "";
        const isEpisode = f.season && f.season > 0 && f.episode > 0;
        const audio = f.audio || "";

        const row = document.createElement("div");
        row.className = "episode-row";

        let actionsHtml;
        if (isEpisode) {
          // Episode favourite -> real Play button
          actionsHtml = `
            ${renderHeartBtn(true)}
            <button
              class="action play"
              type="button"
              data-episode-id="${f.id}"
              data-audio-url="${audio}"
              data-title="${f.showTitle} — ${f.title}"
              data-subtitle="${f.showTitle}"
            >
              Play
            </button>
            <button class="action remove" type="button">Remove</button>
          `;
        } else {
          // Show-level favourite -> "Play" that opens the show
          actionsHtml = `
    ${renderHeartBtn(true)}
    <button
      class="action play"
      type="button"
      data-show-id="${f.showId}"
    >
      Play
    </button>
    <button class="action remove" type="button">Remove</button>
  `;
        }

        row.innerHTML = `
          <img class="ep-cover" src="${cover}" alt="">
          <div>
            <div class="ep-title">${f.title}</div>
            <div class="ep-summary">
              Added ${fmtDateTime(f.addedAt)}
            </div>
            <div class="ep-meta">
              <span class="muted">S${f.season} • E${f.episode}</span>
              <span class="ep-progress"></span>
            </div>
          </div>
          <div class="actions">
            ${actionsHtml}
          </div>
        `;

        const progressSlot = row.querySelector(".ep-progress");
        if (progressSlot && isEpisode) {
          progressSlot.innerHTML = renderProgressPill(f.id);
        }

        const heart = row.querySelector(".heart");
        const removeBtn = row.querySelector(".action.remove");

        const doRemove = () => {
          toggleFav(f);
          favs = loadFavs();
          refreshFilter();
          render();
        };

        heart.addEventListener("click", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          doRemove();
        });

        removeBtn.addEventListener("click", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          doRemove();
        });

        wrap.appendChild(row);
      });

      container.appendChild(sec);
    }
  }

  sortSel.addEventListener("change", render);
  filterSel.addEventListener("change", render);
  clearBtn?.addEventListener("click", () => {
    if (confirm("Clear all favourites?")) {
      clearFavs();
      favs = [];
      refreshFilter();
      render();
    }
  });

  refreshFilter();
  render();
}
