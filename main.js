const { app, BrowserWindow, ipcMain, dialog, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const db = require('./db');

let mainWindow = null;
let settings = loadSettings();

function getSettingsPath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function loadSettings() {
  try {
    const p = getSettingsPath();
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {}
  return {
    songsFolder: path.join(app.getPath('documents'), 'CMP22 Karaoke', 'songs'),
    volume: 80,
  };
}

function saveSettings(s) {
  settings = { ...settings, ...s };
  fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2));
}

function createWindow() {
  const iconPath = path.join(__dirname, 'assets', 'icon.ico');
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'CMP22 Karaokê',
    backgroundColor: '#0f0f0f',
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'app', 'index.html'));

  mainWindow.webContents.session.setPermissionRequestHandler((wc, permission, cb) => {
    if (permission === 'media') return cb(true);
    cb(false);
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  if (!fs.existsSync(settings.songsFolder)) {
    fs.mkdirSync(settings.songsFolder, { recursive: true });
  }
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ─── DB ───────────────────────────────────────────────────────────────────────
ipcMain.handle('db:getSongs', (_, search, filters, sortBy, sortDir) => db.getAllSongs(search, filters, sortBy, sortDir));
ipcMain.handle('db:getSong', (_, id) => db.getSong(id));
ipcMain.handle('db:updateSong', (_, id, fields) => { db.updateSong(id, fields); return true; });
ipcMain.handle('db:deleteSong', (_, id) => {
  const song = db.getSong(id);
  if (song) {
    const fp = path.join(settings.songsFolder, song.filename);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
    db.deleteSong(id);
  }
  return true;
});
ipcMain.handle('db:getDistinctValues', (_, field) => db.getDistinctValues(field));
ipcMain.handle('db:getQueue', () => db.getQueue());
ipcMain.handle('db:addToQueue', (_, songId) => db.addToQueue(songId));
ipcMain.handle('db:removeFromQueue', (_, queueId) => db.removeFromQueue(queueId));
ipcMain.handle('db:clearQueue', () => { db.clearQueue(); return true; });
ipcMain.handle('db:reorderQueue', (_, queueId, newPos) => { db.reorderQueue(queueId, newPos); return true; });
ipcMain.handle('db:getLists', () => db.getLists());
ipcMain.handle('db:saveLists', (_, languages, genres) => { db.saveLists(languages, genres); return true; });
ipcMain.handle('db:incrementPlayCount', (_, id) => { db.incrementPlayCount(id); return true; });

// ─── Settings ─────────────────────────────────────────────────────────────────
ipcMain.handle('settings:get', () => settings);
ipcMain.handle('settings:save', (_, s) => { saveSettings(s); return true; });
ipcMain.handle('settings:chooseFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Escolha a pasta de músicas',
  });
  if (!result.canceled && result.filePaths[0]) {
    saveSettings({ songsFolder: result.filePaths[0] });
    return result.filePaths[0];
  }
  return null;
});

// ─── Player ───────────────────────────────────────────────────────────────────
ipcMain.handle('player:getFilePath', (_, song) => {
  let fp = path.join(settings.songsFolder, song.filename);
  if (!fs.existsSync(fp)) {
    const base = fp.replace(/\.[^.]+$/, '');
    for (const ext of ['.mp4', '.mkv', '.webm', '.m4a', '.mp3']) {
      if (fs.existsSync(base + ext)) { fp = base + ext; break; }
    }
  }
  return fp;
});

ipcMain.handle('player:getNextInQueue', () => {
  const next = db.getNextInQueue();
  if (!next) return null;
  db.removeFromQueue(next.queue_id);
  db.incrementPlayCount(next.id);
  let fp = path.join(settings.songsFolder, next.filename);
  if (!fs.existsSync(fp)) {
    const base = fp.replace(/\.[^.]+$/, '');
    for (const ext of ['.mp4', '.mkv', '.webm', '.m4a', '.mp3']) {
      if (fs.existsSync(base + ext)) { fp = base + ext; break; }
    }
  }
  return { ...next, filePath: fp };
});

ipcMain.handle('settings:setVolume', (_, vol) => { saveSettings({ volume: vol }); return true; });

