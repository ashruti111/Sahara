/**
 * RAKSHYAK – Emergency Response System Backend
 * Supports: Online (WebSocket) + Offline (SMS via Twilio)
 */

const http = require('http');
const path = require('path');
const fs = require('fs');
const express = require('express');
const { WebSocketServer } = require('ws');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// MySQL Configuration
const MYSQL_CONFIG = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'rakshyak',
  waitForConnections: true,
  connectionLimit: 10,
};

let pool = null;
let usingMySQL = false;

// JSON Fallback
const DB_FILE = path.join(__dirname, 'rakshyak_data.json');

function loadJSON() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
    return { users: {}, alerts: [] };
  } catch (e) {
    return { users: {}, alerts: [] };
  }
}

function saveJSON(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {}
}

// Initialize Database
async function initDB() {
  try {
    const mysql = require('mysql2/promise');
    
    const tempPool = mysql.createPool({
      host: MYSQL_CONFIG.host,
      port: MYSQL_CONFIG.port,
      user: MYSQL_CONFIG.user,
      password: MYSQL_CONFIG.password,
    });
    
    await tempPool.query(`CREATE DATABASE IF NOT EXISTS \`${MYSQL_CONFIG.database}\``);
    await tempPool.end();
    
    pool = mysql.createPool(MYSQL_CONFIG);
    const conn = await pool.getConnection();
    
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` VARCHAR(36) NOT NULL,
        \`name\` VARCHAR(120) NOT NULL,
        \`phone\` VARCHAR(20) NOT NULL,
        \`email\` VARCHAR(120) DEFAULT NULL,
        \`pass_hash\` VARCHAR(255) NOT NULL,
        \`contacts\` TEXT DEFAULT '[]',
        \`created_at\` BIGINT NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_phone\` (\`phone\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`alerts\` (
        \`id\` VARCHAR(80) NOT NULL,
        \`user_id\` VARCHAR(36) NOT NULL,
        \`user_name\` VARCHAR(120) NOT NULL,
        \`user_phone\` VARCHAR(20) NOT NULL,
        \`lat\` DOUBLE DEFAULT NULL,
        \`lng\` DOUBLE DEFAULT NULL,
        \`accuracy\` DOUBLE DEFAULT NULL,
        \`photo\` LONGTEXT DEFAULT NULL,
        \`online\` TINYINT(1) NOT NULL DEFAULT 1,
        \`contacts\` TEXT DEFAULT '[]',
        \`timestamp\` BIGINT NOT NULL,
        \`resolved\` TINYINT(1) NOT NULL DEFAULT 0,
        \`resolved_at\` BIGINT DEFAULT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    
    conn.release();
    usingMySQL = true;
    console.log('✅ MySQL connected');
  } catch (e) {
    console.warn('⚠️ MySQL unavailable, using JSON storage');
    usingMySQL = false;
    if (!fs.existsSync(DB_FILE)) {
      saveJSON({ users: {}, alerts: [] });
    }
  }
}

// Database operations
async function createUser({ id, name, phone, email, pass_hash, contacts }) {
  if (usingMySQL && pool) {
    await pool.query(
      'INSERT INTO users (id, name, phone, email, pass_hash, contacts, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, phone, email || null, pass_hash, JSON.stringify(contacts || []), Date.now()]
    );
  } else {
    const db = loadJSON();
    db.users[phone] = { id, name, phone, email, pass_hash, contacts: contacts || [], created_at: Date.now() };
    saveJSON(db);
  }
}

async function getUserByIdentifier(identifier) {
  if (usingMySQL && pool) {
    const [rows] = await pool.query('SELECT * FROM users WHERE phone = ? OR email = ? LIMIT 1', [identifier, identifier]);
    if (rows[0]) {
      try { rows[0].contacts = JSON.parse(rows[0].contacts || '[]'); } catch { rows[0].contacts = []; }
      return rows[0];
    }
    return null;
  } else {
    const db = loadJSON();
    let user = db.users[identifier];
    if (!user) user = Object.values(db.users).find(u => u.email === identifier);
    return user || null;
  }
}

async function createAlert(alert) {
  const { id, userId, userName, userPhone, location, photo, online, contacts, timestamp } = alert;
  const lat = location?.lat ?? null;
  const lng = location?.lng ?? null;
  const acc = location?.acc ?? null;

  if (usingMySQL && pool) {
    await pool.query(
      `INSERT INTO alerts (id, user_id, user_name, user_phone, lat, lng, accuracy, photo, online, contacts, timestamp, resolved) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [id, userId, userName, userPhone, lat, lng, acc, photo || null, online ? 1 : 0, JSON.stringify(contacts || []), timestamp]
    );
  } else {
    const db = loadJSON();
    if (!db.alerts.find(a => a.id === id)) {
      db.alerts.push({ id, userId, userName, userPhone, location, photo, online, contacts: contacts || [], timestamp, resolved: 0 });
      saveJSON(db);
    }
  }
}

