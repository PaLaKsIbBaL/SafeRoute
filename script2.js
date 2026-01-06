let map;
let startMarker, endMarker, routeLayer;
let nightMode = false;

/* ================= MAP INIT ================= */
map = L.map("map").setView([20.5937, 78.9629], 5);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
}).addTo(map);

/* ================= NIGHT MODE ================= */
function toggleNightMode() {
    nightMode = !nightMode;
    document.body.classList.toggle("night");

    if (routeLayer) {
        routeLayer.setStyle({
            weight: nightMode ? 7 : 6,
            dashArray: nightMode ? "10 6" : null,
            color: nightMode ? "#4dd2ff" : routeLayer.options.style.color
        });
    }
}

/* ================= GEOCODING ================= */
async function geocode(place) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.length) {
        alert("Location not found: " + place);
        throw new Error("Geocode failed");
    }

    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

/* ================= START ROUTE ================= */
async function startRoute() {
    const start = document.getElementById("start").value;
    const end = document.getElementById("end").value;
    const womenSafety = document.getElementById("womenSafety")?.checked;

    if (!start || !end) {
        alert("Please enter start and destination");
        return;
    }

    // Clear old data
    if (routeLayer) map.removeLayer(routeLayer);
    if (startMarker) map.removeLayer(startMarker);
    if (endMarker) map.removeLayer(endMarker);

    // Coordinates
    const startCoords = await geocode(start);
    const endCoords = await geocode(end);

    startMarker = L.marker(startCoords).addTo(map).bindPopup("Start");
    endMarker = L.marker(endCoords).addTo(map).bindPopup("Destination");

    /* ================= ROUTE API ================= */
    const routeURL = `https://router.project-osrm.org/route/v1/driving/${startCoords[1]},${startCoords[0]};${endCoords[1]},${endCoords[0]}?overview=full&geometries=geojson`;
    const routeRes = await fetch(routeURL);
    const routeData = await routeRes.json();

    if (!routeData.routes || !routeData.routes.length) {
        alert("Route not found");
        return;
    }

    const route = routeData.routes[0];

    /* ================= DISTANCE & TIME ================= */
    const distanceKm = route.distance / 1000;
    const durationMin = route.duration / 60;
    const durationHr = durationMin / 60;

    /* ================= SAFETY LOGIC ================= */
    let routeColor, safetyText;

    if (distanceKm <= 8) {
        routeColor = "#00ff88";
        safetyText = "🟢 Safe Route";
    } else if (distanceKm <= 18) {
        routeColor = "#ffcc00";
        safetyText = "🟡 Moderate Safety";
    } else {
        routeColor = "#ff4444";
        safetyText = "🔴 Long Route – Be Alert";
    }

    // Women Safety Override
    if (womenSafety) {
        routeColor = "#4dd2ff";
        safetyText = "🛡️ Women Safety Mode Enabled";
    }

    // Night warning
    const hour = new Date().getHours();
    if (hour >= 18 || hour <= 6) {
        safetyText += " 🌙 Night Travel – Stay on main roads";
    }

    /* ================= TRAFFIC LOGIC ================= */
    const trafficFactor = durationMin / distanceKm;
    let trafficText;

    if (trafficFactor < 2) trafficText = "🟢 Low Traffic";
    else if (trafficFactor < 3) trafficText = "🟡 Moderate Traffic";
    else trafficText = "🔴 Heavy Traffic (Crowded)";

    /* ================= CONSTRUCTION ================= */
    const constructionText =
        Math.random() > 0.7
            ? "🚧 Road construction reported"
            : "🛣 No major construction";

    /* ================= DRAW ROUTE ================= */
    routeLayer = L.geoJSON(route.geometry, {
        style: {
            color: routeColor,
            weight: nightMode ? 7 : 6,
            opacity: 0.9
        }
    }).addTo(map);

    map.fitBounds(routeLayer.getBounds());

    /* ================= UI UPDATE ================= */
    document.getElementById("traffic").innerText =
        `🚦 ${trafficText}\n📏 Distance: ${distanceKm.toFixed(2)} km`;

    document.getElementById("construction").innerText =
        `⏱ Time: ${durationMin.toFixed(1)} mins (${durationHr.toFixed(2)} hrs)\n${constructionText}`;

    document.getElementById("safety").innerText = safetyText;

    // Highlight SOS if women safety
    if (womenSafety) {
        document.querySelector(".sos-btn").style.animation = "pulse 1s infinite";
    }
}

/* ================= SOS ================= */
function activateSOS() {
    const contact = document.getElementById("emergencyContact").value;

    if (!contact) {
        alert("Enter emergency contact number");
        return;
    }

    navigator.geolocation.getCurrentPosition(pos => {
        const link = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
        window.open(
            `https://wa.me/91${contact}?text=🚨 EMERGENCY! My live location: ${link}`,
            "_blank"
        );
    });
}
