// ─── Config ───────────────────────────────────────────────────────────────────
const CURATED = [
    { emoji: '🔥', title: 'Trending Tollywood', query: 'latest telugu hits' },
    { emoji: '💕', title: 'Telugu Melodies',    query: 'telugu love failure melodies' },
    { emoji: '🎉', title: 'Mass Anthems',       query: 'telugu mass dance dj' },
    { emoji: '⭐', title: 'Best of DSP & Thaman', query: 'devi sri prasad thaman telugu hits' },
    { emoji: '🎬', title: 'Trending Bollywood', query: 'top bollywood hits' },
];

const FALLBACK_IMG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%231a1a2e' width='200' height='200'/%3E%3Ccircle cx='100' cy='85' r='30' fill='%238b5cf6' opacity='.4'/%3E%3Cellipse cx='100' cy='150' rx='50' ry='20' fill='%238b5cf6' opacity='.2'/%3E%3C/svg%3E`;

// ─── State ────────────────────────────────────────────────────────────────────
let state = {
    currentSong: null,
    currentView: 'home', // 'home', 'search', 'library'
    favorites: [],      // Array of song objects
    playlists: [],      // Array of playlist objects
    currentLib: null,   // { type: 'favorites' } or { type: 'playlist', data: {...} }
    tempAddSong: null,  // Song to be added to playlist
};

// ─── DOM Refs ─────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const dom = {
    app:            $('app'),
    homeView:       $('homeView'),
    searchView:     $('searchView'),
    libraryView:    $('libraryView'),
    searchInput:    $('searchInput'),
    searchBtn:      $('searchBtn'),
    sections:       $('sectionsContainer'),
    searchResults:  $('searchResults'),
    resultsTitle:   $('resultsTitle'),
    navHome:        $('navHome'),
    navSearch:      $('navSearch'),
    navLiked:       $('navLiked'),
    addPlaylistBtn: $('addPlaylistBtn'),
    sidebarPlaylists: $('sidebarPlaylists'),
    // library view
    libArtWrap:     $('libArtWrap'),
    libType:        $('libType'),
    libTitle:       $('libTitle'),
    libStats:       $('libStats'),
    libPlayBtn:     $('libPlayBtn'),
    libSongList:    $('libSongList'),
    deletePlBtn:    $('deletePlBtn'),
    // player
    playerBar:      $('playerBar'),
    playerImg:      $('playerImg'),
    playerTitle:    $('playerTitle'),
    playerArtist:   $('playerArtist'),
    playPauseBtn:   $('playPauseBtn'),
    prevBtn:        $('prevBtn'),
    nextBtn:        $('nextBtn'),
    shuffleBtn:     $('shuffleBtn'),
    repeatBtn:      $('repeatBtn'),
    progressBar:    $('progressBar'),
    progressFill:   $('progressFill'),
    progressThumb:  $('progressThumb'),
    timeCurrent:    $('timeCurrent'),
    timeTotal:      $('timeTotal'),

    // Mobile specific
    bNavHome:       $('bNavHome'),
    bNavSearch:     $('bNavSearch'),
    bNavLibrary:    $('bNavLibrary'),
    mpLikeBtn:      $('mpLikeBtn'),
    mpAddBtn:       $('mpAddBtn'),
    mpPlayPauseBtn: $('mpPlayPauseBtn'),
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
    // modals
    createPlModal:  $('createPlaylistModal'),
    newPlName:      $('newPlaylistName'),
    savePlBtn:      $('savePlaylistBtn'),
    cancelCreatePl: $('cancelCreatePlaylist'),
    addToPlModal:   $('addToPlaylistModal'),
    plPickerList:   $('plPickerList'),
    cancelAddToPl:  $('cancelAddToPlaylist'),
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
    if (!s) return '0:00';
    const secs = parseInt(s);
    return `${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}`;
}

// ─── Views ────────────────────────────────────────────────────────────────────
function hideAllViews() {
    [dom.homeView, dom.searchView, dom.libraryView].forEach(v => v.classList.add('hidden'));
    [dom.navHome, dom.navSearch, dom.navLiked].forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.pl-item').forEach(p => p.classList.remove('active'));
}

