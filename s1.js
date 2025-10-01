let currentsong = new Audio();
let currentIndex = 0;
let songs = [];

function formatTime(seconds) {
  if (isNaN(seconds) || seconds <= 0 || seconds === Infinity) return "0:00";
  seconds = Math.floor(seconds);
  const minutes = Math.floor(seconds / 60);
  let secs = seconds % 60;
  if (secs < 10) secs = "0" + secs;
  return `${minutes}:${secs}`;
}

async function getsongs(folder) {
  // Keep using absolute 127.0.0.1 per original
  const a = await fetch(`http://127.0.0.1:3000/${folder}/`);
  const response = await a.text();
  const div = document.createElement('div');
  div.innerHTML = response;

  const as = div.getElementsByTagName('a');
  songs = [];

  for (let i = 0; i < as.length; i++) {
    const element = as[i];
    if (element.href.toLowerCase().endsWith('.mp3')) {
      // Keep absolute URL for Audio()
      songs.push(element.href);
    }
  }

  console.log("Fetched songs:", songs);
  return songs;
}

const songul = document.querySelector(".songlist ul");

function renderPlaylist(songsList, folder) {
  songul.innerHTML = ""; // clear

  songsList.forEach((song, index) => {
    const li = document.createElement("li");
    li.style.color = "white";

    li.innerHTML = `
      <img class="invert" src="music.svg" alt="music icon" />
      <div class="songinfo">
        <div>${cleanFileName(song)}</div>
      </div>
      <div class="playnow">
        <span>Play Now</span>
        <img class="invert" src="play.svg" alt="play icon" />
      </div>
    `;

    li.dataset.folder = folder;
    li.dataset.index = index;

    li.addEventListener("click", () => {
      currentIndex = index;
      playsong(song, false);
    });

    songul.appendChild(li);
  });
}
async function displayalbums(){
    const a = await fetch(`http://127.0.0.1:3000/songs/`);
  const response = await a.text();
  const div = document.createElement('div');
  div.innerHTML = response;
    let cardcon = document.querySelector(".cardcontainer");

  const as = div.getElementsByTagName('a');
  let array =  Array.from(as);
 for(let i=0;i<array.length;i++){
  let e = array[i];
    if(e.href.includes('songs')){
     let folder =  (e.href.split('%5C' ).slice(-1)[0].split('/')[0]);
       const a = await fetch(`http://127.0.0.1:3000/songs/${folder}/info.json`);
       const response = await a.json();

       cardcon.innerHTML+=`                    <div  data-folder="${folder}" class="card">
                        <div class="play">
                            <svg xmlns="http://www.w3.org/2000/svg" class="green-btn" viewBox="0 0 24 24" width="24" height="24"
                                fill="black">
                                <path
                                    d="M18.8906 12.846C18.5371 14.189 16.8667 15.138 13.5257 17.0361C10.296 18.8709 8.6812 19.7884 7.37983 19.4196C6.8418 19.2671 6.35159 18.9776 5.95624 18.5787C5 17.6139 5 15.7426 5 12C5 8.2574 5 6.3861 5.95624 5.42132C6.35159 5.02245 6.8418 4.73288 7.37983 4.58042C8.6812 4.21165 10.296 5.12907 13.5257 6.96393C16.8667 8.86197 18.5371 9.811 18.8906 11.154C19.0365 11.7084 19.0365 12.2916 18.8906 12.846Z" />
                            </svg>
                        </div>

                        <img src="/songs/${folder}/img1.jpeg" alt="" />
                        <h3>${response.Title}</h3>
                        <p>${response.Description}</p>
                    </div>`
      
       
      
    }
    
  }

    // Card clicks: fetch, render once, play first paused
  Array.from(document.getElementsByClassName("card")).forEach((card) => {
    card.addEventListener("click", async () => {
      const folder = card.dataset.folder; // e.g., "cs"
      console.log("Clicked folder:", folder);

      const list = await getsongs(`songs/${folder}`);
      console.log("Fetched songs:", list);

      if (list.length > 0) {
        songs = list;
        renderPlaylist(songs, `songs/${folder}`);
        currentIndex = 0;
        playsong(songs[0], true);
      } else {
        songul.innerHTML = "";
        const playbarInfo = document.querySelector('.playbar .info');
        if (playbarInfo) playbarInfo.textContent = "";
        const songtime = document.querySelector('.songtime');
        if (songtime) songtime.textContent = "0:00 / 0:00";
      }
    });
  });

}

