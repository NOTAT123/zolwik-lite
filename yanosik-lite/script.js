let userLat = 52.2298, userLon = 21.0118;  // Domyślna lokalizacja (Warszawa)
let userMarker = null;
let map = L.map('map', {
    maxZoom: 19,
    minZoom: 10
}).setView([userLat, userLon], 15);
let userCircle = null;
let userInnerCircle = null;
let scale = null;
const mapid = document.getElementById('map');
const sgps = document.getElementById("sgps");

// Kafelki OpenStreetMap
L.tileLayer('https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=IzCYP6AiqRhID02pU4kR', { //https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
    attribution: 'Dane mapy: &copy; autorzy <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; autorzy <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
}).addTo(map);

// Dodaj kontrolkę geokodera do mapy
L.Control.geocoder({
    defaultMarkGeocode: false
  })
    .on('markgeocode', function(e) {
      const bbox = e.geocode.bbox;
      const poly = L.polygon([
        bbox.getSouthEast(),
        bbox.getNorthEast(),
        bbox.getNorthWest(),
        bbox.getSouthWest()
      ]).addTo(map);
      map.fitBounds(poly.getBounds());
    })
    .addTo(map);

// Strzałka użytkownika
const arrowIcon = L.icon({
    iconUrl: './images/markericon.png',
    iconSize: [50, 50],
    iconAnchor: [15, 15]
});

navigator.geolocation.watchPosition(
    (pos) => {
        userLat = pos.coords.latitude;
        userLon = pos.coords.longitude;

        const userLatLng = [userLat, userLon];

        console.log("Aktualna pozycja użytkownika:", userLatLng); // Dodaj to

        if (!userInnerCircle) {
            // Rysujemy tylko małe, wyraźne kółko
            userInnerCircle = L.circle(userLatLng, {
                
                radius: 4, // Możesz tu zmienić wielkość kółka 🔧
                color: '#2A93EE',
                fillColor: '#2A93EE',
                fillOpacity: 0.5,
                weight: 1
            }).addTo(map);
        } else {
            userInnerCircle.setLatLng(userLatLng);
        }

        userInnerCircle.bindPopup('Twoja lokalizacja!');
        if (!scale) {
            scale = L.control.scale().addTo(map);
        }
        else {
        }
        // Aktualizujemy pozycję w widoku 3D
        update3DPosition();
        
        map.setView(userLatLng, map.getZoom());
        updateInfoBox();
    },

    (err) => {
        alert("Nie udało się uzyskać lokalizacji 😢");
        sgps.style.position = "fixed";
    },
    {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
    }
);

// Centrowanie mapy na użytkowniku
function centerMap() {
    map.setView([userLat, userLon], 19); // Ustaw zoom na 15
}

// Lektor – funkcja do odczytu komunikatów
function speak(text) {
    const synth = window.speechSynthesis;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "pl-PL";
    synth.cancel();  // Zatrzymuje poprzednie wypowiedzi
    synth.speak(utter);
}

// Funkcja zgłaszania zdarzenia przez użytkownika (np. fotoradar, kontrola drogowa itp.)
let cancelTimeout = null;
function report(type) {
    const cancelBtn = document.getElementById("cancelReportBtn");
    const messages = {
        fotoradar: "Fotoradar",
        kontrola: "Kontrola prędkości",
        roboty: "Prace drogowe",
        wypadek: "Wypadek",
        nieoznakowany: "Nieoznakowani"
    };

    const messageText = messages[type] || "🚨";

    const marker = L.marker([userLat, userLon]).addTo(map)
        .bindPopup(messageText).openPopup();

    speak(`Zgłoszono: ${messageText}`);

    let time = 5;
    cancelBtn.textContent = `❌ Anuluj zgłoszenie (${time}s)`;
    cancelBtn.style.display = "block";
    cancelBtn.style.cursor = "pointer";

    cancelTimeout = setInterval(() => {
        time--;
        if (time <= 0) {
            cancelBtn.style.display = "none";
            clearInterval(cancelTimeout);
        } else {
            cancelBtn.textContent = `❌ Anuluj zgłoszenie (${time}s)`;
        }
    }, 1000);

    cancelBtn.onclick = () => {
        speak("Anulowano zgłoszenie");
        map.removeLayer(marker);
        clearInterval(cancelTimeout);
        cancelBtn.style.display = "none";
    };

    // Dodaj obsługę kliknięcia na marker
    marker.on('click', () => {
        speak(messageText);
    });
}

