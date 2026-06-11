<<<<<<< HEAD
# RAKSHYAK – Complete Setup Guide (XAMPP + MySQL Edition)

---

## Files in This Folder

| File | Purpose |
|------|---------|
| `server.js` | Node.js backend — HTTP + WebSocket + MySQL |
| `rokkha-app.html` | Mobile app (open on phone) |
| `rokkha-dashboard.html` | Command center (open on laptop) |
| `rakshyak_mysql.sql` | MySQL database schema (import once) |
| `package.json` | Node dependencies list |

---

## PART 1 — Set Up XAMPP (MySQL Database)

### Step 1 — Download & Install XAMPP
👉 https://www.apachefriends.org/download.html  
Choose the version for your OS (Windows / Mac / Linux).

### Step 2 — Start XAMPP
1. Open **XAMPP Control Panel**
2. Click **Start** next to **MySQL** (Apache is optional but fine to start)
3. The MySQL row should turn green — that means it's running

### Step 3 — Import the Database

1. Open your browser and go to: **http://localhost/phpmyadmin**
2. In the left sidebar, click **"New"**
3. Type database name: `rakshyak` → click **Create**
4. With `rakshyak` selected, click the **"Import"** tab at the top
5. Click **"Choose File"** → select `rakshyak_mysql.sql`
6. Scroll down → click **"Go"**
7. You should see: *"Import has been successfully finished"*
8. In the left panel you'll now see: `rakshyak` → `alerts`, `users` tables ✅

---

## PART 2 — Set Up Node.js Server

### Step 4 — Install Node.js
👉 https://nodejs.org  (download version 18 or newer — LTS recommended)

### Step 5 — Put all files in one folder
```
rakshyak/
  server.js
  rokkha-app.html
  rokkha-dashboard.html
  rakshyak_mysql.sql
  package.json
```

### Step 6 — Install dependencies (one time only)
Open a terminal / command prompt inside the `rakshyak/` folder:
```bash
npm install
```
This installs: `express`, `ws`, `mysql2`, `cors`

### Step 7 — Start the server
```bash
node server.js
```

**What you should see in the terminal:**
```
✅  MySQL connected (XAMPP)

╔═══════════════════════════════════════════════╗
║         RAKSHYAK SERVER STARTED               ║
╠═══════════════════════════════════════════════╣
║  DB Mode : MySQL (XAMPP)                      ║
║  Port    : 3000                               ║
╠═══════════════════════════════════════════════╣
║  IP      : 192.168.1.45                       ║
║  📱 Phone    → http://192.168.1.45:3000/app   ║
║  💻 Dashboard→ http://192.168.1.45:3000/dashboard ║
╚═══════════════════════════════════════════════╝
```

> ✅ If you see "MySQL connected" — the database is working perfectly.  
> ⚠️ If you see "JSON fallback" — MySQL is not running. Go back and start XAMPP.

---

## PART 3 — Connect Your Devices

> ⚠️ **Your phone and laptop must be on the SAME Wi-Fi network.**

### Step 8 — Find your laptop's IP address

**Windows:**
```
ipconfig
```
Look for **"IPv4 Address"** under your Wi-Fi adapter (e.g. 192.168.1.45)

**Mac:**
```
ifconfig | grep "inet "
```
Or: System Settings → Wi-Fi → Details → IP Address

### Step 9 — Open Dashboard on your Laptop

Open Chrome/Edge and go to:
```
http://192.168.1.45:3000/dashboard
```
(replace with your actual IP from the terminal)

You will see the **RAKSHYAK Command Center** with a live map.

### Step 10 — Open App on your Phone

On your phone's browser (Chrome recommended):
```
http://192.168.1.45:3000/app
```

1. Tap **"Grant Permissions"** → allow Location + Camera
2. Tap **"Register"** and create an account
3. Add an emergency contact name and phone number
4. You're ready!

---

## PART 4 — Sending & Viewing an SOS Alert

### On the Phone (app):
1. Open the app → you should see **"ONLINE"** badge (green)
2. Press and **hold the big green SOS button for 2 seconds**
3. The button turns red and pulses
4. The app will automatically:
   - 📍 Get your GPS location
   - 📷 Capture a photo from your camera
   - 📡 Send everything to the dashboard in real-time

### On the Laptop (dashboard):
- An **alert card appears** instantly in the right panel
- The **map zooms to the person's location** with a red pin
- You see: **name, phone, GPS coordinates, photo, contacts**
- Click **🖼 the photo** to open it fullscreen
- Click **🗺 LOCATE** to re-focus the map
- Click **✓ RESOLVE** when the alert is handled

### Viewing data in phpMyAdmin:
1. Open http://localhost/phpmyadmin
2. Click `rakshyak` → `alerts`
3. Click **Browse** to see all SOS alerts with full data
4. Click `users` → Browse to see registered users

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "MySQL unavailable" in terminal | Open XAMPP → Start MySQL |
| Phone can't connect | Check same Wi-Fi; use IP from terminal, not `localhost` |
| "RECONNECTING" on app/dashboard | Server not running — check terminal |
| Location not showing on map | Allow location in browser; GPS needs outdoor signal |
| Photo not appearing | Allow camera permission in browser settings |
| `npm install` fails | Make sure Node.js is installed: `node --version` |

---

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/app` | Mobile app |
| GET | `/dashboard` | Dashboard |
| POST | `/api/register` | Register user |
| POST | `/api/login` | Login |
| GET | `/api/alerts` | Get recent alerts |
| POST | `/api/alerts/:id/resolve` | Resolve alert |
| GET | `/api/status` | Check DB mode (mysql/json) |

---

## XAMPP MySQL Credentials

| Setting | Value |
|---------|-------|
| Host | `localhost` |
| Port | `3306` |
| User | `root` |
| Password | *(empty by default)* |
| Database | `rakshyak` |

If you set a custom MySQL password in XAMPP, edit `server.js` line:
```js
password: '',  // ← put your password here
```
=======
# Sahara
SAHARA (सहारा) is a smart emergency response platform for Nepal that enables users to send instant SOS alerts with GPS location and optional photo evidence. Built with Flutter, Laravel, and React, it provides real-time notifications, live emergency tracking, offline support, and analytics to improve emergency response and public safety.
>>>>>>> b713aa3064001722a212815702af6da42ea28843
