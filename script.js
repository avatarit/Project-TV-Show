// ==============================
// TV Show App — script.js (a11y fix)
// ==============================

// -------------------- State --------------------
const state = {
  // shows view
  shows: [],
  filteredShows: [],
  showSearch: "",

  // episodes view
  currentShowId: null,
  allEpisodes: [],
  filteredEpisodes: [],
  episodeSearch: "",
  selectedEpisodeCode: "all",
};

// -------------------- Per-visit fetch cache --------------------
const fetchCache = new Map();
function fetchOnce(url) {
  if (fetchCache.has(url)) return fetchCache.get(url);
  const p = fetch(url).then((r) => {
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return r.json();
  });
  fetchCache.set(url, p);
  return p;
}

// -------------------- DOM --------------------
const showsView = document.getElementById("showsView");
const episodesView = document.getElementById("episodesView");
const backToShows = document.getElementById("backToShows");

const showSearchInput = document.getElementById("showSearch");
const showsRoot = document.getElementById("showsRoot");
const showCountEl = document.getElementById("showCount");
const showTotalEl = document.getElementById("showTotal");

const episodesRoot = document.getElementById("episodesRoot");
const episodeSearchInput = document.getElementById("episodeSearch");
const episodeSelector = document.getElementById("episodeSelector");
const manyEpisodesEl = document.getElementById("manyEpisodes");
const totalEpisodesEl = document.getElementById("totalEpisodes");

const loadingEl = document.getElementById("loadingMessage");
const errorEl = document.getElementById("errorMessage");
const notAvailable = document.getElementById("notAvailable");

// -------------------- Utilities --------------------
function showLoading(msg = "Loading…") {
  if (!loadingEl) return;
  loadingEl.style.display = "block";
  loadingEl.textContent = msg;
  const region = state.currentShowId ? episodesRoot : showsRoot;
  region?.setAttribute("aria-busy", "true");
}
function hideLoading() {
  if (!loadingEl) return;
  loadingEl.style.display = "none";
  const region = state.currentShowId ? episodesRoot : showsRoot;
  region?.setAttribute("aria-busy", "false");
}
function showError(msg) {
  if (!errorEl) return;
  errorEl.style.display = "block";
  errorEl.textContent = msg;
}
function clearError() {
  if (!errorEl) return;
  errorEl.style.display = "none";
  errorEl.textContent = "";
}
function stripHtml(s = "") {
  return s.replace(/<[^>]+>/g, "");
}
function episodeCode(ep) {
  const s = ep.season, n = ep.number;
  if (s == null || n == null) return ep.name ?? "Episode";
  return `S${String(s).padStart(2, "0")}E${String(n).padStart(2, "0")}`;
}
function sortShowsAlpha(shows) {
  return [...shows].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
}
function mins(v) {
  const n = Number(v);
  return Number.isFinite(n) ? `${n} min` : "–";
}

// --- Fixed-length summary settings ---
const SUMMARY_MAX_CHARS = 220; // adjust as you like
function clampChars(text, max = SUMMARY_MAX_CHARS) {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const slice = t.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const base = lastSpace > 40 ? slice.slice(0, lastSpace) : slice;
  return base.replace(/[.,;:!?]$/, "") + "…";
}

// -------------------- Data --------------------
function loadShows() {
  return fetchOnce("https://api.tvmaze.com/shows");
}
function loadEpisodes(showId) {
  return fetchOnce(`https://api.tvmaze.com/shows/${showId}/episodes`);
}

