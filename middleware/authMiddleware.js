const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "f82106d889b7e9d5c89c31a978c1d567";

exports.authMiddleware = (req, res, next) => {
    try {
        const token = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            console.log("❌ No token provided. Redirecting...");
            return res.status(401).json({ success: false, message: "Access Denied. Please log in again." });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.log("❌ Token verification failed:", error.message);
        return res.status(403).json({ success: false, message: "Invalid token. Please log in again." });
    }
};