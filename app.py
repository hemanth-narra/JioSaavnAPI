from flask import Flask, request, redirect, jsonify, json, send_from_directory
import time
import jiosaavn
import os
from traceback import print_exc
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET", 'thankyoutonystark#weloveyou3000')
CORS(app)

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///library.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# ─── Database Models ──────────────────────────────────────────────────────────
class Favorite(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    song_id = db.Column(db.String(50), unique=True, nullable=False)
    title = db.Column(db.String(255), nullable=False)
    artist = db.Column(db.String(255))
    image_url = db.Column(db.String(500))
    media_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.song_id, "song": self.title, "singers": self.artist,
            "primary_artists": self.artist, "image": self.image_url,
            "media_url": self.media_url, "type": "favorite"
        }

class Playlist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    songs = db.relationship('PlaylistSong', backref='playlist', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id, "name": self.name, "description": self.description,
            "created_at": self.created_at.isoformat(),
            "song_count": len(self.songs)
        }

class PlaylistSong(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    playlist_id = db.Column(db.Integer, db.ForeignKey('playlist.id'), nullable=False)
    song_id = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    artist = db.Column(db.String(255))
    image_url = db.Column(db.String(500))
    media_url = db.Column(db.String(500))
    order = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            "id": self.song_id, "song": self.title, "singers": self.artist,
            "primary_artists": self.artist, "image": self.image_url,
            "media_url": self.media_url, "playlist_id": self.playlist_id
        }

# Create tables
with app.app_context():
    db.create_all()


def parse_bool_arg(arg_value, default=False):
    if arg_value is None:
        return default
    return arg_value.lower() != 'false'


@app.route('/')
def home():
    return redirect('/ui')


@app.route('/ui')
@app.route('/ui/')
def serve_ui():
    return send_from_directory('frontend', 'index.html')


@app.route('/ui/<path:path>')
def serve_ui_static(path):
    return send_from_directory('frontend', path)


@app.route('/song/')
def search():
    query = request.args.get('query')
    lyrics = parse_bool_arg(request.args.get('lyrics'), False)
    songdata = parse_bool_arg(request.args.get('songdata'), True)
    if query:
        return jsonify(jiosaavn.search_for_song(query, lyrics, songdata))
    else:
        error = {
            "status": False,
            "error": 'Query is required to search songs!'
        }
        return jsonify(error)


@app.route('/song/get/')
def get_song():
    id = request.args.get('id')
    lyrics = parse_bool_arg(request.args.get('lyrics'), False)
    if id:
        resp = jiosaavn.get_song(id, lyrics)
        if not resp:
            error = {
                "status": False,
                "error": 'Invalid Song ID received!'
            }
            return jsonify(error)
        else:
            return jsonify(resp)
    else:
        error = {
            "status": False,
            "error": 'Song ID is required to get a song!'
        }
        return jsonify(error)


@app.route('/playlist/')
def playlist():
    query = request.args.get('query')
    lyrics = parse_bool_arg(request.args.get('lyrics'), False)
    if query:
        id = jiosaavn.get_playlist_id(query)
        songs = jiosaavn.get_playlist(id, lyrics)
        return jsonify(songs)
    else:
        error = {
            "status": False,
            "error": 'Query is required to search playlists!'
        }
        return jsonify(error)


@app.route('/album/')
def album():
    query = request.args.get('query')
    lyrics = parse_bool_arg(request.args.get('lyrics'), False)
    if query:
        id = jiosaavn.get_album_id(query)
        songs = jiosaavn.get_album(id, lyrics)
        return jsonify(songs)
    else:
        error = {
            "status": False,
            "error": 'Query is required to search albums!'
        }
        return jsonify(error)


@app.route('/lyrics/')
def lyrics():
    query = request.args.get('query')

    if query:
        try:
            if 'http' in query and 'saavn' in query:
                id = jiosaavn.get_song_id(query)
                lyrics = jiosaavn.get_lyrics(id)
            else:
                lyrics = jiosaavn.get_lyrics(query)
            response = {}
            response['status'] = True
            response['lyrics'] = lyrics
            return jsonify(response)
        except Exception as e:
            error = {
                "status": False,
                "error": str(e)
            }
            return jsonify(error)

    else:
        error = {
            "status": False,
            "error": 'Query containing song link or id is required to fetch lyrics!'
        }
        return jsonify(error)