// -------------------- Shows View --------------------
function renderShows(list) {
  showsRoot.innerHTML = "";
  showCountEl.textContent = String(list.length);
  showTotalEl.textContent = String(state.shows.length);

  list.forEach((show) => {
    // Use native <article> semantics; DO NOT override with role=listitem
    const card = document.createElement("article");
    card.className = "show-card";

    const title = document.createElement("h2");

    const titleLink = document.createElement("a");
    titleLink.href = "#";
    titleLink.textContent = show.name;
    titleLink.setAttribute("aria-label", `View episodes for ${show.name}`);
    titleLink.addEventListener("click", (e) => {
      e.preventDefault();
      enterEpisodesView(show.id);
    });
    title.appendChild(titleLink);

    const meta = document.createElement("div");
    meta.className = "show-meta";

    // Make image clickable & keyboard-activatable
    const imgLink = document.createElement("a");
    imgLink.href = "#";
    imgLink.setAttribute("aria-label", `View episodes for ${show.name}`);
    imgLink.addEventListener("click", (e) => { e.preventDefault(); enterEpisodesView(show.id); });

    const img = document.createElement("img");
    img.alt = show.name || "Show image";
    img.loading = "lazy";
    img.width = 210;
    img.height = 295;
    img.src =
      show.image?.medium ||
      show.image?.original ||
      "https://via.placeholder.com/210x295?text=No+Image";
    imgLink.appendChild(img);

    const info = document.createElement("div");
    info.className = "show-info";

    // Fixed character length summary
    const fullShowSummary = stripHtml(show.summary) || "No summary available.";
    const summary = document.createElement("p");
    summary.className = "show-summary";
    summary.textContent = clampChars(fullShowSummary);
    summary.title = fullShowSummary;

    const genres = document.createElement("p");
    genres.innerHTML = `<strong>Genres:</strong> ${show.genres?.join(", ") || "–"}`;

    const status = document.createElement("p");
    status.innerHTML = `<strong>Status:</strong> ${show.status ?? "–"}`;

    const rating = document.createElement("p");
    rating.innerHTML = `<strong>Rating:</strong> ${show.rating?.average ?? "–"}`;

    const rt = show.runtime ?? show.averageRuntime;
    const runtime = document.createElement("p");
    runtime.innerHTML = `<strong>Runtime:</strong> ${mins(rt)}`;

    info.appendChild(summary);
    info.appendChild(genres);
    info.appendChild(status);
    info.appendChild(rating);
    info.appendChild(runtime);

    meta.appendChild(imgLink);
    meta.appendChild(info);

    card.appendChild(title);
    card.appendChild(meta);

    showsRoot.appendChild(card);
  });
}

function applyShowSearch() {
  const term = (state.showSearch || "").toLowerCase();
  if (!term) {
    state.filteredShows = [...state.shows];
  } else {
    state.filteredShows = state.shows.filter((s) => {
      const name = s.name?.toLowerCase() ?? "";
      const genres = (s.genres || []).join(", ").toLowerCase();
      const summary = stripHtml(s.summary || "").toLowerCase();
      return name.includes(term) || genres.includes(term) || summary.includes(term);
    });
  }
  renderShows(state.filteredShows);
}

