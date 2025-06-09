// server.js - IMPROVED VERSION

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const cors = require('cors');

// --- Basic Input Validation Middleware ---
const validateItem = (req, res, next) => {
    const { name, sku, location, quantity, status } = req.body;
    const errors = [];

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        errors.push('Item name is required and must be a non-empty string.');
    }
    if (!sku || typeof sku !== 'string' || sku.trim().length === 0) {
        errors.push('SKU is required and must be a non-empty string.');
    }
    if (!location || typeof location !== 'string' || location.trim().length === 0) {
        errors.push('Location is required and must be a non-empty string.');
    }
    if (quantity === undefined || typeof quantity !== 'number' || quantity < 0) {
        errors.push('Quantity is required and must be a non-negative number.');
    }
     if (!status || typeof status !== 'string' || !['Available', 'In Use', 'Under Repair', 'Disposed'].includes(status)) {
        errors.push('Status is required and must be one of: Available, In Use, Under Repair, Disposed.');
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    next();
};


const app = express();
// Use an environment variable for the port, with a default
const PORT = process.env.PORT || 3000;

// --- Database Setup ---
// Use environment variable for data directory, default to local './data'
const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'inventory.db');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`Created data directory: ${dataDir}`);
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Fatal Error: Could not open database.', err.message);
        process.exit(1);
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
            console.error('Fatal Error: Could not create table.', err.message);
            process.exit(1);
        }
        console.log('Items table ensured.');
    });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// --- API Endpoints ---
app.get('/api/items', (req, res) => {
    db.all('SELECT * FROM items', [], (err, rows) => {
        if (err) {
            console.error('API Error on GET /api/items:', err);
            return res.status(500).json({ error: 'An unexpected error occurred while fetching items.' });
        }
        res.json(rows);
    });
});

// Use the validation middleware for POST and PUT
app.post('/api/items', validateItem, (req, res) => {
    const { name, description, sku, assetTag, location, quantity, acquisitionDate, status, assignedTo, notes } = req.body;
    const sql = `INSERT INTO items (name, description, sku, assetTag, location, quantity, acquisitionDate, status, assignedTo, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [name, description, sku, assetTag, location, quantity, acquisitionDate, status, assignedTo, notes];
    db.run(sql, params, function(err) {
        if (err) {
             console.error('API Error on POST /api/items:', err);
             // Handle specific, common errors gracefully
             if (err.message.includes('UNIQUE constraint failed')) {
                 return res.status(409).json({ error: 'An item with this SKU or Asset Tag already exists.' });
             }
            return res.status(500).json({ error: 'An unexpected error occurred while creating the item.' });
        }
        res.status(201).json({ id: this.lastID, ...req.body });
    });
});

app.put('/api/items/:id', validateItem, (req, res) => {
    const { id } = req.params;
    const { name, description, sku, assetTag, location, quantity, acquisitionDate, status, assignedTo, notes } = req.body;
    const sql = `UPDATE items SET name = ?, description = ?, sku = ?, assetTag = ?, location = ?, quantity = ?, acquisitionDate = ?, status = ?, assignedTo = ?, notes = ? WHERE id = ?`;
    const params = [name, description, sku, assetTag, location, quantity, acquisitionDate, status, assignedTo, notes, id];
    db.run(sql, params, function(err) {
        if (err) {
            console.error(`API Error on PUT /api/items/${id}:`, err);
            if (err.message.includes('UNIQUE constraint failed')) {
                 return res.status(409).json({ error: 'An item with this SKU or Asset Tag already exists.' });
             }
            return res.status(500).json({ error: 'An unexpected error occurred while updating the item.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'No item found with this ID.' });
        }
        res.json({ message: 'Item updated successfully' });
    });
});

app.delete('/api/items/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM items WHERE id = ?', id, function(err) {
        if (err) {
            console.error(`API Error on DELETE /api/items/${id}:`, err);
            return res.status(500).json({ error: 'An unexpected error occurred while deleting the item.' });
        }
         if (this.changes === 0) {
            return res.status(404).json({ error: 'No item found with this ID.' });
        }
        res.status(204).send();
    });
});

// Fallback for Single Page Application
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            return console.error('Error closing database:', err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});
