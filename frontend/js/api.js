/**
 * API Client for DTU Campus Navigator
 */
class APIClient {
    constructor(baseURL) {
        this.baseURL = baseURL || CONFIG.API_BASE_URL;
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    /**
     * Generic request handler
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            method: options.method || 'GET',
            headers: {
                ...this.defaultHeaders,
                ...options.headers
            },
            ...options
        };

        try {
            console.log(`📤 ${config.method} ${endpoint}`);
            
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            console.log(` ${config.method} ${endpoint} - Success`);
            return data;
            
        } catch (error) {
            console.error(` ${config.method} ${endpoint} - Error:`, error);
            throw error;
        }
    }

    /**
     * GET request
     */
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    /**
     * POST request
     */
    async post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    /**
     * Get all locations
     */
    async getLocations() {
        const data = await this.get('/locations');
        return data.locations || [];
    }

    /**
     * Get GeoJSON for map
     */
    async getGeoJSON() {
        const data = await this.get('/geojson');
        return data.geojson;
    }

    /**
     * Get processed graph
     */
    async getGraph() {
        const data = await this.get('/graph');
        return data.graph;
    }

    /**
     * Compute route
     */
    async findRoute(start, end, algorithm, intermediateStops = []) {
        const data = await this.post('/route', {
            start,
            end,
            algorithm,
            intermediateStops
        });
        return {
            result: data.result,
            computeTime: data.computeTime
        };
    }

    /**
     * Get available algorithms
     */
    async getAlgorithms() {
        const data = await this.get('/algorithms');
        return data.algorithms || [];
    }

    /**
     * Get system statistics
     */
    async getStats() {
        const data = await this.get('/stats');
        return data.stats;
    }

    /**
     * Health check
     */
    async health() {
        const data = await this.get('/health');
        return data;
    }
}

// Create global API instance
const api = new APIClient();
window.api = api;
