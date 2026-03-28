/**
 * Application Configuration
 */
const CONFIG = {
    // API Configuration
    API_BASE_URL: window.location.origin + '/api',
    
    // Map Configuration
    MAP: {
        CENTER: [28.75, 77.117],
        ZOOM: 16,
        MIN_ZOOM: 14,
        MAX_ZOOM: 19,
        TILE_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    
    // Marker Styles
    MARKERS: {
        START: {
            radius: 10,
            fillColor: '#48bb78',
            color: '#fff',
            weight: 3,
            fillOpacity: 1
        },
        END: {
            radius: 10,
            fillColor: '#f56565',
            color: '#fff',
            weight: 3,
            fillOpacity: 1
        },
        INTERMEDIATE: {
            radius: 8,
            fillColor: '#667eea',
            color: '#fff',
            weight: 2,
            fillOpacity: 1
        },
        POI: {
            radius: 8,
            fillColor: '#667eea',
            color: '#fff',
            weight: 2,
            fillOpacity: 0.8
        },
        PATH_NODE: {
            radius: 4,
            fillColor: '#cbd5e0',
            color: '#fff',
            weight: 2,
            fillOpacity: 0.5
        }
    },
    
    // Route Style
    ROUTE: {
        color: '#667eea',
        weight: 6,
        opacity: 0.8,
        smoothFactor: 1
    },
    
    // Path Style (GeoJSON)
    PATH: {
        color: '#a0aec0',
        weight: 2,
        opacity: 0.6
    },
    
    // Algorithm Descriptions
    ALGORITHMS: {
        dijkstra: {
            name: 'Dijkstra',
            description: 'Finds the shortest path between two points',
            hint: 'Optimal for weighted graphs'
        },
        bfs: {
            name: 'BFS',
            description: 'Breadth-First Search - explores neighbors first',
            hint: 'Good for unweighted graphs'
        },
        dfs: {
            name: 'DFS',
            description: 'Depth-First Search - explores deeply first',
            hint: 'May not find shortest path'
        },
        multistop: {
            name: 'Multi-Stop Route',
            description: 'Optimal path through intermediate waypoints',
            hint: 'Add stops below to create route'
        }
    },
    
    // Timeouts
    TIMEOUTS: {
        TOAST: 3000,
        REQUEST: 30000
    }
};

// Make config globally available
window.APP_CONFIG = CONFIG;
