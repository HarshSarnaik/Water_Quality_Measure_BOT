// ================= STATE =================
let lastData = {
    lat: "--",
    lon: "--",
    ph: "--",
    turbidity: "--",
    region: "Unknown"
};

// ================= MAP =================
const map = L.map('map').setView([21.14, 79.08], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
let marker = L.marker([21.14, 79.08]).addTo(map);

// ================= CHART =================
const chart = new Chart(document.getElementById("chart"), {
    type: "line",
    data: {
        labels: [],
        datasets: [
            { label: "pH", data: [], borderColor: "#00d4ff" },
            { label: "Turbidity", data: [], borderColor: "#ff3b3b" }
        ]
    },
    options: { maintainAspectRatio: false, animation: false }
});

// ================= ALERT =================
function alertCheck(ph, turbidity, region) {
    const box = document.getElementById("alertsBox");

    if (ph < 6.5 || ph > 8.5 || turbidity > 5) {
        box.innerText = `⚠ ${region} is IMPURE`;
        box.style.color = "red";
    } else {
        box.innerText = "All regions normal";
        box.style.color = "#22c55e";
    }
}

// ================= LOG =================
function addLog(text) {
    const logBox = document.getElementById("logBox");

    const entry = document.createElement("div");
    entry.innerText = text;

    logBox.prepend(entry);

    if (logBox.childNodes.length > 50) {
        logBox.removeChild(logBox.lastChild);
    }
}

// ================= FETCH DATA =================
async function fetchData() {
    try {
        const res = await fetch("/latest");
        const data = await res.json();

        if (!data.lat) return;

        lastData = data;

        document.getElementById("lat").innerText = data.lat;
        document.getElementById("lon").innerText = data.lon;
        document.getElementById("ph").innerText = data.ph;
        document.getElementById("turbidity").innerText = data.turbidity;

        marker.setLatLng([data.lat, data.lon]);
        map.setView([data.lat, data.lon]);

        chart.data.labels.push(new Date().toLocaleTimeString());
        chart.data.datasets[0].data.push(data.ph);
        chart.data.datasets[1].data.push(data.turbidity);

        if (chart.data.labels.length > 20) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
            chart.data.datasets[1].data.shift();
        }

        chart.update();

        alertCheck(data.ph, data.turbidity, data.region);
        addLog(`${data.region} | pH:${data.ph} | Turb:${data.turbidity}`);

    } catch (err) {
        console.log("Fetch error:", err);
    }
}

// ================= JOYSTICK (ANIMATED PRO) =================
const stick = document.getElementById("stick");
const joy = document.querySelector(".joy");

let active = false;
let target = { x: 0, y: 0 };   // where user wants
let current = { x: 0, y: 0 };  // animated position

const max = 40;

// START
joy.addEventListener("mousedown", () => active = true);

// STOP (smooth return, not instant)
document.addEventListener("mouseup", () => {
    active = false;
    target = { x: 0, y: 0 };
});

// MOVE TARGET (not stick directly)
document.addEventListener("mousemove", e => {
    if (!active) return;

    const rect = joy.getBoundingClientRect();

    let x = e.clientX - rect.left - rect.width / 2;
    let y = e.clientY - rect.top - rect.height / 2;

    x = Math.max(-max, Math.min(max, x));
    y = Math.max(-max, Math.min(max, y));

    target = { x, y };
});

// 🔥 SMOOTH ANIMATION LOOP (60 FPS)
function animateJoystick() {
    // easing (spring-like)
    current.x += (target.x - current.x) * 0.15;
    current.y += (target.y - current.y) * 0.15;

    // apply transform
    stick.style.transform = `translate(${current.x}px, ${current.y}px)`;

    // 🔥 dynamic glow based on distance
    const intensity = Math.sqrt(current.x**2 + current.y**2);
    stick.style.boxShadow = `
        0 0 ${10 + intensity}px #00d4ff,
        inset 0 0 10px #fff
    `;

    requestAnimationFrame(animateJoystick);
}

animateJoystick();

// ================= SEND JOYSTICK TO SERVER =================
setInterval(() => {
    fetch("/control", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            x: Number((current.x / max).toFixed(2)),
            y: Number((current.y / max).toFixed(2))
        })
    });
}, 100); // 10 times/sec

// 🔥 POLL EVERY 2 SEC
setInterval(fetchData, 2000);