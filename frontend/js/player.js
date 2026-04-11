const Player = (() => {
    const audio = new Audio();
    let queue = [];
    let originalQueue = [];
    let isShuffled = false;
    let repeatMode = 0; // 0: none, 1: all, 2: one
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
            originalQueue = [...songQueue];
            queue = [...songQueue];
            currentIndex = indexInQueue !== undefined ? indexInQueue : 0;
            if (isShuffled) {
                applyShuffle();
            }
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

    function applyShuffle() {
        if (queue.length === 0) return;
        const currentSong = queue[currentIndex];
        const remaining = originalQueue.filter(s => s.id !== currentSong.id);
        for (let i = remaining.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
        }
        queue = [currentSong, ...remaining];
        currentIndex = 0;
        if (_onQueueChange) _onQueueChange();
    }

    function toggleShuffle() {
        isShuffled = !isShuffled;
        if (isShuffled) {
            applyShuffle();
        } else {
            const currentSong = queue[currentIndex];
            queue = [...originalQueue];
            currentIndex = queue.findIndex(s => s.id === currentSong.id);
            if (currentIndex === -1) currentIndex = 0;
            if (_onQueueChange) _onQueueChange();
        }
        return isShuffled;
    }

    function toggleRepeat() {
        repeatMode = (repeatMode + 1) % 3; // 0: none, 1: all, 2: one
        return repeatMode;
    }

    function togglePlay() {
        if (audio.paused) audio.play().catch(console.error);
        else audio.pause();
    }

    function next() {
        if (currentIndex < queue.length - 1) {
            currentIndex++;
            play(queue[currentIndex]);
        } else if (repeatMode === 1 && queue.length > 0) {
            currentIndex = 0;
            play(queue[currentIndex]);
        }
    }

    function prev() {
        if (audio.currentTime > 3) {
            audio.currentTime = 0;
        } else if (currentIndex > 0) {
            currentIndex--;
            play(queue[currentIndex]);
        } else if (repeatMode === 1 && queue.length > 0) {
            currentIndex = queue.length - 1;
            play(queue[currentIndex]);
        } else {
            audio.currentTime = 0;
        }
    }

    audio.addEventListener('ended', () => {
        if (repeatMode === 2) {
            audio.currentTime = 0;
            audio.play();
        } else {
            next();
        }
    });

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
        toggleShuffle,
        toggleRepeat,
        next,
        prev,
        seek,
        setVolume,
        toggleMute,
        isPlaying: () => !audio.paused,
        isShuffled: () => isShuffled,
        getRepeatMode: () => repeatMode,
        getVolume: () => audio.volume,
        isMuted: () => audio.muted,
        getCurrentSong: () => queue[currentIndex] || null,
        getCurrentIndex: () => currentIndex,
        getQueue: () => queue,
        onStateChange: fn => { _onStateChange = fn; },
        onProgress: fn => { _onProgress = fn; },
        onSongChange: fn => { _onSongChange = fn; },
        onQueueChange: fn => { _onQueueChange = fn; }
    };
})();
