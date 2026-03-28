


class CampusNavigator {
    constructor() {
        this.map = null;
        this.routeLayer = null;
        this.markersLayer = null;
        this.geojsonLayer = null;
        this.locations = [];
        this.currentRoute = null;
        this.computeTime = 0;
        this.init();
    }

    async init() {
        try {
            console.log(' Initializing DTU Campus Navigator...');
            this.initMap();
            await this.loadLocations();
            await this.loadGeoJSON();
            this.setupEventListeners();
            console.log(' Application initialized successfully');
            this.showToast('Welcome to DTU Campus Navigator!', 'success');
        } catch (error) {
            console.error(' Initialization error:', error);
            this.showToast('Failed to initialize application. Please refresh.', 'error');
        }
    }

    initMap() {
        console.log('🗺️ Initializing map...');
        this.map = L.map('map').setView(CONFIG.MAP.CENTER, CONFIG.MAP.ZOOM);
        L.tileLayer(CONFIG.MAP.TILE_URL, {
            attribution: CONFIG.MAP.ATTRIBUTION,
            maxZoom: CONFIG.MAP.MAX_ZOOM,
            minZoom: CONFIG.MAP.MIN_ZOOM
        }).addTo(this.map);
        this.routeLayer = L.layerGroup().addTo(this.map);
        this.markersLayer = L.layerGroup().addTo(this.map);
        this.geojsonLayer = L.layerGroup().addTo(this.map);
        console.log(' Map initialized');
    }

    async loadLocations() {
        try {
            console.log(' Loading locations...');
            this.locations = await api.getLocations();
            const startSelect = document.getElementById('start-location');
            const endSelect = document.getElementById('end-location');
            startSelect.innerHTML = '<option value="">-- Select Start --</option>';
            endSelect.innerHTML = '<option value="">-- Select End --</option>';
            this.locations.forEach(loc => {
                const option1 = new Option(loc.name, loc.id);
                const option2 = new Option(loc.name, loc.id);
                startSelect.add(option1);
                endSelect.add(option2);
            });
            document.getElementById('location-count').textContent = this.locations.length;
            console.log(` Loaded ${this.locations.length} locations`);
        } catch (error) {
            console.error('Failed to load locations:', error);
            this.showToast('Failed to load locations', 'error');
            throw error;
        }
    }

    async loadGeoJSON() {
        try {
            console.log(' Loading GeoJSON...');
            const geojson = await api.getGeoJSON();
            L.geoJSON(geojson, {
                pointToLayer: (feature, latlng) => {
                    const isBuilding = feature.properties.name && feature.properties.name !== '';
                    const style = isBuilding ? CONFIG.MARKERS.POI : CONFIG.MARKERS.PATH_NODE;
                    return L.circleMarker(latlng, style).bindPopup(
                        this.createPopupContent(feature)
                    );
                },
                style: (feature) => {
                    if (feature.geometry.type === 'LineString') {
                        return CONFIG.PATH;
                    }
                }
            }).addTo(this.geojsonLayer);
            console.log(' GeoJSON loaded');
        } catch (error) {
            console.error(' Failed to load GeoJSON:', error);
            this.showToast('Failed to load map data', 'error');
        }
    }

    createPopupContent(feature) {
        const props = feature.properties;
        let content = `<div style="min-width: 150px;">`;
        if (props.name) {
            content += `<h3 style="margin: 0 0 8px 0; color: #667eea; font-size: 1.1rem;">${props.name}</h3>`;
        }
        if (props.description) {
            content += `<p style="margin: 0; font-size: 0.9rem; color: #718096;">${props.description}</p>`;
        }
        if (props.type) {
            content += `<p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #a0aec0;">
                <strong>Type:</strong> ${props.type}
            </p>`;
        }
        content += `</div>`;
        return content;
    }