// Rozwijanie menu zgłoszeń
document.getElementById("reportButton").onclick = () => {
    const menu = document.getElementById("reportMenu");
    menu.style.display = menu.style.display === "flex" ? "none" : "flex";
};

let markersCache = [];
let lastSpokenDistance = Infinity;

function fetchOverpassData() {
    const bounds = map.getBounds();
    const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
    const overpassUrl = `https://overpass-api.de/api/interpreter`;
    const query = `
    [out:json];
    (
      node["highway"="speed_camera"](${bbox});
      way["highway"="speed_camera"](${bbox});
      relation["highway"="speed_camera"](${bbox});
      node["enforcement"="mobile"](${bbox});
      way["enforcement"="mobile"](${bbox});
      relation["enforcement"="mobile"](${bbox});
      node["construction"="yes"](${bbox});
      way["construction"="yes"](${bbox});
      relation["construction"="yes"](${bbox});
    );
    out body;
    >;
    out skel qt;
    `;

    fetch(overpassUrl, {
        method: 'POST',
        body: query
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Błąd serwera: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        if (data && data.elements) {
            markersCache = []; // Wyczyść pamięć podręczną przed dodaniem nowych markerów
            data.elements.forEach(element => {
                const lat = element.lat || element.center.lat;
                const lon = element.lon || element.center.lon;
                const type = element.tags.highway || element.tags.enforcement || element.tags.construction;
                const comment = element.tags.note || "Zgłoszone przez: System (5/5)";
                const maxSpeed = element.tags["maxspeed"] || "?";

                const marker = L.marker([lat, lon]).addTo(map)
                    .bindPopup(`<strong>${getIconHtml(type)}:</strong><br>${comment}<br>Ograniczenie prędkości: ${maxSpeed}`)

                markersCache.push(marker);

                // Dodaj obsługę kliknięcia na marker
                marker.on('click', () => {
                    const popupContent = marker.getPopup().getContent();
                    const typeMatch = popupContent.match(/<strong>(.*?)<\/strong>/);
                    const speedMatch = popupContent.match(/Ograniczenie prędkości: (.*?)(<br>|$)/);
                    const type = typeMatch ? typeMatch[1] : "🚨";
                    const speed = speedMatch ? speedMatch[1] : "?";
                    const distance = Math.round(marker.getLatLng().distanceTo([userLat, userLon]));
                    if (maxSpeed == 50) {
                        speak(`${type}. ${distance} metrów. ograniczenie. pięćdziesiąt. kilometrów na godzinę.`);
                    }
                    else if (maxSpeed == 70) {
                        speak(`${type}. ${distance} metrów. ograniczenie. siedemdziesiąt. kilometrów na godzinę.`);
                    }
                    else if (maxspeed == 0) {
                        speak(`${type}. ${distance} metrów.`);
                    }
                    else {
                        speak(`${type}. ${distance} metrów. ograniczenie. ${speed}. kilometrów na godzinę.`);
                    }
                });
            });
            updateInfoBox(); // Aktualizuj pudełko informacyjne po dodaniu markerów
        } else {
            console.log("Brak zgłoszeń w tym obszarze.");
            updateInfoBox(); // Aktualizuj pudełko informacyjne nawet jeśli nie dodano żadnych markerów
        }
    })
    .catch(err => {
        console.error("Błąd pobierania danych z Overpass API:", err);
        // Użyj markerów z pamięci podręcznej, jeśli offline
        markersCache.forEach(marker => map.addLayer(marker));
        updateInfoBox(); // Aktualizuj pudełko informacyjne po dodaniu markerów z pamięci podręcznej
    });
}