@app.route('/result/')
def result():
    query = request.args.get('query')
    lyrics = parse_bool_arg(request.args.get('lyrics'), False)

    if 'saavn' not in query:
        return jsonify(jiosaavn.search_for_song(query, lyrics, True))
    try:
        if '/song/' in query:
            print("Song")
            song_id = jiosaavn.get_song_id(query)
            song = jiosaavn.get_song(song_id, lyrics)
            return jsonify(song)

        elif '/album/' in query:
            print("Album")
            id = jiosaavn.get_album_id(query)
            songs = jiosaavn.get_album(id, lyrics)
            return jsonify(songs)

        elif '/playlist/' or '/featured/' in query:
            print("Playlist")
            id = jiosaavn.get_playlist_id(query)
            songs = jiosaavn.get_playlist(id, lyrics)
            return jsonify(songs)

    except Exception as e:
        print_exc()
        error = {
            "status": True,
            "error": str(e)
        }
        return jsonify(error)
    return None


# ─── Library API Endpoints ────────────────────────────────────────────────────

@app.route('/api/favorites', methods=['GET', 'POST'])
def api_favorites():
    if request.method == 'GET':
        favs = Favorite.query.order_by(Favorite.created_at.desc()).all()
        return jsonify([f.to_dict() for f in favs])
    
    data = request.json
    if not data or 'id' not in data:
        return jsonify({"status": False, "error": "Missing song data"}), 400
    
    # Toggle favorite
    existing = Favorite.query.filter_by(song_id=data['id']).first()
    if existing:
        db.session.delete(existing)
        db.session.commit()
        return jsonify({"status": True, "action": "removed"})
    
    new_fav = Favorite(
        song_id=data['id'],
        title=data.get('song', 'Unknown'),
        artist=data.get('primary_artists') or data.get('singers') or 'Unknown Artist',
        image_url=data.get('image'),
        media_url=data.get('media_url') or data.get('media_preview_url')
    )
    db.session.add(new_fav)
    db.session.commit()
    return jsonify({"status": True, "action": "added"})


@app.route('/api/favorites/<song_id>', methods=['DELETE'])
def api_remove_favorite(song_id):
    fav = Favorite.query.filter_by(song_id=song_id).first()
    if fav:
        db.session.delete(fav)
        db.session.commit()
    return jsonify({"status": True})


@app.route('/api/playlists', methods=['GET', 'POST'])
def api_playlists():
    if request.method == 'GET':
        playlists = Playlist.query.order_by(Playlist.created_at.desc()).all()
        return jsonify([p.to_dict() for p in playlists])
    
    data = request.json
    if not data or 'name' not in data:
        return jsonify({"status": False, "error": "Name is required"}), 400
    
    new_pl = Playlist(name=data['name'], description=data.get('description', ''))
    db.session.add(new_pl)
    db.session.commit()
    return jsonify(new_pl.to_dict())


@app.route('/api/playlists/<int:playlist_id>', methods=['GET', 'DELETE'])
def api_playlist_detail(playlist_id):
    pl = Playlist.query.get_or_404(playlist_id)
    if request.method == 'DELETE':
        db.session.delete(pl)
        db.session.commit()
        return jsonify({"status": True})
    
    songs = [s.to_dict() for s in pl.songs]
    res = pl.to_dict()
    res['songs'] = songs
    return jsonify(res)


@app.route('/api/playlists/<int:playlist_id>/songs', methods=['POST'])
def api_add_to_playlist(playlist_id):
    pl = Playlist.query.get_or_404(playlist_id)
    data = request.json
    if not data or 'id' not in data:
        return jsonify({"status": False, "error": "Missing song data"}), 400
    
    # Check if already in playlist
    existing = PlaylistSong.query.filter_by(playlist_id=playlist_id, song_id=data['id']).first()
    if existing:
        return jsonify({"status": True, "message": "Already in playlist"})
    
    new_song = PlaylistSong(
        playlist_id=playlist_id,
        song_id=data['id'],
        title=data.get('song', 'Unknown'),
        artist=data.get('primary_artists') or data.get('singers') or 'Unknown Artist',
        image_url=data.get('image'),
        media_url=data.get('media_url') or data.get('media_preview_url')
    )
    db.session.add(new_song)
    db.session.commit()
    return jsonify({"status": True})


@app.route('/api/playlists/<int:playlist_id>/songs/<song_id>', methods=['DELETE'])
def api_remove_from_playlist(playlist_id, song_id):
    song = PlaylistSong.query.filter_by(playlist_id=playlist_id, song_id=song_id).first()
    if song:
        db.session.delete(song)
        db.session.commit()
    return jsonify({"status": True})


if __name__ == '__main__':
    app.debug = True
    app.run(host='0.0.0.0', port=5100, use_reloader=True, threaded=True)