function cleanFileName(path) {
  const decoded = decodeURIComponent(path);
  const parts = decoded.split(/[/\\]/);
  return parts[parts.length - 1].replace(/\.mp3$/i, "");
}

function playsong(track, paused = false) {
  currentsong.src = track; // full URL
  if (!paused) {
    currentsong.play();
    document.getElementById('play').src = "pause.svg";
  } else {
    currentsong.pause();
    document.getElementById('play').src = "play.svg";
  }

  // Scope to playbar to avoid matching list ".info"
  const playbarInfo = document.querySelector('.playbar .info');
  if (playbarInfo) playbarInfo.textContent = cleanFileName(track);

  const songtimeEl = document.querySelector('.songtime');
  if (songtimeEl) songtimeEl.textContent = "0:00 / 0:00";
}

async function main() {
  // Initial folder
  songs = await getsongs('songs/cs');
  if (songs.length === 0) return;
  displayalbums();

  // Render via renderPlaylist only (avoid duplicate render path)
  renderPlaylist(songs, 'songs/cs');

  // Preload first paused
  playsong(songs[0], true);

  // Play/pause button
  document.getElementById('play').addEventListener('click', () => {
    if (currentsong.paused) {
      currentsong.play();
      document.getElementById('play').src = "pause.svg";
    } else {
      currentsong.pause();
      document.getElementById('play').src = "play.svg";
    }
  });

  // Progress update (guard NaN/Infinity)
  currentsong.addEventListener('timeupdate', () => {
    const cur = currentsong.currentTime;
    const dur = currentsong.duration;
    const songtime = document.querySelector('.songtime');
    if (songtime) songtime.textContent = `${formatTime(cur)} / ${formatTime(dur)}`;

    if (isFinite(dur) && dur > 0) {
      document.querySelector('.circle').style.left = (cur / dur) * 100 + '%';
    }
  });

  // Seekbar click (guard)
  document.querySelector('.seekbar').addEventListener('click', (e) => {
    const rect = e.target.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const dur = currentsong.duration;
    if (isFinite(dur) && dur > 0) {
      const newTime = Math.max(0, Math.min(dur, ratio * dur));
      currentsong.currentTime = newTime;
      document.querySelector('.circle').style.left = (ratio * 100) + '%';
    }
  });

  // Next/Prev
  document.getElementById('next').addEventListener('click', () => {
    if (!songs.length) return;
    currentIndex = (currentIndex + 1) % songs.length;
    playsong(songs[currentIndex], false);
  });

  document.getElementById('prev').addEventListener('click', () => {
    if (!songs.length) return;
    currentIndex = (currentIndex - 1 + songs.length) % songs.length;
    playsong(songs[currentIndex], false);
  });

  // Volume/mute
  document.getElementById('volume').addEventListener('input', (e) => {
    currentsong.volume = e.target.value / 100;
  });

  document.querySelector('.mute').addEventListener('click', () => {
    currentsong.muted = !currentsong.muted;
    document.querySelector('.mute').src = currentsong.muted ? "mute.svg" : "volume.svg";
  });


}

main();

// Sidebar (unchanged)
document.querySelector('.hamburger')?.addEventListener('click', () => {
  document.querySelector(".left").style.left = 0;
});
document.querySelector(".spotify-playlist")?.addEventListener('click', () => {
  document.querySelector(".left").style.left = '-150%';
});
document.querySelector(".closeleft")?.addEventListener('click', () => {
  document.querySelector(".left").style.left = '-150%';
});
