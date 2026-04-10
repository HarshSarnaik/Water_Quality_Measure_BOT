const express = require("express");
const path = require("path");

const app = express();

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ SERVE FRONTEND PROPERLY
app.use(express.static(path.join(__dirname)));

// ================= IN-MEMORY STORAGE =================
let latestData = null;
let latestControl = { x: 0, y: 0 };

// ================= ROUTES =================

// 🔥 HEALTH CHECK (Render needs this stable)
app.get("/health", (req, res) => {
    res.status(200).send("OK");
});

// 🔥 ROOT (force index.html)
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// ================= SENSOR DATA =================

// RECEIVE DATA FROM ESP32
app.post("/data", (req, res) => {
    try {
        latestData = req.body;
        console.log("📡 DATA:", latestData);
        res.status(200).send("OK");
    } catch (err) {
        console.error(err);
        res.status(500).send("ERROR");
    }
});

// SEND DATA TO DASHBOARD
app.get("/latest", (req, res) => {
    res.json(latestData || {});
});

// ================= JOYSTICK =================

// RECEIVE CONTROL
app.post("/control", (req, res) => {
    try {
        latestControl = req.body;
        console.log("🎮 CONTROL:", latestControl);
        res.status(200).send("OK");
    } catch (err) {
        console.error(err);
        res.status(500).send("ERROR");
    }
});

// SEND CONTROL TO ESP32
app.get("/control", (req, res) => {
    res.json(latestControl);
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
