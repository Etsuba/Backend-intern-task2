const jwt = require('jsonwebtoken');
const JWT_SECRET = "internship_secret_key_123"; // In real life, put this in .env

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: "No token provided" });

    try {
        const decoded = jwt.verify(token.split(" ")[1], JWT_SECRET);
        req.user = decoded; // Adds user info (id and role) to the request
        next();
    } catch (err) {
        res.status(401).json({ error: "Invalid Token" });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Requires Admin Role" });
    }
    next();
};

module.exports = { verifyToken, isAdmin };