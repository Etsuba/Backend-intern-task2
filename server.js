const express = require('express');
const mongoose = require('mongoose');
const { User, Event, Registration } = require('./models');

const app = express();
app.use(express.json());

// Replace 'your_mongodb_uri' with your actual MongoDB connection string
// (You can get a free one from MongoDB Atlas or use 'mongodb://localhost:27017/eventDB')
// --- USER ROUTES ---

// Create a new User
app.post('/users', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.status(201).json(newUser);
    } catch (err) {
        res.status(400).json({ error: "Email already exists or invalid data" });
    }
});

// View all Users (handy for finding IDs)
app.get('/users', async (req, res) => {
    const users = await User.find();
    res.json(users);
});

mongoose.connect('mongodb://localhost:27017/eventDB')
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ Connection error", err));

// --- ROUTES ---

// 1. Create an Event (To seed your database)
app.post('/events', async (req, res) => {
    const newEvent = new Event(req.body);
    await newEvent.save();
    res.json(newEvent);
});

// 2. View all events
app.get('/events', async (req, res) => {
    const events = await Event.find();
    res.json(events);
});

// 3. Register for an Event
app.post('/register', async (req, res) => {
    const { userId, eventId } = req.body;
    const reg = new Registration({ user: userId, event: eventId });
    await reg.save();
    res.json({ message: "Registered successfully!", registrationId: reg._id });
});

// 4. View User Registrations (The "Linking" Part)
app.get('/my-registrations/:userId', async (req, res) => {
    // We populate both 'user' and 'event' to show the full link
    const myRegs = await Registration.find({ user: req.params.userId })
        .populate('user', 'name email') // Only show name and email, hide the rest
        .populate('event');
    res.json(myRegs);
});

// 5. Cancel Registration
app.delete('/cancel/:regId', async (req, res) => {
    await Registration.findByIdAndDelete(req.params.regId);
    res.json({ message: "Registration cancelled" });
});

// 6. View specific event details
app.get('/events/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ error: "Event not found" });
        res.json(event);
    } catch (err) {
        res.status(400).json({ error: "Invalid Event ID" });
    }
});

app.listen(3001, () => console.log('Server running on http://localhost:3001'));