function getIconHtml(type) {
    const icons = {
        "speed_camera": "Fotoradar",
        "mobile": "Kontrola prędkości",
        "yes": "Prace drogowe"
    };
    return icons[type] || "🚓";
}

function updateInfoBox() {
    const infoBox = document.getElementById("infoBox");
    const dangerIcon = document.getElementById("dangerIcon");
    const dangerDirection = document.getElementById("dangerDirection");
    const dangerDistance = document.getElementById("dangerDistance");
    const dangerSpeed = document.getElementById("dangerSpeed");
    const nextDanger = document.getElementById("nextDanger");

    let nearestDanger = null;
    let minDistance = Infinity;

    markersCache.forEach(marker => {
        const latlng = marker.getLatLng();
        const distance = latlng.distanceTo([userLat, userLon]);
        if (distance < minDistance) {
            minDistance = distance;
            nearestDanger = marker;
        }
    });

    if (nearestDanger) {
        const popupContent = nearestDanger.getPopup().getContent();
        const typeMatch = popupContent.match(/<strong>(.*?)<\/strong>/);
        const speedMatch = popupContent.match(/Ograniczenie prędkości: (.*?)(<br>|$)/);
        const ograniczenietxt = document.getElementById("ograniczenie");
        const type = typeMatch ? typeMatch[1] : "🚨";
        const speed = speedMatch ? speedMatch[1] : "?";
        const direction = getDirection(nearestDanger.getLatLng());
        ograniczenietxt.innerHTML = `${speed}`;
        dangerIcon.innerHTML = type;
        dangerDirection.innerHTML = direction;
        dangerDistance.innerHTML = `${Math.round(minDistance)}m`;
        dangerSpeed.innerHTML = `Ograniczenie prędkości: ${speed}`;
        nextDanger.innerHTML = `Następnie: ${type}`;

        // Odczytaj typ najbliższego zagrożenia tylko jeśli odległość jest mniejsza niż 500m
        if (minDistance < 500 && minDistance < lastSpokenDistance) {
            speak(`${type}. ${Math.round(minDistance)} metrów. ograniczenie. ${speed}. kilometrów na godzinę.`);
            lastSpokenDistance = minDistance;
        }

        // Dodaj obsługę kliknięcia na marker
        nearestDanger.on('click', () => {
            speak(`${type}. ${Math.round(minDistance)} metrów. ograniczenie. ${speed}. kilometrów na godzinę.`);
        });
    } else {
        dangerIcon.innerHTML = "⚠️";
        dangerDirection.innerHTML = "";
        dangerDistance.innerHTML = "";
        dangerSpeed.innerHTML = "";
        nextDanger.innerHTML = "Brak zagrożeń w pobliżu";
    }
}

function getDirection(latlng) {
    const userLatLng = L.latLng(userLat, userLon);
    const angle = userLatLng.bearingTo(latlng);
    if (angle >= 337.5 || angle < 22.5) return "⬆️";
    if (angle >= 22.5 && angle < 67.5) return "↗️";
    if (angle >= 67.5 && angle < 112.5) return "➡️";
    if (angle >= 112.5 && angle < 157.5) return "↘️";
    if (angle >= 157.5 && angle < 202.5) return "⬇️";
    if (angle >= 202.5 && angle < 247.5) return "↙️";
    if (angle >= 247.5 && angle < 292.5) return "⬅️";
    if (angle >= 292.5 && angle < 337.5) return "↖️";
    return "⬆️";
}

L.LatLng.prototype.bearingTo = function(other) {
    const lat1 = this.lat * Math.PI / 180;
    const lon1 = this.lng * Math.PI / 180;
    const lat2 = other.lat * Math.PI / 180;
    const lon2 = other.lng * Math.PI / 180;

    const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    const bearing = Math.atan2(y, x) * 180 / Math.PI;

    return (bearing + 360) % 360;
};

// Wywołanie funkcji przy załadowaniu mapy lub po jej zmianie
map.on('moveend', () => {
    fetchOverpassData();
});

