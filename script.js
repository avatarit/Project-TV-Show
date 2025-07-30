function setup() {
  const allEpisodes = getAllEpisodes();
  makePageForEpisodes(allEpisodes);
}

function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = ""; // Clear any existing content
  rootElem.className = "episode-grid"; // Add a class for CSS grid

  //const info = document.createElement("p");
  //info.textContent = `Got ${episodeList.length} episode(s)`;
  //info.className = "info-text";
  //rootElem.appendChild(info);

  episodeList.forEach((episode) => {
    const episodeCard = document.createElement("div");
    episodeCard.className = "episode-card";

    const episodeTitle = document.createElement("h3");
    episodeTitle.textContent = `${episode.name} S${String(episode.season).padStart(2, '0')}E${String(episode.number).padStart(2, '0')}`;
    

    const episodeImage = document.createElement("img");
    episodeImage.src = episode.image ? episode.image.medium : "https://via.placeholder.com/210x295?text=No+Image";
    episodeImage.alt = episode.name;
    

    const episodeSummary = document.createElement("p");
    episodeSummary.textContent = episode.summary ? episode.summary.replace(/<[^>]+>/g, "") : "No summary available.";
  

    episodeCard.appendChild(episodeTitle);
    episodeCard.appendChild(episodeImage);
    episodeCard.appendChild(episodeSummary);
    rootElem.appendChild(episodeCard);

  });
}
window.onload = setup;