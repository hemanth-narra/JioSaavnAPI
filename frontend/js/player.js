const Player = (() => {
    const audio = new Audio();
    let queue = [];
    let currentIndex = -1;

    let _onStateChange = null;
    let _onProgress = null;
    let _onSongChange = null;

    function fmt(sec) {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    audio.addEventListener('timeupdate', () => {
        if (_onProgress && audio.duration) {
            _onProgress({
                current: audio.currentTime,
                total: audio.duration,
                percent: (audio.currentTime / audio.duration) * 100,
                currentStr: fmt(audio.currentTime),
                totalStr: fmt(audio.duration)
            });
        }
    });

    audio.addEventListener('ended', () => next());

    audio.addEventListener('play', () => {
        if (_onStateChange) _onStateChange({ isPlaying: true });
    });

    audio.addEventListener('pause', () => {
        if (_onStateChange) _onStateChange({ isPlaying: false });
    });

    audio.addEventListener('error', () => {
        console.warn('Audio error — skipping to next');
        setTimeout(next, 1500);
    });

    function play(song, songQueue, indexInQueue) {
        if (songQueue !== undefined) {
            queue = songQueue;
            currentIndex = indexInQueue !== undefined ? indexInQueue : 0;
        }
        if (!song) song = queue[currentIndex];
        if (!song) return;

        const src = song.media_url || song.media_preview_url;
        if (!src) { console.warn('No playable URL', song); return; }

        audio.pause();
        audio.src = src;
        audio.load();
        audio.play().catch(e => console.error('Play error:', e));

        if (_onSongChange) _onSongChange(song);
    }

    function togglePlay() {
        if (audio.paused) audio.play().catch(console.error);
        else audio.pause();
    }

    function next() {
        if (currentIndex < queue.length - 1) {
            currentIndex++;
            play(queue[currentIndex]);
        }
    }

    function prev() {
        if (audio.currentTime > 3) {
            audio.currentTime = 0;
        } else if (currentIndex > 0) {
            currentIndex--;
            play(queue[currentIndex]);
        }
    }

    function seek(percent) {
        if (audio.duration) audio.currentTime = (percent / 100) * audio.duration;
    }

    function setVolume(vol) {
        audio.volume = Math.max(0, Math.min(1, vol));
    }

    function toggleMute() {
        audio.muted = !audio.muted;
        return audio.muted;
    }

    return {
        play,
        togglePlay,
        next,
        prev,
        seek,
        setVolume,
        toggleMute,
        isPlaying: () => !audio.paused,
        getVolume: () => audio.volume,
        isMuted: () => audio.muted,
        getCurrentSong: () => queue[currentIndex] || null,
        getCurrentIndex: () => currentIndex,
        getQueue: () => queue,
        onStateChange: fn => { _onStateChange = fn; },
        onProgress: fn => { _onProgress = fn; },
        onSongChange: fn => { _onSongChange = fn; }
    };
})();
