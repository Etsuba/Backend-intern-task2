const mongoose = require('mongoose');

// 1. User Model
const userSchema = new mongoose.Schema({
    name: {type:"String", required:[true, "name is required"]},
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
});

// 2. Event Model
const eventSchema = new mongoose.Schema({
    title: String,
    date: String,
    description: String,
    location: String
});

// 3. Registration Model (The Link)
const registrationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    registrationDate: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Event = mongoose.model('Event', eventSchema);
const Registration = mongoose.model('Registration', registrationSchema);

module.exports = { User, Event, Registration };