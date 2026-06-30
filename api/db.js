import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { kv } from '@vercel/kv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'users.json');

// Initialize empty DB file if not exists (for local file fallback)
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({}, null, 2), 'utf8');
}

// Determine if we should use Vercel KV (production/Vercel env)
const useKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
if (useKV) {
  console.log('Database running in CLOUD mode (Vercel KV)');
} else {
  console.log('Database running in LOCAL mode (JSON file fallback)');
}

// --- Local File Helpers ---
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

// --- Password Hashing Helpers ---
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

// Helper to parse potential stringified JSON from KV
function parseKVData(val) {
  if (!val) return null;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch (e) {
      return val;
    }
  }
  return val;
}

// --- Exported Database Functions ---

export async function registerUser(username, password) {
  const lowerUsername = username.toLowerCase();

  if (useKV) {
    const existingUser = await kv.get(`user:${lowerUsername}`);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const { salt, hash } = hashPassword(password);
    const user = {
      username, // original casing
      salt,
      hash,
      sessions: [],
      likedSongs: [],
      playlists: [],
      recentlyPlayed: []
    };

    await kv.set(`user:${lowerUsername}`, JSON.stringify(user));
    return { username };
  } else {
    const db = readData();
    if (db[lowerUsername]) {
      throw new Error('User already exists');
    }
    
    const { salt, hash } = hashPassword(password);
    db[lowerUsername] = {
      username,
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
}

export async function loginUser(username, password) {
  const lowerUsername = username.toLowerCase();

  if (useKV) {
    const rawUser = await kv.get(`user:${lowerUsername}`);
    const user = parseKVData(rawUser);
    
    if (!user) {
      throw new Error('Invalid username or password');
    }

    const isValid = verifyPassword(password, user.salt, user.hash);
    if (!isValid) {
      throw new Error('Invalid username or password');
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.sessions = user.sessions || [];
    user.sessions.push(token);

    if (user.sessions.length > 10) {
      user.sessions.shift();
    }

    // Save updated user sessions
    await kv.set(`user:${lowerUsername}`, JSON.stringify(user));
    
    // Index session token mapping to enable O(1) fast session verification
    await kv.set(`session:${token}`, JSON.stringify({ username: user.username, lowerUsername }));

    return {
      username: user.username,
      token,
      data: {
        likedSongs: user.likedSongs || [],
        playlists: user.playlists || [],
        recentlyPlayed: user.recentlyPlayed || []
      }
    };
  } else {
    const db = readData();
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
}

export async function verifySession(token) {
  if (useKV) {
    const rawSession = await kv.get(`session:${token}`);
    const session = parseKVData(rawSession);
    if (!session) return null;

    const rawUser = await kv.get(`user:${session.lowerUsername}`);
    const user = parseKVData(rawUser);
    if (!user || !user.sessions || !user.sessions.includes(token)) {
      return null;
    }

    return {
      username: user.username,
      data: {
        likedSongs: user.likedSongs || [],
        playlists: user.playlists || [],
        recentlyPlayed: user.recentlyPlayed || []
      }
    };
  } else {
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
}

export async function logoutUser(token) {
  if (useKV) {
    const rawSession = await kv.get(`session:${token}`);
    const session = parseKVData(rawSession);
    if (!session) return false;

    await kv.del(`session:${token}`);

    const rawUser = await kv.get(`user:${session.lowerUsername}`);
    const user = parseKVData(rawUser);
    if (user && user.sessions) {
      user.sessions = user.sessions.filter(t => t !== token);
      await kv.set(`user:${session.lowerUsername}`, JSON.stringify(user));
      return true;
    }
    return false;
  } else {
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
}

export async function syncUserData(username, token, { likedSongs, playlists, recentlyPlayed }) {
  const lowerUsername = username.toLowerCase();

  if (useKV) {
    const rawSession = await kv.get(`session:${token}`);
    const session = parseKVData(rawSession);
    if (!session || session.lowerUsername !== lowerUsername) {
      throw new Error('Unauthorized');
    }

    const rawUser = await kv.get(`user:${lowerUsername}`);
    const user = parseKVData(rawUser);
    if (!user || !user.sessions || !user.sessions.includes(token)) {
      throw new Error('Unauthorized');
    }

    user.likedSongs = likedSongs || [];
    user.playlists = playlists || [];
    user.recentlyPlayed = recentlyPlayed || [];

    await kv.set(`user:${lowerUsername}`, JSON.stringify(user));
    return true;
  } else {
    const db = readData();
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
}