function showHome() {
    state.currentView = 'home';
    hideAllViews();
    dom.homeView.classList.remove('hidden');
    dom.navHome.classList.add('active');
    dom.searchInput.value = '';
}

function showSearch(title) {
    state.currentView = 'search';
    hideAllViews();
    dom.searchView.classList.remove('hidden');
    dom.resultsTitle.textContent = title;
    dom.navSearch.classList.add('active');
}

async function showLibrary(type, plData = null) {
    state.currentView = 'library';
    state.currentLib = { type, data: plData };
    hideAllViews();
    dom.libraryView.classList.remove('hidden');
    
    if (type === 'favorites') {
        dom.navLiked.classList.add('active');
        dom.libType.textContent = 'Playlist';
        dom.libTitle.textContent = 'Liked Songs';
        dom.deletePlBtn.classList.add('hidden');
        renderLibrarySongs(state.favorites);
    } else {
        const pl = await JioAPI.getPlaylistDetail(plData.id);
        const activePl = document.querySelector(`.pl-item[data-id="${pl.id}"]`);
        if (activePl) activePl.classList.add('active');
        
        dom.libType.textContent = 'Playlist';
        dom.libTitle.textContent = pl.name;
        dom.deletePlBtn.classList.remove('hidden');
        renderLibrarySongs(pl.songs || []);
    }
}

function updateBottomNav(id) {
    [dom.bNavHome, dom.bNavSearch, dom.bNavLibrary].forEach(el => el.classList.remove('active'));
    if (dom[id]) dom[id].classList.add('active');
}

function renderLibrarySongs(songs) {
    dom.libStats.textContent = `${songs.length} songs`;
    dom.libSongList.innerHTML = '';
    
    // Collage logic
    dom.libArtWrap.innerHTML = '';
    dom.libArtWrap.className = 'lib-art-wrap';
    if (songs.length === 0) {
        dom.libArtWrap.innerHTML = `<img src="${FALLBACK_IMG}">`;
        dom.libArtWrap.classList.add('single');
    } else if (songs.length < 4) {
        dom.libArtWrap.innerHTML = `<img src="${esc(songs[0].image)}">`;
        dom.libArtWrap.classList.add('single');
    } else {
        // Collage of first 4 songs
        songs.slice(0, 4).forEach(s => {
            const img = document.createElement('img');
            img.src = s.image;
            dom.libArtWrap.appendChild(img);
        });
    }

    if (songs.length === 0) {
        dom.libSongList.innerHTML = `<p class="no-res" style="padding: 20px;">No songs here yet.</p>`;
        return;
    }

    songs.forEach((s, i) => {
        const isCurrent = state.currentSong && state.currentSong.id === s.id;
        const row = document.createElement('div');
        row.className = 'row-item' + (isCurrent ? ' current' : '');
        row.innerHTML = `
            <div class="row-num">${i + 1}</div>
            <div class="row-main">
                <img class="row-img" src="${esc(s.image)}" alt="" onerror="this.src='${FALLBACK_IMG}'">
                <div class="row-meta">
                    <p class="row-title">${esc(s.song)}</p>
                    <p class="row-artist">${esc(s.primary_artists || s.singers)}</p>
                </div>
            </div>
            <div class="row-album">${esc(s.album || '')}</div>
            <div class="row-dur">${fmtDur(s.duration)}</div>
            <div class="row-btns">
                <button class="row-fav-btn btn-circle ${isFav(s.id)?'active':''}" data-id="${s.id}">${icons.heart}</button>
                ${state.currentLib.type === 'playlist' ? `<button class="row-rem-btn btn-circle" title="Remove from Playlist" data-id="${s.id}"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13H5v-2h14v2z"/></svg></button>` : ''}
            </div>
        `;
        row.addEventListener('click', (e) => {
            if (e.target.closest('.row-fav-btn') || e.target.closest('.row-rem-btn')) return;
            Player.play(s, songs, i);
        });
        row.querySelector('.row-fav-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFav(s);
        });
        const remBtn = row.querySelector('.row-rem-btn');
        if (remBtn) {
            remBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm('Remove this song from the playlist?')) {
                    await JioAPI.removeFromPlaylist(state.currentLib.data.id, s.id);
                    const pl = await JioAPI.getPlaylistDetail(state.currentLib.data.id);
                    renderLibrarySongs(pl.songs || []);
                    syncLibrary();
                }
            });
        }
        dom.libSongList.appendChild(row);
    });

    dom.libPlayBtn.onclick = () => Player.play(songs[0], songs, 0);
}

// ─── Song Cards ───────────────────────────────────────────────────────────────
function makeSongCard(song, idx, queue) {
    const isCurrent = state.currentSong && state.currentSong.id === song.id;
    const favorite = isFav(song.id);
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
        <div class="card-btns">
            <button class="btn-circle fav-btn ${favorite?'active':''}" title="Like">${icons.heart}</button>
            <button class="btn-circle add-btn" title="Add to Playlist">${icons.plus}</button>
        </div>
        ${isCurrent ? `<div class="eq-badge">${'<span></span>'.repeat(3)}</div>` : ''}
      </div>
      <div class="card-body">
        <p class="card-title" title="${esc(song.song)}">${esc(trunc(song.song, 22))}</p>
        <p class="card-artist" title="${esc(song.primary_artists||song.singers)}">${esc(trunc(song.primary_artists||song.singers, 24))}</p>
      </div>`;

    card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-circle')) return;
        if (isCurrent && Player.isPlaying()) {
            Player.togglePlay();
        } else {
            Player.play(song, queue, idx);
        }
        refreshCards();
    });

    card.querySelector('.fav-btn').addEventListener('click', () => toggleFav(song));
    card.querySelector('.add-btn').addEventListener('click', () => openAddToPlaylist(song));

    return card;
}