    setupEventListeners() {
        document.getElementById('algorithm-select').addEventListener('change', (e) => {
            this.handleAlgorithmChange(e.target.value);
        });
        document.getElementById('add-stop-btn').addEventListener('click', () => {
            this.addStopDropdown();
        });
        document.getElementById('find-route-btn').addEventListener('click', () => {
            this.findRoute();
        });
        document.getElementById('clear-route-btn').addEventListener('click', () => {
            this.clearRoute();
        });
        document.getElementById('reset-view-btn').addEventListener('click', () => {
            this.map.setView(CONFIG.MAP.CENTER, CONFIG.MAP.ZOOM);
        });
        document.getElementById('share-route-btn').addEventListener('click', () => {
            this.generateShareLink();
        });
    }

    handleAlgorithmChange(algorithm) {
        const section = document.getElementById('multistop-section');
        const hint = document.getElementById('algo-hint');
        section.style.display = algorithm === 'multistop' ? 'block' : 'none';
        const algoInfo = CONFIG.ALGORITHMS[algorithm];
        if (algoInfo) {
            hint.textContent = algoInfo.hint;
        }
    }

    addStopDropdown() {
        const container = document.getElementById('stops-container');
        const stopDiv = document.createElement('div');
        stopDiv.className = 'stop-item';
        const select = document.createElement('select');
        select.className = 'form-control';
        select.innerHTML = '<option value="">-- Select Stop --</option>';
        this.locations.forEach(loc => {
            select.add(new Option(loc.name, loc.id));
        });
        const removeBtn = document.createElement('button');
        removeBtn.className = 'stop-remove';
        removeBtn.innerHTML = '×';
        removeBtn.title = 'Remove stop';
        removeBtn.onclick = () => stopDiv.remove();
        stopDiv.appendChild(select);
        stopDiv.appendChild(removeBtn);
        container.appendChild(stopDiv);
    }

    async findRoute() {
        const start = parseInt(document.getElementById('start-location').value);
        const end = parseInt(document.getElementById('end-location').value);
        const algorithm = document.getElementById('algorithm-select').value;
        if (isNaN(start) || isNaN(end)) {
            this.showToast('Please select both start and end locations', 'error');
            return;
        }
        if (start === end) {
            this.showToast('Start and end locations must be different', 'error');
            return;
        }
        const intermediateStops = [];
        if (algorithm === 'multistop') {
            const stopSelects = document.querySelectorAll('#stops-container select');
            stopSelects.forEach(select => {
                if (select.value) {
                    intermediateStops.push(parseInt(select.value));
                }
            });
        }
        try {
            this.showLoading(true);
            const { result, computeTime } = await api.findRoute(start, end, algorithm, intermediateStops);
            this.computeTime = computeTime;
            this.displayRoute(result);
            this.showLoading(false);
            this.showToast('Route computed successfully!', 'success');
        } catch (error) {
            this.showLoading(false);
            this.showToast(`Error: ${error.message}`, 'error');
            console.error('Route computation error:', error);
        }
    }

    displayRoute(result) {
    // Reset previous routes and markers
    this.routeLayer.clearLayers();
    this.markersLayer.clearLayers();

    this.currentRoute = result;

    // Handle missing or invalid results
    if (!result.found || !result.coordinates || !result.coordinates.length) {
        this.showToast('No path found between selected locations', 'error');
        return;
    }

    // Prepare route coordinates
    const coordinates = result.coordinates.map(coord => [coord[0], coord[1]]);

    let polyline;

    try {
        // Check if Leaflet SnakeAnim plugin exists
        if (L.Polyline.prototype.snakeIn) {
            console.log(" SnakeAnim plugin active — animating route.");

            polyline = L.polyline(coordinates, {
                color: "#0077ff", // calm blue for visibility
                weight: 6,
                opacity: 0.95,
                lineJoin: "round"
            }).addTo(this.routeLayer);

            // Simple snake animation (no zooms, no camera moves)
            polyline.snakeIn();

        } else {
            // Fallback: static route display if plugin missing
            console.warn(" SnakeAnim plugin missing — using static polyline.");
            polyline = L.polyline(coordinates, CONFIG.ROUTE).addTo(this.routeLayer);
        }

    } catch (error) {
        console.error(" Failed to render route:", error);
        polyline = L.polyline(coordinates, CONFIG.ROUTE).addTo(this.routeLayer);
    }

    // Draw start, intermediate, and end markers
    result.path.forEach((node, idx) => {
        const isStart = idx === 0;
        const isEnd = idx === result.path.length - 1;

        let style = CONFIG.MARKERS.INTERMEDIATE;
        let label = `Stop ${idx}`;

        if (isStart) {
            style = CONFIG.MARKERS.START;
            label = ' Start';
        } else if (isEnd) {
            style = CONFIG.MARKERS.END;
            label = ' End';
        }

        L.circleMarker([node.lat, node.lon], style)
            .bindPopup(`
                <div style="text-align:center;">
                    <strong>${node.name}</strong><br>
                    <small style="color:#718096;">${label}</small>
                </div>
            `)
            .addTo(this.markersLayer);
    });

    // Sidebar logic remains active
    this.displayResults(result);
    this.generateInstructions(result);
}