function showShowsView() {
  episodesView.style.display = "none";
  showsView.style.display = "block";
  episodesRoot.innerHTML = ""; // tidy
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// -------------------- Episodes View --------------------
async function enterEpisodesView(showId) {
  try {
    showLoading("Loading episodes…");
    clearError();

    state.currentShowId = showId;
    const episodes = await loadEpisodes(showId);

    state.allEpisodes = episodes;
    state.filteredEpisodes = episodes;
    state.selectedEpisodeCode = "all";
    state.episodeSearch = "";
    if (episodeSearchInput) episodeSearchInput.value = "";

    populateEpisodeSelector(episodes);
    renderEpisodes(episodes);

    showsView.style.display = "none";
    episodesView.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (e) {
    console.error(e);
    showError("Failed to load episodes. Please try again.");
  } finally {
    hideLoading();
  }
}

function populateEpisodeSelector(episodes) {
  episodeSelector.innerHTML = "";
  const all = document.createElement("option");
  all.value = "all";
  all.textContent = "All Episodes";
  episodeSelector.appendChild(all);

  episodes.forEach((ep) => {
    const opt = document.createElement("option");
    const code = episodeCode(ep);
    opt.value = code;
    opt.textContent = `${code} - ${ep.name}`;
    episodeSelector.appendChild(opt);
  });

  episodeSelector.value = "all";
}

function renderEpisodes(list) {
  episodesRoot.innerHTML = "";
  manyEpisodesEl.textContent = String(list.length);
  totalEpisodesEl.textContent = String(state.allEpisodes.length);

  if (!list.length) {
    notAvailable.style.display = "block";
    return;
  }
  notAvailable.style.display = "none";

  list.forEach((ep) => {
    // Use native <article> semantics; DO NOT override with role=listitem
    const card = document.createElement("article");
    card.className = "episode-card";
    card.id = episodeCode(ep);

    const h3 = document.createElement("h3");
    h3.textContent = `${ep.name} ${episodeCode(ep)}`;

    const a = document.createElement("a");
    a.href = ep.url;
    a.target = "_blank";
    a.rel = "noopener";

    const img = document.createElement("img");
    img.alt = ep.name ?? "Episode image";
    img.loading = "lazy";
    img.width = 210;
    img.height = 295;
    img.src =
      ep.image?.medium ||
      ep.image?.original ||
      "https://via.placeholder.com/210x295?text=No+Image";
    a.appendChild(img);

    // Fixed character length summary
    const fullEpSummary = stripHtml(ep.summary) || "No summary available.";
    const p = document.createElement("p");
    p.className = "episode-summary";
    p.textContent = clampChars(fullEpSummary);
    p.title = fullEpSummary;

    card.appendChild(h3);
    card.appendChild(a);
    card.appendChild(p);
    episodesRoot.appendChild(card);
  });
}

function applyEpisodeFilters() {
  const term = (state.episodeSearch || "").toLowerCase();
  let list = state.allEpisodes;

  if (state.selectedEpisodeCode !== "all") {
    list = list.filter((ep) => episodeCode(ep) === state.selectedEpisodeCode);
  }

  if (term) {
    list = list.filter((ep) => {
      const name = ep.name?.toLowerCase() ?? "";
      const sum = stripHtml(ep.summary).toLowerCase();
      const code = episodeCode(ep).toLowerCase();
      return name.includes(term) || sum.includes(term) || code.includes(term);
    });
  }

  state.filteredEpisodes = list;
  renderEpisodes(list);
}

function backToShowsHandler(e) {
  e.preventDefault();
  showShowsView();
}

// -------------------- Events --------------------
function bindEvents() {
  // Shows search
  showSearchInput.addEventListener("input", (e) => {
    state.showSearch = e.target.value;
    applyShowSearch();
  });

  // Back to shows
  backToShows.addEventListener("click", backToShowsHandler);

  // Episode controls
  episodeSelector.addEventListener("change", (e) => {
    state.selectedEpisodeCode = e.target.value || "all";
    applyEpisodeFilters();
  });

  episodeSearchInput.addEventListener("input", (e) => {
    state.episodeSearch = e.target.value;
    applyEpisodeFilters();
  });

  // Optional: hide toolbars on scroll down (episodes only)
  let lastScroll = 0;
  window.addEventListener("scroll", () => {
    if (episodesView.style.display === "none") return;
    const current = window.scrollY;
    const toolbars = document.querySelectorAll(".toolbar");
    toolbars.forEach((tb) => {
      tb.style.visibility = current > lastScroll ? "hidden" : "visible";
    });
    lastScroll = current;
  });

  // Optional intro animation cleanup
  setTimeout(() => {
    document.getElementById("intro-animation")?.classList.add("hidden");
  }, 1300);
}

// -------------------- Init --------------------
async function init() {
  try {
    showLoading("Loading shows…");
    clearError();

    const shows = await loadShows();
    state.shows = sortShowsAlpha(shows);
    state.filteredShows = [...state.shows];

    renderShows(state.filteredShows);
  } catch (e) {
    console.error(e);
    showError("Failed to load shows. Please refresh.");
  } finally {
    hideLoading();
  }

  bindEvents();
}

window.addEventListener("DOMContentLoaded", init);
