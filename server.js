const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Event, Registration } = require('./model'); // Ensure this is named 'model.js'
const { verifyToken, isAdmin } = require('./middleware/auth.js');

const app = express();
app.use(express.json());

const JWT_SECRET = "internship_secret_key_123"; // Use a real secret in production!

// --- DATABASE CONNECTION ---
mongoose.connect('mongodb://localhost:27017/eventDB')
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ Connection error", err));

// --- AUTHENTICATION ROUTES ---

// 1. Signup (Updated to handle passwords)
app.post('/auth/signup', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        // Hash the password for security
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = new User({ 
            name, 
            email, 
            password: hashedPassword, 
            role: role || 'user' // Default to 'user' if not specified
        });

        await newUser.save();
        res.status(201).json({ message: "User created successfully!", userId: newUser._id });
    } catch (err) {
        res.status(400).json({ error: "Email already exists or invalid data" });
    }
});

// 2. Login (This provides the Token for Thunder Client)
app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Create the Token (The "ID Card")
        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            JWT_SECRET, 
            { expiresIn: '1h' }
        );

        res.json({ message: "Login successful", token, role: user.role });
    } catch (err) {
        res.status(500).json({ error: "Login failed" });
    }
});

// --- EVENT ROUTES ---

// 3. Create an Event (PROTECTED: Only Admins can create events)
app.post('/events', verifyToken, isAdmin, async (req, res) => {
    try {
        const newEvent = new Event(req.body);
        await newEvent.save();
        res.status(201).json(newEvent);
    } catch (err) {
        res.status(400).json({ error: "Could not create event" });
    }
});

// 4. View all events (PUBLIC: Anyone can see events)
app.get('/events', async (req, res) => {
    const events = await Event.find();
    res.json(events);
});

// 5. View specific event details (PUBLIC)
app.get('/events/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ error: "Event not found" });
        res.json(event);
    } catch (err) {
        res.status(400).json({ error: "Invalid Event ID" });
    }
});

// --- REGISTRATION ROUTES ---

// 6. Register for an Event (PROTECTED: Must be logged in)
app.post('/register', verifyToken, async (req, res) => {
    try {
        const { eventId } = req.body;
        // We get userId automatically from the token (req.user.id)
        const reg = new Registration({ user: req.user.id, event: eventId });
        await reg.save();
        res.json({ message: "Registered successfully!", registrationId: reg._id });
    } catch (err) {
        res.status(500).json({ error: "Registration failed" });
    }
});

// 7. View My Registrations (PROTECTED: Must be logged in)
app.get('/my-registrations', verifyToken, async (req, res) => {
    const myRegs = await Registration.find({ user: req.user.id })
        .populate('user', 'name email')
        .populate('event');
    res.json(myRegs);
});

// 8. Cancel Registration (PROTECTED)
app.delete('/cancel/:regId', verifyToken, async (req, res) => {
    try {
        await Registration.findByIdAndDelete(req.params.regId);
        res.json({ message: "Registration cancelled" });
    } catch (err) {
        res.status(400).json({ error: "Could not delete registration" });
    }
});

// --- SERVER START ---
app.listen(3001, () => console.log('🚀 Server running on http://localhost:3001'));