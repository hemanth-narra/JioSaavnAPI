// ─── Config ───────────────────────────────────────────────────────────────────
const CURATED = [
    { emoji: '🔥', title: 'Trending Bollywood', query: 'top bollywood hits 2024' },
    { emoji: '💕', title: 'Romantic Hits',      query: 'arijit singh romantic' },
    { emoji: '🎉', title: 'Party Anthems',       query: 'bollywood party dance songs' },
    { emoji: '🌙', title: '90s Nostalgia',       query: 'bollywood 90s classic hits' },
    { emoji: '⭐', title: 'Best of A.R. Rahman', query: 'AR Rahman best songs' },
];

// ─── State ────────────────────────────────────────────────────────────────────
let state = {
    currentSong: null,
    currentView: 'home',
};

// ─── DOM Refs ─────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const dom = {
    homeView:       $('homeView'),
    searchView:     $('searchView'),
    searchInput:    $('searchInput'),
    searchBtn:      $('searchBtn'),
    sections:       $('sectionsContainer'),
    searchResults:  $('searchResults'),
    resultsTitle:   $('resultsTitle'),
    navHome:        $('navHome'),
    navSearch:      $('navSearch'),
    // player
    playerBar:      $('playerBar'),
    playerImg:      $('playerImg'),
    playerTitle:    $('playerTitle'),
    playerArtist:   $('playerArtist'),
    playPauseBtn:   $('playPauseBtn'),
    prevBtn:        $('prevBtn'),
    nextBtn:        $('nextBtn'),
    progressBar:    $('progressBar'),
    progressFill:   $('progressFill'),
    progressThumb:  $('progressThumb'),
    timeCurrent:    $('timeCurrent'),
    timeTotal:      $('timeTotal'),
    volumeSlider:   $('volumeSlider'),
    volumeFill:     $('volumeFill'),
    muteBtn:        $('muteBtn'),
    eqBars:         $('eqBars'),
    lyricsBtn:      $('lyricsBtn'),
    lyricsOverlay:  $('lyricsOverlay'),
    closeLyricsBtn: $('closeLyricsBtn'),
    lyricsContent:  $('lyricsContent'),
    lyricsArt:      $('lyricsArt'),
    lyricsSongName: $('lyricsSongName'),
    lyricsArtName:  $('lyricsArtName'),
    queueList:      $('queueList'),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function esc(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function trunc(str, n = 28) {
    if (!str) return '';
    return str.length > n ? str.slice(0, n) + '…' : str;
}
function fmtDur(s) {
    if (!s) return '';
    const secs = parseInt(s);
    return `${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}`;
}

// ─── Views ────────────────────────────────────────────────────────────────────
function showHome() {
    state.currentView = 'home';
    dom.homeView.classList.remove('hidden');
    dom.searchView.classList.add('hidden');
    dom.navHome.classList.add('active');
    dom.navSearch.classList.remove('active');
    dom.searchInput.value = '';
}

function showSearch(title) {
    state.currentView = 'search';
    dom.homeView.classList.add('hidden');
    dom.searchView.classList.remove('hidden');
    dom.resultsTitle.textContent = title;
    dom.navHome.classList.remove('active');
    dom.navSearch.classList.add('active');
}

// ─── Song Cards ───────────────────────────────────────────────────────────────
const FALLBACK_IMG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%231a1a2e' width='200' height='200'/%3E%3Ccircle cx='100' cy='85' r='30' fill='%238b5cf6' opacity='.4'/%3E%3Cellipse cx='100' cy='150' rx='50' ry='20' fill='%238b5cf6' opacity='.2'/%3E%3C/svg%3E`;

function makeSongCard(song, idx, queue) {
    const isCurrent = state.currentSong && state.currentSong.id === song.id;
    const card = document.createElement('div');
    card.className = 'song-card' + (isCurrent ? ' is-playing' : '');
    card.dataset.id = song.id;

    card.innerHTML = `
      <div class="card-img-wrap">
        <img class="card-img" src="${esc(song.image)}" alt="${esc(song.song)}" loading="lazy" onerror="this.src='${FALLBACK_IMG}'">
        <div class="card-overlay">
          <button class="card-play-btn" aria-label="Play ${esc(song.song)}">
            ${isCurrent && Player.isPlaying() ? icons.pause : icons.play}
          </button>
        </div>
        ${isCurrent ? `<div class="eq-badge">${'<span></span>'.repeat(3)}</div>` : ''}
      </div>
      <div class="card-body">
        <p class="card-title" title="${esc(song.song)}">${esc(trunc(song.song, 22))}</p>
        <p class="card-artist" title="${esc(song.primary_artists||song.singers)}">${esc(trunc(song.primary_artists||song.singers, 24))}</p>
        ${song.duration ? `<p class="card-dur">${fmtDur(song.duration)}</p>`: ''}
      </div>`;

    card.addEventListener('click', () => {
        if (isCurrent && Player.isPlaying()) {
            Player.togglePlay();
        } else {
            Player.play(song, queue, idx);
        }
        refreshCards();
    });
    return card;
}

function refreshCards() {
    const cur = Player.getCurrentSong();
    document.querySelectorAll('.song-card').forEach(card => {
        const active = cur && card.dataset.id === cur.id;
        card.classList.toggle('is-playing', active);
        const btn = card.querySelector('.card-play-btn');
        if (btn) btn.innerHTML = (active && Player.isPlaying()) ? icons.pause : icons.play;
        const eq = card.querySelector('.eq-badge');
        if (eq) eq.style.display = active ? 'flex' : 'none';
    });
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
function skeletons(n) {
    return Array.from({length: n}, () =>
        `<div class="song-card skeleton">
           <div class="card-img-wrap sk-box"></div>
           <div class="card-body">
             <div class="sk-line"></div>
             <div class="sk-line short"></div>
           </div>
         </div>`
    ).join('');
}

// ─── Home Sections ────────────────────────────────────────────────────────────
async function loadSections() {
    dom.sections.innerHTML = '';
    for (const sec of CURATED) {
        const wrap = document.createElement('div');
        wrap.className = 'section';
        wrap.innerHTML = `
          <div class="section-head">
            <h2 class="section-title">${sec.emoji} ${esc(sec.title)}</h2>
            <button class="see-all-btn" data-q="${esc(sec.query)}">See all →</button>
          </div>
          <div class="song-grid section-grid" id="sg-${esc(sec.query.replace(/\s+/g,'-'))}">
            ${skeletons(6)}
          </div>`;
        wrap.querySelector('.see-all-btn').addEventListener('click', e =>
            doSearch(e.currentTarget.dataset.q)
        );
        dom.sections.appendChild(wrap);
        fillSection(sec, wrap.querySelector('.section-grid'));
    }
}

async function fillSection(sec, grid) {
    try {
        const songs = await JioAPI.search(sec.query, true);
        grid.innerHTML = '';
        const valid = (Array.isArray(songs) ? songs : []).filter(s => s && (s.media_url || s.media_preview_url)).slice(0, 6);
        if (!valid.length) { grid.innerHTML = '<p class="no-res">No results</p>'; return; }
        valid.forEach((s, i) => grid.appendChild(makeSongCard(s, i, valid)));
    } catch {
        grid.innerHTML = '<p class="no-res">Failed to load</p>';
    }
}

// ─── Search ───────────────────────────────────────────────────────────────────
async function doSearch(query) {
    if (!query.trim()) return;
    showSearch(`Results for "${query}"`);
    dom.searchResults.innerHTML = skeletons(12);
    try {
        const songs = await JioAPI.search(query, true);
        dom.searchResults.innerHTML = '';
        const valid = (Array.isArray(songs) ? songs : []).filter(s => s && (s.media_url || s.media_preview_url));
        if (!valid.length) {
            dom.searchResults.innerHTML = `<div class="empty-state"><p>No results for "<strong>${esc(query)}</strong>"</p></div>`;
            return;
        }
        valid.forEach((s, i) => dom.searchResults.appendChild(makeSongCard(s, i, valid)));
    } catch {
        dom.searchResults.innerHTML = `<div class="empty-state"><p>Search failed. Is the API running?</p></div>`;
    }
}

// ─── Player UI ────────────────────────────────────────────────────────────────
function updatePlayerUI(song) {
    state.currentSong = song;
    dom.playerImg.src  = song.image || FALLBACK_IMG;
    dom.playerImg.style.display = 'block';
    dom.playerTitle.textContent  = song.song || 'Unknown';
    dom.playerArtist.textContent = song.primary_artists || song.singers || 'Unknown Artist';
    dom.lyricsArt.src      = song.image || FALLBACK_IMG;
    dom.lyricsSongName.textContent = song.song || '';
    dom.lyricsArtName.textContent  = song.primary_artists || song.singers || '';
    dom.lyricsBtn.style.display = song.has_lyrics === 'true' ? 'flex' : 'none';
    dom.playerBar.classList.add('active');
    document.title = `${song.song} — ${song.primary_artists || song.singers} | JioMelody`;
    updateQueue();
}

function updateQueue() {
    const queue = Player.getQueue();
    const cur   = Player.getCurrentSong();
    dom.queueList.innerHTML = '';
    queue.forEach((s, i) => {
        const item = document.createElement('div');
        item.className = 'q-item' + (cur && s.id === cur.id ? ' current' : '');
        item.innerHTML = `
          <img class="q-thumb" src="${esc(s.image)}" alt="" onerror="this.src='${FALLBACK_IMG}'">
          <div class="q-info">
            <p class="q-title">${esc(trunc(s.song, 18))}</p>
            <p class="q-artist">${esc(trunc(s.primary_artists||s.singers, 18))}</p>
          </div>`;
        item.addEventListener('click', () => Player.play(s, queue, i));
        dom.queueList.appendChild(item);
    });
}

// ─── Player Events ────────────────────────────────────────────────────────────
Player.onSongChange(song => {
    updatePlayerUI(song);
    refreshCards();
});

Player.onStateChange(({ isPlaying }) => {
    dom.playPauseBtn.innerHTML = isPlaying ? icons.pause : icons.play;
    dom.playPauseBtn.classList.toggle('playing', isPlaying);
    dom.eqBars.classList.toggle('active', isPlaying);
    refreshCards();
});

Player.onProgress(({ percent, currentStr, totalStr }) => {
    dom.progressFill.style.width  = percent + '%';
    dom.progressThumb.style.left  = percent + '%';
    dom.timeCurrent.textContent   = currentStr;
    dom.timeTotal.textContent     = totalStr;
});

// ─── Player Controls ──────────────────────────────────────────────────────────
dom.playPauseBtn.addEventListener('click', () => Player.togglePlay());
dom.prevBtn.addEventListener('click',      () => Player.prev());
dom.nextBtn.addEventListener('click',      () => Player.next());

let seeking = false;
dom.progressBar.addEventListener('mousedown', () => { seeking = true; });
document.addEventListener('mouseup', () => { seeking = false; });
dom.progressBar.addEventListener('click', e => {
    const r = dom.progressBar.getBoundingClientRect();
    Player.seek(((e.clientX - r.left) / r.width) * 100);
});

dom.volumeSlider.addEventListener('click', e => {
    const r = dom.volumeSlider.getBoundingClientRect();
    const vol = (e.clientX - r.left) / r.width;
    Player.setVolume(vol);
    dom.volumeFill.style.width = (vol * 100) + '%';
    dom.muteBtn.innerHTML = vol === 0 ? icons.muted : icons.volume;
});

dom.muteBtn.addEventListener('click', () => {
    const muted = Player.toggleMute();
    dom.muteBtn.innerHTML = muted ? icons.muted : icons.volume;
    dom.volumeFill.style.opacity = muted ? '0.3' : '1';
});

// ─── Lyrics ───────────────────────────────────────────────────────────────────
dom.lyricsBtn.addEventListener('click', async () => {
    dom.lyricsOverlay.classList.add('visible');
    dom.lyricsContent.innerHTML = `<div class="lyrics-loading"><div class="spinner"></div><p>Fetching lyrics…</p></div>`;
    const song = state.currentSong;
    if (!song) return;
    try {
        const res = await JioAPI.getLyrics(song.id);
        if (res.status && res.lyrics) {
            const text = res.lyrics.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
            dom.lyricsContent.innerHTML = `<div class="lyrics-text">${
                text.split('\n').map(l => `<p>${esc(l)||'&nbsp;'}</p>`).join('')
            }</div>`;
        } else {
            dom.lyricsContent.innerHTML = `<p class="no-lyrics">🎵 No lyrics available for this song.</p>`;
        }
    } catch {
        dom.lyricsContent.innerHTML = `<p class="no-lyrics">Failed to load lyrics.</p>`;
    }
});

dom.closeLyricsBtn.addEventListener('click', () => dom.lyricsOverlay.classList.remove('visible'));
dom.lyricsOverlay.addEventListener('click', e => {
    if (e.target === dom.lyricsOverlay) dom.lyricsOverlay.classList.remove('visible');
});

// ─── Search Events ────────────────────────────────────────────────────────────
dom.searchBtn.addEventListener('click',  () => doSearch(dom.searchInput.value));
dom.searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(dom.searchInput.value); });

// ─── Keyboard Shortcuts ───────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space')       { e.preventDefault(); Player.togglePlay(); }
    if (e.code === 'ArrowRight')  Player.next();
    if (e.code === 'ArrowLeft')   Player.prev();
    if (e.code === 'Escape')      dom.lyricsOverlay.classList.remove('visible');
});

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const icons = {
    play:   `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
    pause:  `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`,
    next:   `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>`,
    prev:   `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>`,
    volume: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>`,
    muted:  `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`,
    home:   `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
    search: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`,
    music:  `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`,
};

// Inject icons into buttons
dom.playPauseBtn.innerHTML = icons.play;
dom.prevBtn.innerHTML      = icons.prev;
dom.nextBtn.innerHTML      = icons.next;
dom.muteBtn.innerHTML      = icons.volume;
dom.lyricsBtn.innerHTML    = `${icons.music}<span>Lyrics</span>`;
dom.navHome.querySelector('.nav-icon').innerHTML   = icons.home;
dom.navSearch.querySelector('.nav-icon').innerHTML = icons.search;

// ─── Init ─────────────────────────────────────────────────────────────────────
showHome();
loadSections();
