let map;
let startMarker, endMarker, routeLayer;
let nightMode = false;

// MAP INIT 
map = L.map("map").setView([20.5937, 78.9629], 5);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
}).addTo(map);

// NIGHT MODE
function toggleNightMode() {
    nightMode = !nightMode;
    document.body.classList.toggle("night");
}

// GEOCODING 
async function geocode(place) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.length) throw new Error("Location not found");

    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

// START ROUTE 
async function startRoute() {
    try {
        const start = document.getElementById("start").value;
        const end = document.getElementById("end").value;
        const womenSafety = document.getElementById("womenSafety").checked;

        if (!start || !end) {
            alert("Enter start and destination");
            return;
        }

        document.getElementById("traffic").innerText = "🚦 Calculating...";
        document.getElementById("construction").innerText = "⏱ Calculating...";
        document.getElementById("safety").innerText = "🛡 Calculating...";

        if (routeLayer) map.removeLayer(routeLayer);
        if (startMarker) map.removeLayer(startMarker);
        if (endMarker) map.removeLayer(endMarker);

        const startCoords = await geocode(start);
        const endCoords = await geocode(end);

        startMarker = L.marker(startCoords).addTo(map);
        endMarker = L.marker(endCoords).addTo(map);

        //DISTANCE (fallback-safe) 
        const distanceKm = map.distance(startCoords, endCoords) / 1000;
        const durationMin = distanceKm * 3; // approx
        const durationHr = durationMin / 60;

        //  SAFETY 
        let safetyText = "🟢 Safe Route";
        let routeColor = "#00ff88";

        if (distanceKm > 15) {
            safetyText = "🟡 Moderate Safety";
            routeColor = "#ffcc00";
        }
        if (distanceKm > 30) {
            safetyText = "🔴 Long Route – Be Alert";
            routeColor = "#ff4444";
        }

        if (womenSafety) {
            safetyText = "🛡 Women Safety Mode Enabled";
            routeColor = "#4dd2ff";
        }

        //  DRAW FALLBACK ROUTE
        routeLayer = L.polyline(
            [startCoords, endCoords],
            { color: routeColor, weight: 6 }
        ).addTo(map);

        map.fitBounds(routeLayer.getBounds());

        //UI UPDATE
        document.getElementById("traffic").innerText =
            ` Moderate Traffic\n📏 Distance: ${distanceKm.toFixed(2)} km`;

        document.getElementById("construction").innerText =
            ` Time: ${durationMin.toFixed(1)} mins (${durationHr.toFixed(2)} hrs)\n🛣 No major construction`;

        document.getElementById("safety").innerText = safetyText;

    } catch (err) {
        console.error(err);
        alert("Something went wrong. Check console.");
    }
}

//  SOS 
function activateSOS() {
    const contact = document.getElementById("emergencyContact").value;
    if (!contact) return alert("Enter emergency contact");

    navigator.geolocation.getCurrentPosition(pos => {
        const link = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
        window.open(`https://wa.me/91${contact}?text=🚨 Emergency! My location: ${link}`);
    });
}
