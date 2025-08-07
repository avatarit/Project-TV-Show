function setup() {
  const allEpisodes = getAllEpisodes();
  display(allEpisodes);
  selectFeature(allEpisodes);
}

function makePageForEpisodes(episodeList) {
  // remove and clear any previous elements or classes
  document.getElementById("notAvailable").style.display = "none";

  const rootElem = document.getElementById("root");
  rootElem.innerHTML = ""; // Clear any existing content
  rootElem.className = "episode-grid"; // Add a class for CSS grid

  //const info = document.createElement("p");
  //info.textContent = `Got ${episodeList.length} episode(s)`;
  //info.className = "info-text";
  //rootElem.appendChild(info);

  if (episodeList) {
    episodeList.forEach((episode) => {
      const episodeCard = document.createElement("div");
      episodeCard.className = "episode-card";
      episodeCard.id = episode.name;

      const episodeTitle = document.createElement("h3");
      episodeTitle.textContent = `${episode.name} S${String(
        episode.season
      ).padStart(2, "0")}E${String(episode.number).padStart(2, "0")}`;
      episodeCard.appendChild(episodeTitle);

      const episodeImage = document.createElement("img");
      episodeImage.src = episode.image
        ? episode.image.medium
        : "https://via.placeholder.com/210x295?text=No+Image";
      episodeImage.alt = episode.name;
      episodeCard.appendChild(episodeImage);

      const episodeSummary = document.createElement("p");
      episodeSummary.textContent = episode.summary
        ? episode.summary.replace(/<[^>]+>/g, "")
        : "No summary available.";
      episodeCard.appendChild(episodeSummary);

      rootElem.appendChild(episodeCard);
    });
  } else {
    document.getElementById("notAvailable").style.display = "block";
  }
}
// filter by select
function selectFeature(allEpisodes) {
  const selectedEpisode = document.getElementById("selectedepisode");

  selectedEpisode.addEventListener("change", () => {
    let selectedEpisodeList = [];
    const manyEpisodes = document.getElementById("manyEpisodes");
    allEpisodes.forEach((episode) => {
      // check which episode the user selected
      if (episode.name == selectedEpisode.value) {
        selectedEpisodeList.push(episode);
        manyEpisodes.textContent = selectedEpisodeList.length;

        makePageForEpisodes(selectedEpisodeList);
      } else if (selectedEpisode.value == "default") {
        makePageForEpisodes(allEpisodes);
      }
    });
  });
  // using the DOM to create options
  allEpisodes.forEach((episode) => {
    let option = document.createElement("option");
    option.value = episode.name;
    option.textContent = `S${String(episode.number).padStart(2, 0)}E${String(
      episode.season
    ).padStart(2, 0)} -${episode.name}`;
    selectedEpisode.appendChild(option);
  });
}
// filtering by search

function display(allEpisodes) {
  // display the default episodes
  const manyEpisodes = document.getElementById("manyEpisodes");
  makePageForEpisodes(allEpisodes);
  manyEpisodes.textContent = 73;

// checking if the episode exists
  document.getElementById("search").addEventListener("keyup", (evt) => {
    let searchValue = document.getElementById("search").value.toLowerCase();
    // display the searched episode
    if (searchValue == "") {
      makePageForEpisodes(allEpisodes);
      manyEpisodes.textContent = 73;
    } else {
      let episodeList = [];
      for (let episode = 0; episode < allEpisodes.length; episode++) {
        if (
          allEpisodes[episode].summary.includes(searchValue) ||
          allEpisodes[episode].name.includes(searchValue)
        ) {
          episodeList.push(allEpisodes[episode]);
          makePageForEpisodes(episodeList);

          manyEpisodes.textContent = episodeList.length;
        }
      }
    }
    selectFeature(allEpisodes);
  });
}
// hide the bar when scrolling down
let preScroll = 0.0;
window.addEventListener("scroll", () => {
  let scroll = window.scrollY;
  if (scroll >= preScroll) {
    preScroll = scroll;
    document.getElementById("searchContainer").style.visibility = "hidden";
  } else {
    document.getElementById("searchContainer").style.visibility = "visible";
  }
});

// This is just the intro animation duration
setTimeout(() => {
  const introAnimation = document
    .getElementById("intro-animation")
    .classList.add("hidden");
}, 1300);

window.onload = setup;