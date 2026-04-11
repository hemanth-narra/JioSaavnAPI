// Auto-detect backend URL so it works both locally and in Docker
const API_BASE = window.location.origin;

const JioAPI = {
    async search(query, songdata = true) {
        try {
            const res = await fetch(
                `${API_BASE}/song/?query=${encodeURIComponent(query)}&songdata=${songdata}`
            );
            if (!res.ok) throw new Error('Network error');
            return await res.json();
        } catch (e) {
            console.error('Search failed:', e);
            return [];
        }
    },

    async getSong(id) {
        try {
            const res = await fetch(`${API_BASE}/song/get/?id=${encodeURIComponent(id)}`);
            if (!res.ok) throw new Error('Network error');
            return await res.json();
        } catch (e) {
            console.error('Get song failed:', e);
            return null;
        }
    },

    async getLyrics(id) {
        try {
            const res = await fetch(`${API_BASE}/lyrics/?query=${encodeURIComponent(id)}`);
            if (!res.ok) throw new Error('Network error');
            return await res.json();
        } catch (e) {
            console.error('Get lyrics failed:', e);
            return { status: false, lyrics: null };
        }
    },

    async getPlaylist(url) {
        try {
            const res = await fetch(`${API_BASE}/playlist/?query=${encodeURIComponent(url)}`);
            if (!res.ok) throw new Error('Network error');
            return await res.json();
        } catch (e) {
            console.error('Get playlist failed:', e);
            return null;
        }
    },

    // ─── Library Management ──────────────────────────────────────────────────
    async getFavorites() {
        const res = await fetch(`${API_BASE}/api/favorites`);
        return await res.json();
    },

    async toggleFavorite(song) {
        const res = await fetch(`${API_BASE}/api/favorites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(song)
        });
        return await res.json();
    },

    async getPlaylists() {
        const res = await fetch(`${API_BASE}/api/playlists`);
        return await res.json();
    },

    async createPlaylist(name) {
        const res = await fetch(`${API_BASE}/api/playlists`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        return await res.json();
    },

    async getPlaylistDetail(id) {
        const res = await fetch(`${API_BASE}/api/playlists/${id}`);
        return await res.json();
    },

    async deletePlaylist(id) {
        const res = await fetch(`${API_BASE}/api/playlists/${id}`, { method: 'DELETE' });
        return await res.json();
    },

    async addToPlaylist(playlistId, song) {
        const res = await fetch(`${API_BASE}/api/playlists/${playlistId}/songs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(song)
        });
        return await res.json();
    },

    async removeFromPlaylist(playlistId, songId) {
        const res = await fetch(`${API_BASE}/api/playlists/${playlistId}/songs/${songId}`, {
            method: 'DELETE'
        });
        return await res.json();
    }
};