// Początkowe pobranie danych
fetchOverpassData();

// 🔍 Zoomowanie
function zoomIn() {
    map.zoomIn();
}

function zoomOut() {
    map.zoomOut();
}

function likeBtn() {
    speak("Brak zgłoszeń do potwierdzenia!")
}

function dislikeBtn() {
    speak("Brak zgłoszeń do odwołania!")
}

// Funkcja do zamykania i otwierania infoBox
document.getElementById("minimizeInfoBox").addEventListener("click", () => {
    const infoBox = document.getElementById("infoBox");
    if (infoBox.classList.contains("collapsed")) {
        infoBox.classList.remove("collapsed");
    } else {
        infoBox.classList.add("collapsed");
    }
});

// Odczytaj typ najbliższego zagrożenia na początku
window.addEventListener('load', () => {
    setTimeout(updateInfoBox, 1000);
    setTimeout(() => {
        const nearestDanger = getNearestDanger();
        if (nearestDanger) {
            const type = nearestDanger.type;
            const distance = Math.round(nearestDanger.distance);
            const speed = nearestDanger.speed;
            speak(`${type}. ${distance} metrów. ograniczenie. ${speed}. kilometrów na godzinę`);
        }
    }, 5000); // Opóźnienie, aby upewnić się, że dane zostały załadowane
});

function getNearestDanger() {
    let nearestDanger = null;
    let minDistance = Infinity;

    markersCache.forEach(marker => {
        const latlng = marker.getLatLng();
        const distance = latlng.distanceTo([userLat, userLon]);
        if (distance < minDistance) {
            minDistance = distance;
            nearestDanger = {
                type: getIconHtml(marker.getPopup().getContent().match(/<strong>(.*?)<\/strong>/)[1].toLowerCase().replace(/ /g, "_")),
                distance: minDistance,
                speed: marker.getPopup().getContent().match(/Ograniczenie prędkości: (.*?)(<br>|$)/)[1]
            };
        }
    });

    return nearestDanger;
}

