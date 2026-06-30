import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'users.json');

// Initialize empty DB file if not exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({}, null, 2), 'utf8');
}

function readData() {
  try {
    const content = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(content || '{}');
  } catch (err) {
    console.error('Error reading users database:', err);
    return {};
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing to users database:', err);
  }
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

export function registerUser(username, password) {
  const db = readData();
  const lowerUsername = username.toLowerCase();
  
  if (db[lowerUsername]) {
    throw new Error('User already exists');
  }
  
  const { salt, hash } = hashPassword(password);
  
  db[lowerUsername] = {
    username, // original casing
    salt,
    hash,
    sessions: [],
    likedSongs: [],
    playlists: [],
    recentlyPlayed: []
  };
  
  writeData(db);
  return { username };
}

export function loginUser(username, password) {
  const db = readData();
  const lowerUsername = username.toLowerCase();
  const user = db[lowerUsername];
  
  if (!user) {
    throw new Error('Invalid username or password');
  }
  
  const isValid = verifyPassword(password, user.salt, user.hash);
  if (!isValid) {
    throw new Error('Invalid username or password');
  }
  
  const token = crypto.randomBytes(32).toString('hex');
  user.sessions.push(token);
  
  // Keep last 10 sessions to prevent unbounded growth
  if (user.sessions.length > 10) {
    user.sessions.shift();
  }
  
  writeData(db);
  return {
    username: user.username,
    token,
    data: {
      likedSongs: user.likedSongs || [],
      playlists: user.playlists || [],
      recentlyPlayed: user.recentlyPlayed || []
    }
  };
}

export function verifySession(token) {
  const db = readData();
  for (const lowerUsername in db) {
    const user = db[lowerUsername];
    if (user.sessions && user.sessions.includes(token)) {
      return {
        username: user.username,
        data: {
          likedSongs: user.likedSongs || [],
          playlists: user.playlists || [],
          recentlyPlayed: user.recentlyPlayed || []
        }
      };
    }
  }
  return null;
}

export function logoutUser(token) {
  const db = readData();
  for (const lowerUsername in db) {
    const user = db[lowerUsername];
    if (user.sessions && user.sessions.includes(token)) {
      user.sessions = user.sessions.filter(t => t !== token);
      writeData(db);
      return true;
    }
  }
  return false;
}

export function syncUserData(username, token, { likedSongs, playlists, recentlyPlayed }) {
  const db = readData();
  const lowerUsername = username.toLowerCase();
  const user = db[lowerUsername];
  
  if (!user || !user.sessions.includes(token)) {
    throw new Error('Unauthorized');
  }
  
  user.likedSongs = likedSongs || [];
  user.playlists = playlists || [];
  user.recentlyPlayed = recentlyPlayed || [];
  
  writeData(db);
  return true;
}
