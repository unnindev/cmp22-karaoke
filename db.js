const fs = require('fs');
const path = require('path');
const { app } = require('electron');

let dbPath;
let data = null;

function getDbPath() {
  if (!dbPath) dbPath = path.join(app.getPath('userData'), 'karaoke-db.json');
  return dbPath;
}

function load() {
  if (data) return data;
  const p = getDbPath();
  if (fs.existsSync(p)) {
    try { data = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { data = null; }
  }
  if (!data) data = { songs: [], queue: [], nextId: 1, nextQueueId: 1, languages: ['Português', 'Inglês', 'Espanhol'], genres: ['Sertanejo', 'Pop', 'Rock', 'Pagode', 'Funk', 'MPB', 'Forró', 'Axé'] };
  if (!data.languages) data.languages = ['Português', 'Inglês', 'Espanhol'];
  if (!data.genres) data.genres = ['Sertanejo', 'Pop', 'Rock', 'Pagode', 'Funk', 'MPB', 'Forró', 'Axé'];
  return data;
}

function save() {
  fs.writeFileSync(getDbPath(), JSON.stringify(data, null, 2));
}

function getAllSongs(search = '', filters = {}, sortBy = 'title', sortDir = 'asc') {
  const d = load();
  let results = d.songs.filter(s => {
    if (search) {
      const q = search.toLowerCase();
      if (!s.title.toLowerCase().includes(q) && !(s.artist||'').toLowerCase().includes(q)) return false;
    }
    if (filters.language && s.language !== filters.language) return false;
    if (filters.genre && s.genre !== filters.genre) return false;
    return true;
  });
  results.sort((a, b) => {
    let va = (a[sortBy] || '').toString().toLowerCase();
    let vb = (b[sortBy] || '').toString().toLowerCase();
    if (sortBy === 'play_count') { va = a.play_count || 0; vb = b.play_count || 0; }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });
  return results;
}

function getSong(id) { return load().songs.find(s => s.id === id) || null; }

function insertSong(song) {
  const d = load();
  const id = d.nextId++;
  d.songs.push({ id, title: song.title||'', artist: song.artist||'', language: song.language||'', genre: song.genre||'', youtube_url: song.youtube_url||'', filename: song.filename||'', duration: song.duration||0, play_count: 0, added_at: new Date().toISOString() });
  save();
  return id;
}

function updateSong(id, fields) {
  const d = load();
  const idx = d.songs.findIndex(s => s.id === id);
  if (idx === -1) return;
  ['title','artist','language','genre'].forEach(k => { if (fields[k] !== undefined) d.songs[idx][k] = fields[k]; });
  save();
}

function deleteSong(id) {
  const d = load();
  d.songs = d.songs.filter(s => s.id !== id);
  d.queue = d.queue.filter(q => q.song_id !== id);
  save();
}

function incrementPlayCount(id) {
  const d = load();
  const s = d.songs.find(x => x.id === id);
  if (s) { s.play_count = (s.play_count||0)+1; save(); }
}

function getQueue() {
  const d = load();
  return [...d.queue].sort((a,b)=>a.position-b.position).map(q => {
    const s = d.songs.find(x => x.id === q.song_id);
    return s ? { ...s, queue_id: q.id, singer: q.singer, position: q.position } : null;
  }).filter(Boolean);
}

function addToQueue(songId, singer='') {
  const d = load();
  const maxPos = d.queue.reduce((m,q)=>Math.max(m,q.position),0);
  const id = d.nextQueueId++;
  d.queue.push({ id, position: maxPos+1, song_id: songId, singer });
  save();
  return id;
}

function removeFromQueue(queueId) {
  const d = load();
  d.queue = d.queue.filter(q => q.id !== queueId);
  save();
}

function clearQueue() { const d = load(); d.queue = []; save(); }

function reorderQueue(queueId, newPosition) {
  const d = load();
  const item = d.queue.find(q => q.id === queueId);
  if (!item) return;
  const sorted = [...d.queue].sort((a,b)=>a.position-b.position);
  const oldIdx = sorted.findIndex(q => q.id === queueId);
  sorted.splice(oldIdx, 1);
  sorted.splice(newPosition, 0, item);
  sorted.forEach((q, i) => { q.position = i+1; });
  d.queue = sorted;
  save();
}

function getNextInQueue() {
  const d = load();
  const sorted = [...d.queue].sort((a,b)=>a.position-b.position);
  if (!sorted.length) return null;
  const q = sorted[0];
  const s = d.songs.find(x => x.id === q.song_id);
  return s ? { ...s, queue_id: q.id, singer: q.singer } : null;
}

function getDistinctValues(field) {
  const allowed = ['language','genre'];
  if (!allowed.includes(field)) return [];
  return [...new Set(load().songs.map(s=>s[field]).filter(Boolean))].sort().map(v=>({[field]:v}));
}

function getLists() { const d = load(); return { languages: d.languages, genres: d.genres }; }

function saveLists(languages, genres) {
  const d = load();
  if (languages) d.languages = languages;
  if (genres) d.genres = genres;
  save();
}

module.exports = { getAllSongs, getSong, insertSong, updateSong, deleteSong, incrementPlayCount, getQueue, addToQueue, removeFromQueue, clearQueue, reorderQueue, getNextInQueue, getDistinctValues, getLists, saveLists };
