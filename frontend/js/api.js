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
    }
};