async function resolveAlert(alertId) {
  if (usingMySQL && pool) {
    await pool.query('UPDATE alerts SET resolved = 1, resolved_at = ? WHERE id = ?', [Date.now(), alertId]);
  } else {
    const db = loadJSON();
    const alert = db.alerts.find(a => a.id === alertId);
    if (alert) { alert.resolved = 1; alert.resolved_at = Date.now(); saveJSON(db); }
  }
}

async function getActiveAlerts() {
  if (usingMySQL && pool) {
    const [rows] = await pool.query('SELECT * FROM alerts WHERE resolved = 0 ORDER BY timestamp DESC');
    return rows.map(r => {
      try { r.contacts = JSON.parse(r.contacts || '[]'); } catch { r.contacts = []; }
      if (r.lat) r.location = { lat: r.lat, lng: r.lng, acc: r.accuracy };
      r.userId = r.user_id;
      r.userName = r.user_name;
      r.userPhone = r.user_phone;
      return r;
    });
  } else {
    return loadJSON().alerts.filter(a => !a.resolved).reverse();
  }
}

// Routes - Support both old and new filenames
function serveHTML(res, filenames) {
  for (const filename of filenames) {
    const filePath = path.join(__dirname, filename);
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
  }
  res.status(404).send('HTML file not found. Please ensure app.html exists.');
}

app.get('/', (req, res) => res.redirect('/dashboard'));
app.get('/app', (req, res) => serveHTML(res, ['app.html', 'rokkha-app.html']));
app.get('/dashboard', (req, res) => serveHTML(res, ['dashboard.html', 'rokkha-dashboard.html']));

// API Routes
app.post('/api/register', async (req, res) => {
  try {
    const { id, name, phone, email, pass, contacts } = req.body;
    if (!name || !phone || !pass) return res.status(400).json({ error: 'Missing fields' });
    
    const existing = await getUserByIdentifier(phone);
    if (existing) return res.status(409).json({ error: 'User exists' });
    
    await createUser({ id: id || Date.now().toString(36), name, phone, email, pass_hash: Buffer.from(pass).toString('base64'), contacts });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { phone, pass } = req.body;
    const user = await getUserByIdentifier(phone);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.pass_hash !== Buffer.from(pass).toString('base64')) return res.status(401).json({ error: 'Wrong password' });
    delete user.pass_hash;
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/alerts/active', async (req, res) => {
  try {
    res.json(await getActiveAlerts());
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/api/alerts/:id/resolve', async (req, res) => {
  try {
    await resolveAlert(req.params.id);
    broadcastToClients({ type: 'ALERT_RESOLVED', alertId: req.params.id });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
});

// WebSocket Server
const wss = new WebSocketServer({ server });
const clients = new Set();

function broadcastToClients(data, exclude = null) {
  const message = JSON.stringify(data);
  for (const client of clients) {
    if (client !== exclude && client.readyState === 1) client.send(message);
  }
}

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: 'CONNECTED' }));
  
  ws.on('message', async (data) => {
    try {
      const parsed = JSON.parse(data.toString());
      
      if (parsed.type === 'SOS_ALERT') {
        const alertId = `${parsed.userId}_${parsed.timestamp}`;
        await createAlert({ ...parsed, id: alertId });
        broadcastToClients({ ...parsed, id: alertId }, ws);
        console.log(`🚨 SOS from ${parsed.userName} (${parsed.online ? 'ONLINE' : 'OFFLINE'})`);
      }
      else if (parsed.type === 'SOS_CANCEL') {
        broadcastToClients(parsed, ws);
      }
      else if (parsed.type === 'RESOLVE_ALERT') {
        await resolveAlert(parsed.alertId);
        broadcastToClients({ type: 'ALERT_RESOLVED', alertId: parsed.alertId }, ws);
      }
    } catch (e) {}
  });
  
  ws.on('close', () => clients.delete(ws));
});

// Start server
const PORT = process.env.PORT || 3000;

initDB().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    const addresses = [];
    
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) addresses.push(iface.address);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🛡️  RAKSHYAK Emergency System');
    console.log('='.repeat(60));
    console.log(`📡 Port: ${PORT} | DB: ${usingMySQL ? 'MySQL' : 'JSON'}`);
    console.log('-'.repeat(60));
    
    addresses.forEach(ip => {
      console.log(`📱 App:       http://${ip}:${PORT}/app`);
      console.log(`💻 Dashboard: http://${ip}:${PORT}/dashboard`);
      console.log('');
    });
    
    console.log(`📍 Local: http://localhost:${PORT}/app`);
    console.log('='.repeat(60) + '\n');
  });
});