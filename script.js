// ---------- State ----------
const state = {
  shows: [],
  currentShowId: null,
  allEpisodes: [],
  filteredEpisodes: [],
  selectedCode: "all",
  search: "",
};

// ---------- Per-visit fetch cache (never fetch same URL twice) ----------
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

// ---------- DOM ----------
const root = document.getElementById("root");
const showSel = document.getElementById("showSelector");
const epSel = document.getElementById("episodeSelector");
const searchInput = document.getElementById("search");
const manyEl = document.getElementById("manyEpisodes");
const totalEl = document.getElementById("totalEpisodes");

// Status helpers
function showLoadingMessage(msg = "Loading…") {
  const el = document.getElementById("loadingMessage");
  if (el) {
    el.style.display = "block";
    el.textContent = msg;
  }
}
function hideLoadingMessage() {
  const el = document.getElementById("loadingMessage");
  if (el) el.style.display = "none";
}
function showErrorMessage(message) {
  const errorDiv = document.getElementById("errorMessage");
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
  }
}
function clearError() {
  const errorDiv = document.getElementById("errorMessage");
  if (errorDiv) {
    errorDiv.textContent = "";
    errorDiv.style.display = "none";
  }
}

// ---------- Utils ----------
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
function stripHtml(s) {
  return s ? s.replace(/<[^>]+>/g, "") : "";
}

// ---------- Data ----------
function loadShows() {
  return fetchOnce("https://api.tvmaze.com/shows");
}
function loadEpisodes(showId) {
  return fetchOnce(`https://api.tvmaze.com/shows/${showId}/episodes`);
}

// ---------- Rendering ----------
function renderEpisodes(list) {
  const notAvailable = document.getElementById("notAvailable");
  root.innerHTML = "";
  root.className = "episode-grid";

  manyEl.textContent = String(list.length);
  totalEl.textContent = String(state.allEpisodes.length);

  if (!list.length) {
    if (notAvailable) notAvailable.style.display = "block";
    return;
  }
  if (notAvailable) notAvailable.style.display = "none";

  list.forEach((ep) => {
    const card = document.createElement("div");
    card.className = "episode-card";
    card.id = episodeCode(ep);

    const title = document.createElement("h3");
    title.textContent = `${ep.name} ${episodeCode(ep)}`;

    const img = document.createElement("img");
    img.src =
      ep.image?.medium ||
      ep.image?.original ||
      "https://via.placeholder.com/210x295?text=No+Image";
    img.alt = ep.name ?? "Episode";

    const link = document.createElement("a");
    link.href = ep.url;
    link.target = "_blank";
    link.appendChild(img);

    const summary = document.createElement("p");
    summary.textContent = stripHtml(ep.summary) || "No summary available.";

    card.appendChild(title);
    card.appendChild(link);
    card.appendChild(summary);
    root.appendChild(card);
  });
}

function populateShowSelector(shows) {
  showSel.innerHTML = "";
  const ph = document.createElement("option");
  ph.value = "";
  ph.textContent = "Select a show…";
  showSel.appendChild(ph);

  sortShowsAlpha(shows).forEach((s) => {
    const opt = document.createElement("option");
    opt.value = String(s.id);
    opt.textContent = s.name;
    showSel.appendChild(opt);
  });
}

function populateEpisodeSelector(episodes) {
  epSel.innerHTML = "";
  const all = document.createElement("option");
  all.value = "all";
  all.textContent = "All Episodes";
  epSel.appendChild(all);

  episodes.forEach((ep) => {
    const code = episodeCode(ep);
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = `${code} - ${ep.name}`;
    epSel.appendChild(opt);
  });

  epSel.value = "all";
}

// ---------- Filters ----------
function applyFilters() {
  const term = (state.search || "").toLowerCase();
  let result = state.allEpisodes;

  if (state.selectedCode !== "all") {
    result = result.filter((ep) => episodeCode(ep) === state.selectedCode);
  }

  if (term) {
    result = result.filter((ep) => {
      const name = ep.name?.toLowerCase() ?? "";
      const summary = stripHtml(ep.summary).toLowerCase();
      const code = episodeCode(ep).toLowerCase();
      return name.includes(term) || summary.includes(term) || code.includes(term);
    });
  }

  state.filteredEpisodes = result;
  renderEpisodes(result);
}

// ---------- Flows ----------
async function setActiveShow(showId) {
  try {
    showLoadingMessage("Loading episodes…");
    clearError();

    state.currentShowId = showId;
    const episodes = await loadEpisodes(showId);

    state.allEpisodes = episodes;
    state.filteredEpisodes = episodes;
    state.selectedCode = "all";
    state.search = "";
    if (searchInput) searchInput.value = "";

    populateEpisodeSelector(episodes);
    renderEpisodes(episodes);
  } catch (e) {
    showErrorMessage("Error loading episodes. Please try another show.");
    console.error(e);
  } finally {
    hideLoadingMessage();
  }
}

// ---------- Events ----------
function bindEvents() {
  epSel.addEventListener("change", (e) => {
    state.selectedCode = e.target.value || "all";
    applyFilters();
  });

  searchInput.addEventListener("input", (e) => {
    state.search = e.target.value || "";
    applyFilters();
  });

  showSel.addEventListener("change", async (e) => {
    const id = e.target.value;
    if (!id) return;
    await setActiveShow(id);
  });

  // Hide control bar when scrolling down
  let lastScroll = 0;
  window.addEventListener("scroll", () => {
    const current = window.scrollY;
    const bar = document.getElementById("searchContainer");
    if (bar) bar.style.visibility = current > lastScroll ? "hidden" : "visible";
    lastScroll = current;
  });

  // Optional intro animation dismiss
  setTimeout(() => {
    document.getElementById("intro-animation")?.classList.add("hidden");
  }, 1300);
}

// ---------- Init ----------
async function init() {
  try {
    showLoadingMessage("Loading shows…");
    clearError();

    const shows = await loadShows();
    state.shows = shows;
    populateShowSelector(shows);

    // Default to the first show alphabetically
    const first = sortShowsAlpha(shows)[0];
    if (first) {
      showSel.value = String(first.id);
      await setActiveShow(first.id);
    }

    bindEvents();
  } catch (e) {
    showErrorMessage("Error loading shows. Please refresh.");
    console.error(e);
  } finally {
    hideLoadingMessage();
  }
}

window.addEventListener("DOMContentLoaded", init);
