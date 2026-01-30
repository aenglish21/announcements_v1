const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'announcements.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([
        {
            id: 1,
            title: 'Welcome to Announcements',
            content: 'This is your first announcement. Edit it from the admin panel.',
            date: new Date().toISOString(),
            active: true
        }
    ], null, 2));
}

// Helper functions
function readAnnouncements() {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
}

function writeAnnouncements(announcements) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(announcements, null, 2));
}

// API Routes

// Get all announcements (public - only active)
app.get('/api/announcements', (req, res) => {
    const announcements = readAnnouncements();
    const activeAnnouncements = announcements.filter(a => a.active);
    res.json(activeAnnouncements);
});

// Get all announcements (admin - includes inactive)
app.get('/api/admin/announcements', (req, res) => {
    const announcements = readAnnouncements();
    res.json(announcements);
});

// Get single announcement
app.get('/api/admin/announcements/:id', (req, res) => {
    const announcements = readAnnouncements();
    const announcement = announcements.find(a => a.id === parseInt(req.params.id));
    if (!announcement) {
        return res.status(404).json({ error: 'Announcement not found' });
    }
    res.json(announcement);
});

// Create announcement
app.post('/api/admin/announcements', (req, res) => {
    const announcements = readAnnouncements();
    const newId = announcements.length > 0 ? Math.max(...announcements.map(a => a.id)) + 1 : 1;
    const newAnnouncement = {
        id: newId,
        title: req.body.title || 'Untitled',
        content: req.body.content || '',
        date: new Date().toISOString(),
        active: req.body.active !== false
    };
    announcements.push(newAnnouncement);
    writeAnnouncements(announcements);
    res.status(201).json(newAnnouncement);
});

// Update announcement
app.put('/api/admin/announcements/:id', (req, res) => {
    const announcements = readAnnouncements();
    const index = announcements.findIndex(a => a.id === parseInt(req.params.id));
    if (index === -1) {
        return res.status(404).json({ error: 'Announcement not found' });
    }
    announcements[index] = {
        ...announcements[index],
        title: req.body.title ?? announcements[index].title,
        content: req.body.content ?? announcements[index].content,
        active: req.body.active ?? announcements[index].active,
        updatedAt: new Date().toISOString()
    };
    writeAnnouncements(announcements);
    res.json(announcements[index]);
});

// Delete announcement
app.delete('/api/admin/announcements/:id', (req, res) => {
    const announcements = readAnnouncements();
    const index = announcements.findIndex(a => a.id === parseInt(req.params.id));
    if (index === -1) {
        return res.status(404).json({ error: 'Announcement not found' });
    }
    announcements.splice(index, 1);
    writeAnnouncements(announcements);
    res.json({ message: 'Announcement deleted' });
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
    console.log(`Announcements server running on port ${PORT}`);
});