// Funkcja nawigacji do celu
function navigateToDestination() {
    const destinationInput = document.getElementById("destinationInput").value;
    if (destinationInput) {
        const geocoderUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destinationInput)}&format=json`;
        fetch(geocoderUrl)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    const destination = data[0];
                    const destLatLng = L.latLng(destination.lat, destination.lon);
                    map.flyTo(destLatLng, 15);

                    const routingControl = L.Routing.control({
                        waypoints: [
                            L.latLng(userLat, userLon),
                            destLatLng
                        ],
                        routeWhileDragging: true,
                        createMarker: function() { return null; }, // Ukryj domyślne markery
                        show: false // Ukryj okienko OSM
                    }).on('routesfound', function(e) {
                        const routes = e.routes;
                        const summary = routes[0].summary;
                        const instructions = routes[0].instructions;

                        // Logowanie instrukcji
                        console.log("Instrukcje:", instructions);

                        // Pokaż zielony kwadracik z następnym krokiem
                        document.getElementById("nextStepBox").style.display = "block";
                        updateNextStep(instructions[0]);

                        // Pokaż informacje o trasie
                        document.getElementById("routeInfoBox").style.display = "block";
                        document.getElementById("routeDistance").innerHTML = `Odległość: ${summary.totalDistance} m`;
                        document.getElementById("routeTime").innerHTML = `Czas: ${Math.round(summary.totalTime / 60)} min`;

                        // Dodaj obsługę lektora
                        let nextInstructionIndex = 0;
                        let lastSpokenDistance = Infinity;

                        function checkDistanceAndSpeak() {
                            const userLatLng = L.latLng(userLat, userLon);
                            const nextInstruction = instructions[nextInstructionIndex];

                            if (nextInstruction && nextInstruction.latLng) {
                                const distanceToNextInstruction = userLatLng.distanceTo(L.latLng(nextInstruction.latLng.lat, nextInstruction.latLng.lng));

                                if (distanceToNextInstruction < 500 && distanceToNextInstruction < lastSpokenDistance) {
                                    speak(`Za ${Math.round(distanceToNextInstruction)} metrów, ${nextInstruction.text}`);
                                    lastSpokenDistance = distanceToNextInstruction;
                                }

                                if (distanceToNextInstruction < 150) {
                                    nextInstructionIndex++;
                                    if (nextInstructionIndex < instructions.length) {
                                        updateNextStep(instructions[nextInstructionIndex]);
                                    }
                                    lastSpokenDistance = Infinity;
                                }
                            } else {
                                console.error("Brak danych latLng dla instrukcji:", nextInstruction);
                            }
                        }

                        // Sprawdzaj odległość co 5 sekund
                        setInterval(checkDistanceAndSpeak, 5000);

                        // Obsługa zakończenia trasy
                        document.getElementById("endRouteButton").onclick = function() {
                            document.getElementById("nextStepBox").style.display = "none";
                            document.getElementById("routeInfoBox").style.display = "none";
                            map.eachLayer(function(layer) {
                                if (layer instanceof L.Routing.Line) {
                                    map.removeLayer(layer);
                                }
                            });
                        };
                    }).addTo(map);
                } else {
                    alert("Nie znaleziono lokalizacji.");
                }
            })
            .catch(err => {
                console.error("Błąd pobierania danych z Nominatim:", err);
            });
    }
}


function updateNextStep(instruction) {
    console.log("Aktualizacja następnego kroku:", instruction);
    const nextStepIcon = document.getElementById("nextStepIcon");
    const nextStepDistance = document.getElementById("nextStepDistance");
    const nextStepDirection = document.getElementById("nextStepDirection");
    const nextStepStreet = document.getElementById("nextStepStreet");

    const directionIcon = getDirectionIcon(instruction.text);
    nextStepIcon.innerHTML = directionIcon;
    nextStepDistance.innerHTML = `${Math.round(instruction.distance)}m`;

    let nextDirectionText = "Później: ";
    if (instruction.text.includes("na rondzie")) {
        const exitMatch = instruction.text.match(/na rondzie (\d+) zjazd/);
        if (exitMatch) {
            nextDirectionText += `⭕ ${exitMatch[1]} zjazd`;
        } else {
            nextDirectionText += "⭕";
        }
    } else {
        nextDirectionText += getNextDirectionIcon(instruction.text);
    }
    nextStepDirection.innerHTML = nextDirectionText;

    // Wyświetl nazwę ulicy, jeśli jest dostępna
    if (instruction.road) {
        nextStepStreet.innerHTML = `Ulica: ${instruction.road}`;
        nextStepStreet.style.display = "block";
    } else {
        nextStepStreet.style.display = "none";
    }
}




function getDirectionIcon(text) {
    if (text.includes("skręć w prawo")) return "➡️";
    if (text.includes("skręć w lewo")) return "⬅️";
    if (text.includes("jedź prosto")) return "⬆️";
    if (text.includes("na rondzie")) {
        const exitMatch = text.match(/na rondzie (\d+) zjazd/);
        if (exitMatch) {
            const exitNumber = exitMatch[1];
            return `⭕ ${exitNumber}`;
        }
        return "⭕";
    }
    if (text.includes("zawróć")) return "↺";
    return "?";
}

function getNextDirectionIcon(text) {
    if (text.includes("skręć w prawo")) return "➡️";
    if (text.includes("skręć w lewo")) return "⬅️";
    if (text.includes("jedź prosto")) return "⬆️";
    if (text.includes("na rondzie")) {
        const exitMatch = text.match(/na rondzie (\d+) zjazd/);
        if (exitMatch) {
            const exitNumber = exitMatch[1];
            return `⭕ ${exitNumber}`;
        }
        return "⭕";
    }
    if (text.includes("zawróć")) return "↺";
    return "?";
}



// Funkcja do przełączania trybu ciemnego
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

// Funkcja do przełączania widoku 2.5D
function toggle3dBuildings() {
    const is3dBuildingsEnabled = document.getElementById('3dBuildingsToggle').checked;

    if (is3dBuildingsEnabled) {
        try {
            // Remove existing map layers
            map.eachLayer((layer) => {
                if (layer instanceof L.TileLayer) {
                    map.removeLayer(layer);
                }
            });

            // Add new map layer
            L.tileLayer('https://tile-a.openstreetmap.fr/hot/{z}/{x}/{y}.png', { //https://tile-a.openstreetmap.fr/hot/{z}/{x}/{y}.png
                attribution: 'Dane mapy: &copy; autorzy <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; autorzy <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
               // noWrap: true // Prevent tile wrapping
            }).addTo(map);

            // Initialize OSMBuildings with API key
            if (!window.osmb) {
                window.osmb = new OSMBuildings(map).load('https://{s}.data.osmbuildings.org/0.2/59fcc2e8/tile/{z}/{x}/{y}.json');
            }

            // Set map view
            map.setView([userLat, userLon], 19);
            // Add map tilt effect using CSS
            document.getElementById('map').style.transform = 'perspective(1000px) rotateX(25deg)';
            document.getElementById('map').style.transition = 'transform 0.5s ease';

            // Adjust styles for better readability in tilted view
            document.getElementById('map').style.height = '100vh';
            document.getElementById('map').style.marginTop = '-0vh';

            // Set 3D parameters for OSMBuildings
            if (window.osmb) {
                window.osmb.setPosition({latitude: userLat, longitude: userLon});
                window.osmb.setZoom(17);
                window.osmb.setTilt(45); // Tilt angle
                window.osmb.setRotation(15); // Rotation
            }

            speak("Włączono widok trójwymiarowy");
            console.log("Widok 3D włączony");
        } catch (error) {
            console.error("Błąd podczas włączania widoku 3D:", error);
            document.getElementById('3dBuildingsToggle').checked = false;
            restoreDefaultView();
        }
    } else {
        restoreDefaultView();
    }
}

// Function to restore default view
function restoreDefaultView() {
    window.osmb = new OSMBuildings(map).load('https://osm.org/');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Dane mapy: &copy; autorzy <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; autorzy <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
    }).addTo(map);
    mapid.transform = "none";
    mapid.marginTop = "0";
    
    /*try {
        // Disable 3D view
        if (window.osmb) {
            window.osmb.destroy();
            window.osmb = null;
        }

        // Remove tilt effect
        document.getElementById('map').style.transform = 'none';
        document.getElementById('map').style.height = '100vh';
        document.getElementById('map').style.marginTop = '0';

        // Remove all layers
        map.eachLayer((layer) => {
            map.removeLayer(layer);
        });

        // Add standard map layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'Map data &copy; OpenStreetMap contributors',
            maxZoom: 19,
            noWrap: true // Prevent tile wrapping
        }).addTo(map);

        // Restore normal view
        map.setView([userLat, userLon], 15);
        speak("Wyłączono widok trójwymiarowy");
        console.log("Widok 3D wyłączony");
    } catch (error) {
        console.error("Błąd podczas wyłączania widoku 3D:", error);
    } */
   
}

f

// Funkcja do aktualizacji pozycji w widoku 3D
function update3DPosition() {
    if (window.osmb) {
        try {
            window.osmb.setPosition({latitude: userLat, longitude: userLon});
        } catch (error) {
            console.error("Błąd podczas aktualizacji pozycji 3D:", error);
        }
    }
}

// Funkcja do otwierania modala z ustawieniami
function openSettings() {
    document.getElementById('settings-section').classList.add('active');
    document.getElementById('settingsModal').style.display = 'block';
}

// Funkcja do zamykania modala z ustawieniami
function closeSettings() {
    document.getElementById('settings-section').classList.remove('active');
    document.getElementById('settingsModal').style.display = 'none';
}


function toggle3dView() {
       document.getElementById('map').style.transform = 'perspective(1000px) rotateX(25deg)';
       document.getElementById('map').style.transition = 'transform 0.5s ease';

        // Adjust styles for better readability in tilted view
        document.getElementById('map').style.height = '100vh';
        document.getElementById('map').style.marginTop = '-0vh';
    
}

