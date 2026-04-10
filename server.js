const express = require("express");
const fs = require("fs");
const XLSX = require("xlsx");
const dayjs = require("dayjs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

// ================= STORAGE =================
let latestData = null;
let latestControl = { x: 0, y: 0 };

// ================= EXCEL =================
const folder = "./data";
if (!fs.existsSync(folder)) fs.mkdirSync(folder);

function getFileName() {
    return `${folder}/${dayjs().format("YYYY-MM-DD")}.xlsx`;
}

function saveToExcel(data) {
    const file = getFileName();

    let workbook;
    let sheet;

    if (fs.existsSync(file)) {
        workbook = XLSX.readFile(file);
        sheet = workbook.Sheets["Sheet1"];
    } else {
        workbook = XLSX.utils.book_new();
        sheet = XLSX.utils.json_to_sheet([]);
        XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
    }

    const jsonData = XLSX.utils.sheet_to_json(sheet);

    jsonData.push({
        time: new Date().toLocaleString(),
        lat: data.lat,
        lon: data.lon,
        ph: data.ph,
        turbidity: data.turbidity,
        region: data.region
    });

    const newSheet = XLSX.utils.json_to_sheet(jsonData);
    workbook.Sheets["Sheet1"] = newSheet;

    XLSX.writeFile(workbook, file);
}

// ================= ROUTES =================

// RECEIVE SENSOR DATA
app.post("/data", (req, res) => {
    const data = req.body;

    console.log("DATA RECEIVED:", data);

    latestData = data;

    saveToExcel(data);
    fs.appendFileSync("logs.txt", JSON.stringify(data) + "\n");

    res.send("OK");
});

// SEND DATA TO DASHBOARD
app.get("/latest", (req, res) => {
    res.json(latestData || {});
});

// RECEIVE JOYSTICK
app.post("/control", (req, res) => {
    latestControl = req.body;
    console.log("CONTROL RECEIVED:", latestControl);
    res.send("OK");
});

// SEND CONTROL TO ESP32
app.get("/control", (req, res) => {
    res.json(latestControl);
});

// LOGS
app.get("/logs", (req, res) => {
    res.sendFile(path.join(__dirname, "logs.txt"));
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