    displayResults(result) {
        document.getElementById('result-algorithm').textContent = result.algorithm;
        document.getElementById('result-distance').textContent = `${result.distance.toFixed(2)} m`;
        document.getElementById('result-nodes').textContent = result.nodesVisited.toLocaleString();
        document.getElementById('result-time').textContent = `${this.computeTime} ms`;

        // ETA and calories calculation
        const walkSpeed = 1.4;
        const etaSec = result.distance / walkSpeed;
        const minutes = Math.floor(etaSec / 60);
        const seconds = Math.round(etaSec % 60);
        const calories = (result.distance / 1000) * 50;
        document.getElementById('result-eta').textContent =
            `${minutes}m ${seconds}s • ${calories.toFixed(1)} kcal`;

        const pathList = document.getElementById('result-path-list');
        pathList.innerHTML = result.path.map((node, idx) =>
            `<div class="path-item">
                <strong>${idx + 1}.</strong> ${node.name}
            </div>`
        ).join('');
        document.getElementById('results-section').style.display = 'block';
    }

    generateInstructions(result) {
        if (!result.found || !result.path || result.path.length === 0) {
            document.getElementById('route-instructions-section').style.display = 'none';
            return;
        }
        const instructions = [];
        for (let i = 0; i < result.path.length; i++) {
            const node = result.path[i];
            if (i === 0) {
                instructions.push(`Start at <strong>${node.name}</strong>`);
            } else if (i === result.path.length - 1) {
                instructions.push(`Arrive at <strong>${node.name}</strong>`);
            } else {
                const prevNode = result.path[i - 1];
                const segmentDist = Math.sqrt(
                    Math.pow(node.lat - prevNode.lat, 2) +
                    Math.pow(node.lon - prevNode.lon, 2)
                ) * 111000;
                instructions.push(
                    `Walk to <strong>${node.name}</strong> (${segmentDist.toFixed(0)}m)`
                );
            }
        }
        document.getElementById('instructions-list').innerHTML = instructions
            .map((ins, idx) => `<div class="instruction">${idx + 1}. ${ins}</div>`).join('');
        document.getElementById('route-instructions-section').style.display = 'block';
    }


    generateShareLink() {
        const start = document.getElementById('start-location').value;
        const end = document.getElementById('end-location').value;
        const algorithm = document.getElementById('algorithm-select').value;
        const url = `${window.location.origin}?start=${start}&end=${end}&alg=${algorithm}`;
        document.getElementById('share-link').textContent = url;
        navigator.clipboard.writeText(url)
            .then(() => this.showToast('Route link copied!', 'success'));
    }

    clearRoute() {
        this.routeLayer.clearLayers();
        this.markersLayer.clearLayers();
        document.getElementById('results-section').style.display = 'none';
        document.getElementById('route-instructions-section').style.display = 'none';
        this.currentRoute = null;
    }

    showLoading(show) {
        document.getElementById('loading-overlay').style.display = show ? 'flex' : 'none';
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        setTimeout(() => {
            toast.classList.remove('show');
        }, CONFIG.TIMEOUTS.TOAST);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log(' DOM loaded, initializing application...');
    window.campusNav = new CampusNavigator();
});
