// server.js - FINAL CORRECTED VERSION

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const cors = require('cors'); // Added for cross-origin support

const app = express();
const PORT = 3000;

// --- Database Setup ---
// This path is now absolute to work with the Docker volume at /app/data
const dataDir = '/app/data';
const dbPath = path.join(dataDir, 'inventory.db');

// Ensure the 'data' directory exists
// This is helpful for the first time the container runs
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`Created data directory: ${dataDir}`);
}

// Connect to SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        return console.error('Error opening database:', err.message);
    }
    console.log(`Connected to the SQLite database at: ${dbPath}`);
    db.run(`CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        sku TEXT NOT NULL UNIQUE,
        assetTag TEXT UNIQUE,
        location TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        acquisitionDate TEXT,
        status TEXT NOT NULL,
        assignedTo TEXT,
        notes TEXT
    )`, (err) => {
        if (err) {
            return console.error('Error creating table:', err.message);
        }
        console.log('Items table ensured.');
    });
});

// Middleware
app.use(cors()); // Use CORS middleware
app.use(express.json()); // Use Express's built-in JSON parser

// Serve static files from the 'dist' folder where Parcel builds the app
app.use(express.static(path.join(__dirname, 'dist')));

// --- API Endpoints ---
app.get('/api/items', (req, res) => {
    db.all('SELECT * FROM items', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.post('/api/items', (req, res) => {
    const { name, description, sku, assetTag, location, quantity, acquisitionDate, status, assignedTo, notes } = req.body;
    if (!name || !sku || !location || !quantity || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const sql = `INSERT INTO items (name, description, sku, assetTag, location, quantity, acquisitionDate, status, assignedTo, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [name, description, sku, assetTag, location, quantity, acquisitionDate, status, assignedTo, notes];
    db.run(sql, params, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, ...req.body });
    });
});

app.put('/api/items/:id', (req, res) => {
    const { id } = req.params;
    const { name, description, sku, assetTag, location, quantity, acquisitionDate, status, assignedTo, notes } = req.body;
    const sql = `UPDATE items SET name = ?, description = ?, sku = ?, assetTag = ?, location = ?, quantity = ?, acquisitionDate = ?, status = ?, assignedTo = ?, notes = ? WHERE id = ?`;
    const params = [name, description, sku, assetTag, location, quantity, acquisitionDate, status, assignedTo, notes, id];
    db.run(sql, params, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Item updated successfully' });
    });
});

app.delete('/api/items/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM items WHERE id = ?', id, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(204).send();
    });
});

// This fallback route MUST be last. It sends the main app file for any GET request that doesn't match an API route.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            return console.error('Error closing database:', err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});
