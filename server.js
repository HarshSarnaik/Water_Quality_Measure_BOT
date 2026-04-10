const express = require("express");
const path = require("path");

const app = express();

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.static(__dirname));

// ================= IN-MEMORY STORAGE =================
let latestData = null;
let latestControl = { x: 0, y: 0 };

app.use(express.urlencoded({ extended: true }));
// ================= ROUTES =================

// 🔥 ROOT (to check if server is alive)
app.get("/", (req, res) => {
    res.send("🚀 Water Quality Server Running");
});

// ================= SENSOR DATA =================

// RECEIVE DATA FROM ESP32
app.post("/data", (req, res) => {
    const data = req.body;

    console.log("📡 DATA RECEIVED:", data);

    latestData = data;

    res.status(200).send("OK");
});

// SEND DATA TO DASHBOARD
app.get("/latest", (req, res) => {
    res.json(latestData || {});
});

// ================= JOYSTICK CONTROL =================

// RECEIVE FROM DASHBOARD
app.post("/control", (req, res) => {
    latestControl = req.body;

    console.log("🎮 CONTROL RECEIVED:", latestControl);

    res.status(200).send("OK");
});

// SEND TO ESP32
app.get("/control", (req, res) => {
    res.json(latestControl);
});

// ================= HEALTH CHECK =================
app.get("/health", (req, res) => {
    res.json({ status: "OK" });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