function refreshCards() {
    const cur = Player.getCurrentSong();
    document.querySelectorAll('.song-card').forEach(card => {
        const id = card.dataset.id;
        const active = cur && id === cur.id;
        card.classList.toggle('is-playing', active);
        
        const btn = card.querySelector('.card-play-btn');
        if (btn) btn.innerHTML = (active && Player.isPlaying()) ? icons.pause : icons.play;
        
        const eq = card.querySelector('.eq-badge');
        if (eq) eq.style.display = active ? 'flex' : 'none';

        const favBtn = card.querySelector('.fav-btn');
        if (favBtn) favBtn.classList.toggle('active', isFav(id));
    });

    // Also refresh library if visible
    if (state.currentView === 'library' && state.currentLib.type === 'favorites') {
        renderLibrarySongs(state.favorites);
    }
}

// ─── Library Logic ────────────────────────────────────────────────────────────
function isFav(id) {
    return state.favorites.some(f => f.id === id);
}

async function toggleFav(song) {
    const res = await JioAPI.toggleFavorite(song);
    if (res.status) {
        await syncLibrary();
        refreshCards();
        if (state.currentView === 'library' && state.currentLib.type === 'favorites') {
            renderLibrarySongs(state.favorites);
        }
    }
}

async function syncLibrary() {
    state.favorites = await JioAPI.getFavorites();
    state.playlists = await JioAPI.getPlaylists();
    renderSidebarPlaylists();
}

function renderSidebarPlaylists() {
    dom.sidebarPlaylists.innerHTML = '';
    state.playlists.forEach(pl => {
        const item = document.createElement('div');
        item.className = 'pl-item' + (state.currentLib?.data?.id === pl.id ? ' active' : '');
        item.dataset.id = pl.id;
        item.innerHTML = `<span>${esc(pl.name)}</span>`;
        item.onclick = () => showLibrary('playlist', pl);
        dom.sidebarPlaylists.appendChild(item);
    });
}

function openAddToPlaylist(song) {
    state.tempAddSong = song;
    dom.plPickerList.innerHTML = '';
    state.playlists.forEach(pl => {
        const div = document.createElement('div');
        div.className = 'pl-pick-item';
        div.innerHTML = `<span>${esc(pl.name)}</span>`;
        div.onclick = async () => {
            const res = await JioAPI.addToPlaylist(pl.id, song);
            if (res.status) {
                closeModal(dom.addToPlModal);
                syncLibrary();
            }
        };
        dom.plPickerList.appendChild(div);
    });
    openModal(dom.addToPlModal);
}

// ─── Modals ───────────────────────────────────────────────────────────────────
function openModal(m) { m.classList.add('visible'); }
function closeModal(m) { m.classList.remove('visible'); }

