const state = {
  allEpisodes: [],
  filteredEpisodes: [],
  selected: "default",
  search: "",
};

function setup() {
  state.allEpisodes = getAllEpisodes();
  state.filteredEpisodes = state.allEpisodes;

  populateSelect();
  displayEpisodes();
  bindEvents();
}

function populateSelect() {
  const select = document.getElementById("selectedepisode");
  select.innerHTML = `<option value="default">All Episodes</option>`;

  state.allEpisodes.forEach((ep) => {
    const option = document.createElement("option");
    option.value = ep.name;
    option.textContent = `S${String(ep.season).padStart(2, "0")}E${String(
      ep.number
    ).padStart(2, "0")} - ${ep.name}`;
    select.appendChild(option);
  });
}

function displayEpisodes() {
  const root = document.getElementById("root");
  const count = document.getElementById("manyEpisodes");
  const notAvailable = document.getElementById("notAvailable");

  root.innerHTML = "";
  root.className = "episode-grid";

  if (state.filteredEpisodes.length === 0) {
    notAvailable.style.display = "block";
    count.textContent = 0;
    return;
  }

  notAvailable.style.display = "none";
  count.textContent = state.filteredEpisodes.length;

  state.filteredEpisodes.forEach((ep) => {
    const card = document.createElement("div");
    card.className = "episode-card";
    card.id = ep.name;

    const title = document.createElement("h3");
    title.textContent = `${ep.name} S${String(ep.season).padStart(
      2,
      "0"
    )}E${String(ep.number).padStart(2, "0")}`;

    const img = document.createElement("img");
    img.src = ep.image?.medium || "https://via.placeholder.com/210x295?text=No+Image";
    img.alt = ep.name;

    const summary = document.createElement("p");
    summary.textContent = ep.summary
      ? ep.summary.replace(/<[^>]+>/g, "")
      : "No summary available.";

    card.appendChild(title);
    card.appendChild(img);
    card.appendChild(summary);
    root.appendChild(card);
  });
}

function applyFilters() {
  const searchText = state.search.toLowerCase();
  let result = state.allEpisodes;

  if (state.selected !== "default") {
    result = result.filter((ep) => ep.name === state.selected);
  }

  if (searchText) {
    result = result.filter((ep) => {
      const name = ep.name.toLowerCase();
      const summary = ep.summary?.replace(/<[^>]+>/g, "").toLowerCase() || "";
      return name.includes(searchText) || summary.includes(searchText);
    });
  }

  state.filteredEpisodes = result;
  displayEpisodes();
}

function bindEvents() {
  document.getElementById("selectedepisode").addEventListener("change", (e) => {
    state.selected = e.target.value;
    applyFilters();
  });

  document.getElementById("search").addEventListener("input", (e) => {
    state.search = e.target.value;
    applyFilters();
  });

  let lastScroll = 0;
  window.addEventListener("scroll", () => {
    const currentScroll = window.scrollY;
    document.getElementById("searchContainer").style.visibility =
      currentScroll > lastScroll ? "hidden" : "visible";
    lastScroll = currentScroll;
  });

  setTimeout(() => {
    document.getElementById("intro-animation")?.classList.add("hidden");
  }, 1300);
}

window.onload = setup;
