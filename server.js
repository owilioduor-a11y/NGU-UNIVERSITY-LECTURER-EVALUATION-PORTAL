const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

function ensureDB() {
    if (!fs.existsSync(DB_FILE)) {
        const initialData = {
            users: [],
            applications: [],
            reviews: [],
            admin_bootstrapped: false,
            lec_pins: {},
            lecturers_data: null
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    }
}

function getData() {
    ensureDB();
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveData(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Simple Mock Hashing for this simulation
function mockHash(password) {
    return "m_hash_" + Buffer.from(password).toString('base64');
}

// Endpoints

// Admin Bootstrap
app.post('/api/admin/bootstrap', (req, res) => {
    const data = getData();
    if (data.admin_bootstrapped) {
        return res.status(400).json({ success: false, message: 'Admin already bootstrapped' });
    }
    data.admin_bootstrapped = true;
    data.admin = {
        username: req.body.username,
        password: mockHash(req.body.password)
    };
    saveData(data);
    res.json({ success: true, message: 'Bootstrap successful' });
});

// Admin Login
app.post('/api/admin/login', (req, res) => {
    const data = getData();
    if (data.admin && data.admin.username === req.body.username && data.admin.password === mockHash(req.body.password)) {
        res.json({ success: true, token: 'simulated-admin-token' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }
});

// Student Signup
app.post('/api/students/signup', (req, res) => {
    const data = getData();
    if (data.users.find(u => u.email === req.body.email)) {
        return res.status(400).json({ success: false, message: 'User already exists' });
    }
    const newUser = { ...req.body, pass: mockHash(req.body.pass) };
    data.users.push(newUser);
    saveData(data);
    res.json({ success: true });
});

// Student Login
app.post('/api/students/login', (req, res) => {
    const data = getData();
    const user = data.users.find(u => u.email === req.body.email && u.pass === mockHash(req.body.pass));
    if (user) {
        res.json({ success: true, user: { name: user.name, email: user.email } });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Applications
app.post('/api/applications', (req, res) => {
    const data = getData();
    const app = { ...req.body, id: 'NGU-APP-' + Math.floor(Math.random() * 10000), date: new Date().toISOString() };
    data.applications.push(app);
    saveData(data);
    res.json({ success: true, reference: app.id });
});

app.get('/api/applications', (req, res) => {
    res.json(getData().applications);
});

// Reviews
app.get('/api/reviews', (req, res) => {
    res.json(getData().reviews);
});

app.post('/api/reviews', (req, res) => {
    const data = getData();
    data.reviews.push({ ...req.body, date: new Date().toLocaleString() });
    saveData(data);
    res.json({ success: true });
});

// Lecturer PINS
app.get('/api/lecturers/pins/:name', (req, res) => {
    const data = getData();
    res.json({ pin: data.lec_pins[req.params.name] || null });
});

app.post('/api/lecturers/pins', (req, res) => {
    const data = getData();
    data.lec_pins[req.body.name] = mockHash(req.body.pin);
    saveData(data);
    res.json({ success: true });
});

// Lecturer Login (PIN check)
app.post('/api/lecturers/login', (req, res) => {
    const data = getData();
    if (data.lec_pins[req.body.name] === mockHash(req.body.pin)) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false });
    }
});

// Academic Data (Deterministic)
app.get('/api/academic-data', (req, res) => {
    const data = getData();
    if (data.lecturers_data) return res.json(data.lecturers_data);

    // Generate Deterministic Data
    const pool = ["Dr. Matin", "Prof. Kwesi", "Dr. Owili", "Prof. Njeri", "Dr. Rodriguez", "Dr. Sang", "Prof. Okello", "Dr. Amina", "Dr. Mutua", "Prof. Zhao"];
    const units = ["Intro to Computing", "Discrete Math", "Software Design", "Data Structures", "Network Security", "AI Principles"];

    const academic = {};
    for(let y=1; y<=4; y++) {
        academic[y] = { "Sem 1": [], "Sem 2": [] };
        ["Sem 1", "Sem 2"].forEach(s => {
            units.forEach((unit, idx) => {
                academic[y][s].push({
                    s: unit,
                    l: pool[(idx + y + (s === "Sem 2" ? 1 : 0)) % pool.length]
                });
            });
        });
    }
    data.lecturers_data = academic;
    saveData(data);
    res.json(academic);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