dom.addPlaylistBtn.onclick = () => openModal(dom.createPlModal);
dom.cancelCreatePl.onclick = () => closeModal(dom.createPlModal);
dom.savePlBtn.onclick = async () => {
    const name = dom.newPlName.value.trim();
    if (!name) return;
    const res = await JioAPI.createPlaylist(name);
    if (res.id) {
        dom.newPlName.value = '';
        closeModal(dom.createPlModal);
        await syncLibrary();
        showLibrary('playlist', res);
    }
};

dom.cancelAddToPl.onclick = () => closeModal(dom.addToPlModal);
dom.deletePlBtn.onclick = async () => {
    if (state.currentLib.type !== 'playlist') return;
    if (confirm(`Delete playlist "${state.currentLib.data.name}"?`)) {
        await JioAPI.deletePlaylist(state.currentLib.data.id);
        await syncLibrary();
        showHome();
    }
};

// ─── Search Loader ────────────────────────────────────────────────────────────
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
          <div class="song-grid section-grid">${skeletons(6)}</div>`;
        wrap.querySelector('.see-all-btn').onclick = () => doSearch(sec.query);
        dom.sections.appendChild(wrap);
        fillSection(sec, wrap.querySelector('.song-grid'));
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
        dom.searchResults.innerHTML = `<div class="empty-state"><p>Search failed. API running?</p></div>`;
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
    dom.lyricsBtn.style.display = (song.has_lyrics === 'true' || song.lyrics) ? 'flex' : 'flex'; // Always show for fallback
    dom.playerBar.classList.add('active');
    document.title = `${song.song} | JioMelody`;
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
        item.onclick = () => {
            // Note: If shuffled, we still play the item from the queue by index
            Player.play(s, undefined, i);
        };
        dom.queueList.appendChild(item);
    });
}

// ─── Player Events ────────────────────────────────────────────────────────────
Player.onSongChange(song => { updatePlayerUI(song); refreshCards(); });
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
Player.onQueueChange(() => {
    updateQueue();
});

dom.playPauseBtn.onclick = () => Player.togglePlay();
dom.prevBtn.onclick      = () => Player.prev();
dom.nextBtn.onclick      = () => Player.next();

dom.shuffleBtn.onclick = () => {
    const isShuffled = Player.toggleShuffle();
    dom.shuffleBtn.style.color = isShuffled ? 'var(--pink)' : 'var(--t2)';
};

dom.repeatBtn.onclick = () => {
    const repeatMode = Player.toggleRepeat();
    if (repeatMode === 0) {
        dom.repeatBtn.innerHTML = icons.repeat;
        dom.repeatBtn.style.color = 'var(--t2)';
    } else if (repeatMode === 1) {
        dom.repeatBtn.innerHTML = icons.repeat;
        dom.repeatBtn.style.color = 'var(--pink)';
    } else if (repeatMode === 2) {
        dom.repeatBtn.innerHTML = icons.repeat1;
        dom.repeatBtn.style.color = 'var(--pink)';
    }
};

dom.progressBar.onclick = e => {
    const r = dom.progressBar.getBoundingClientRect();
    Player.seek(((e.clientX - r.left) / r.width) * 100);
};

dom.volumeSlider.onclick = e => {
    const r = dom.volumeSlider.getBoundingClientRect();
    const vol = (e.clientX - r.left) / r.width;
    Player.setVolume(vol);
    dom.volumeFill.style.width = (vol * 100) + '%';
    dom.muteBtn.innerHTML = vol === 0 ? icons.muted : icons.volume;
};

dom.muteBtn.onclick = () => {
    const muted = Player.toggleMute();
    dom.muteBtn.innerHTML = muted ? icons.muted : icons.volume;
    dom.volumeFill.style.opacity = muted ? '0.3' : '1';
};

// ─── Lyrics Enhancement ───────────────────────────────────────────────────────
dom.lyricsBtn.onclick = async () => {
    dom.lyricsOverlay.classList.add('visible');
    dom.lyricsContent.innerHTML = `<div class="lyrics-loading"><div class="spinner"></div><p>Fetching lyrics…</p></div>`;
    const song = state.currentSong;
    if (!song) return;
    
    async function loadLyrics() {
        try {
            // Try 1: By ID
            let res = await JioAPI.getLyrics(song.id);
            if (res.status && res.lyrics) return res.lyrics;
            
            // Try 2: Build search query from title and artist as fallback
            const query = `${song.song} ${song.primary_artists || song.singers}`;
            res = await JioAPI.getLyrics(query);
            if (res.status && res.lyrics) return res.lyrics;
            
            return null;
        } catch { return null; }
    }

    const lyrics = await loadLyrics();
    if (lyrics) {
        const text = lyrics.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
        dom.lyricsContent.innerHTML = `<div class="lyrics-text">${
            text.split('\n').map(l => `<p>${esc(l)||'&nbsp;'}</p>`).join('')
        }</div>`;
    } else {
        dom.lyricsContent.innerHTML = `<p class="no-lyrics">🎵 No lyrics found for "${esc(song.song)}".</p>`;
    }
};

dom.closeLyricsBtn.onclick = () => closeModal(dom.lyricsOverlay);
dom.navHome.onclick = (e) => { e.preventDefault(); showHome(); };
dom.navSearch.onclick = (e) => { e.preventDefault(); dom.searchInput.focus(); showSearch('Search'); };
dom.navLiked.onclick = (e) => { e.preventDefault(); showLibrary('favorites'); };

// ─── Search Events ────────────────────────────────────────────────────────────
dom.searchBtn.onclick = () => doSearch(dom.searchInput.value);
dom.searchInput.onkeydown = e => { if (e.key === 'Enter') doSearch(dom.searchInput.value); };

// ─── Keyboard Shortcuts ───────────────────────────────────────────────────────
document.onkeydown = e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space')       { e.preventDefault(); Player.togglePlay(); }
    if (e.code === 'ArrowRight')  Player.next();
    if (e.code === 'ArrowLeft')   Player.prev();
    if (e.code === 'Escape')      { closeModal(dom.lyricsOverlay); closeModal(dom.createPlModal); closeModal(dom.addToPlModal); }
};

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
    heart:  `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
    plus:   `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`,
    shuffle:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>`,
    repeat: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>`,
    repeat1:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/></svg>`,
};

// Inject static icons
dom.navHome.querySelector('.nav-icon').innerHTML = icons.home;
dom.navSearch.querySelector('.nav-icon').innerHTML = icons.search;
dom.navLiked.querySelector('.nav-icon').innerHTML = icons.heart;
dom.bNavHome.querySelector('.nav-icon').innerHTML = icons.home;
dom.bNavSearch.querySelector('.nav-icon').innerHTML = icons.search;
dom.bNavLibrary.querySelector('.nav-icon').innerHTML = icons.heart;

dom.playPauseBtn.innerHTML = icons.play;
dom.mpPlayPauseBtn.innerHTML = icons.play;
dom.prevBtn.innerHTML = icons.prev;
dom.nextBtn.innerHTML = icons.next;
dom.shuffleBtn.innerHTML = icons.shuffle;
dom.repeatBtn.innerHTML  = icons.repeat;
dom.muteBtn.innerHTML = icons.volume;
dom.lyricsBtn.innerHTML = `${icons.music}<span>Lyrics</span>`;
dom.mpLikeBtn.innerHTML = icons.heart;
dom.mpAddBtn.innerHTML = icons.plus;

// Bind mobile bottom nav
dom.bNavHome.onclick = (e) => { e.preventDefault(); showHome(); };
dom.bNavSearch.onclick = (e) => { e.preventDefault(); dom.searchInput.focus(); showSearch('Search'); };
dom.bNavLibrary.onclick = (e) => { e.preventDefault(); showLibrary('favorites', state.favorites); };

// Bind mobile mini player actions
dom.mpLikeBtn.onclick = () => { if (state.currentSong) toggleFav(state.currentSong); };
dom.mpAddBtn.onclick = () => { if (state.currentSong) openAddToPlaylist(state.currentSong); };
dom.mpPlayPauseBtn.onclick = () => Player.togglePlay();

// ─── Init ─────────────────────────────────────────────────────────────────────
(async () => {
    showHome();
    loadSections();
    await syncLibrary();
})();