// ─── YouTube ──────────────────────────────────────────────────────────────────
function getYtDlpPath() {
  const ext = process.platform === 'win32' ? '.exe' : '';
  const local = path.join(__dirname, 'bin', `yt-dlp${ext}`);
  if (fs.existsSync(local)) return local;
  return `yt-dlp${ext}`;
}

ipcMain.handle('yt:search', async (_, query) => {
  return new Promise((resolve, reject) => {
    const ytdlp = getYtDlpPath();
    const args = ['ytsearch5:' + query, '--dump-json', '--flat-playlist', '--no-playlist'];
    let out = '', err = '';
    let proc;
    try { proc = spawn(ytdlp, args); } catch(e) { return reject(new Error('yt-dlp não encontrado')); }
    proc.stdout.on('data', d => out += d);
    proc.stderr.on('data', d => err += d);
    proc.on('error', e => reject(new Error('yt-dlp não encontrado')));
    proc.on('close', code => {
      if (code !== 0 && !out) return reject(new Error('Erro na busca'));
      try {
        const results = out.trim().split('\n').filter(Boolean).map(line => {
          const info = JSON.parse(line);
          return {
            title: info.title,
            uploader: info.uploader || info.channel || '',
            duration: info.duration,
            thumbnail: info.thumbnail,
            url: info.url || info.webpage_url || `https://www.youtube.com/watch?v=${info.id}`,
            id: info.id,
          };
        });
        resolve(results);
      } catch(e) { reject(new Error('Erro ao parsear resultados')); }
    });
  });
});

ipcMain.handle('yt:fetchInfo', async (_, url) => {
  return new Promise((resolve, reject) => {
    const ytdlp = getYtDlpPath();
    let proc;
    try { proc = spawn(ytdlp, ['--dump-json', '--no-playlist', url]); }
    catch(e) { return reject(new Error('yt-dlp não encontrado')); }
    let out = '', err = '';
    proc.stdout.on('data', d => out += d);
    proc.stderr.on('data', d => err += d);
    proc.on('error', e => reject(new Error('yt-dlp não encontrado')));
    proc.on('close', code => {
      if (code !== 0) return reject(new Error(err || 'Erro ao buscar info'));
      try {
        const info = JSON.parse(out);
        resolve({ title: info.title, artist: info.uploader || '', duration: info.duration, thumbnail: info.thumbnail, webpage_url: info.webpage_url || url });
      } catch(e) { reject(new Error('Erro ao parsear info')); }
    });
  });
});

ipcMain.handle('yt:download', async (_, opts) => {
  const { url, title, artist, language, genre, quality } = opts;
  const safeTitle = title.replace(/[^a-zA-Z0-9áéíóúàãõâêôçÁÉÍÓÚÀÃÕÂÊÔÇ\s\-_]/g, '').trim();
  const filename = `${safeTitle}_${Date.now()}.mp4`;
  const outputPath = path.join(settings.songsFolder, filename);
  const ytdlp = getYtDlpPath();
  const heightLimit = quality === '1080p' ? 1080 : 720;
  const args = ['-f', `best[ext=mp4][height<=${heightLimit}]/best[ext=mp4]/best`, '--no-playlist', '-o', outputPath, url];

  return new Promise((resolve, reject) => {
    const proc = spawn(ytdlp, args);
    let lastProgress = 0;
    const onData = d => {
      const match = d.toString().match(/(\d+\.\d+)%/);
      if (match) {
        const pct = parseFloat(match[1]);
        if (pct - lastProgress >= 2) {
          lastProgress = pct;
          mainWindow?.webContents.send('download:progress', { percent: pct });
        }
      }
    };
    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);
    proc.on('close', code => {
      if (code !== 0) {
        mainWindow?.webContents.send('download:error', { message: 'Download falhou' });
        return reject(new Error('Download falhou'));
      }
      const id = db.insertSong({ title, artist, language, genre, youtube_url: url, filename, duration: 0 });
      const song = db.getSong(id);
      mainWindow?.webContents.send('download:done', song);
      resolve(song);
    });
  });
});
