const express = require('express');
const router = express.Router();
const cppBridge = require('../utils/cppBridge');
const fs = require('fs');
const path = require('path');

/**
 * GET /api/locations
 * Returns all named locations (buildings/POIs) from the graph
 */
router.get('/locations', (req, res) => {
    try {
        const graphPath = path.join(__dirname, '../../data/processed_graph.json');
        
        if (!fs.existsSync(graphPath)) {
            return res.status(404).json({ 
                success: false, 
                error: 'Graph file not found. Please run "process" command first.' 
            });
        }
        
        const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
        
        const locations = graph.nodes
            .filter(node => node.isBuilding && node.name && node.name.trim() !== '')
            .map(node => ({
                id: node.id,
                name: node.name,
                lat: node.lat,
                lon: node.lon,
                type: node.type,
                accessible: node.accessible
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
        
        res.json({ 
            success: true, 
            count: locations.length,
            locations 
        });
    } catch (error) {
        console.error('Error loading locations:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * GET /api/geojson
 * Returns the campus GeoJSON for map visualization
 */
router.get('/geojson', (req, res) => {
    try {
        const geojsonPath = path.join(__dirname, '../../data/map-5.geojson');
        
        if (!fs.existsSync(geojsonPath)) {
            return res.status(404).json({ 
                success: false, 
                error: 'GeoJSON file not found' 
            });
        }
        
        const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
        
        res.json({ 
            success: true, 
            featureCount: geojson.features ? geojson.features.length : 0,
            geojson 
        });
    } catch (error) {
        console.error('Error loading GeoJSON:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * GET /api/graph
 * Returns the complete processed graph structure
 */
router.get('/graph', (req, res) => {
    try {
        const graphPath = path.join(__dirname, '../../data/processed_graph.json');
        
        if (!fs.existsSync(graphPath)) {
            return res.status(404).json({ 
                success: false, 
                error: 'Graph file not found' 
            });
        }
        
        const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
        
        res.json({ 
            success: true,
            stats: {
                nodeCount: graph.nodes ? graph.nodes.length : 0,
                edgeCount: graph.edges ? graph.edges.length : 0
            },
            graph 
        });
    } catch (error) {
        console.error('Error loading graph:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * POST /api/route
 * Compute route dynamically using C++ algorithms
 */
router.post('/route', async (req, res) => {
    try {
        const { start, end, algorithm, intermediateStops } = req.body;
        
        // Validation
        if (start === undefined || start === null) {
            return res.status(400).json({ 
                success: false, 
                error: 'Start location is required' 
            });
        }

        if (end === undefined || end === null) {
            return res.status(400).json({ 
                success: false, 
                error: 'End location is required' 
            });
        }

        if (start === end) {
            return res.status(400).json({ 
                success: false, 
                error: 'Start and end locations must be different' 
            });
        }

        const algoName = algorithm || 'dijkstra';
        const stops = intermediateStops || [];

        console.log(`🔍 Computing route: ${start} → ${end} using ${algoName}`);
        if (stops.length > 0) {
            console.log(`   Intermediate stops: ${stops.join(' → ')}`);
        }
        
        const startTime = Date.now();
        const result = await cppBridge.computeRoute(start, end, algoName, stops);
        const computeTime = Date.now() - startTime;

        console.log(` Route computed in ${computeTime}ms`);
        
        res.json({ 
            success: true,
            computeTime: computeTime,
            result 
        });
    } catch (error) {
        console.error(' Route computation error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * GET /api/algorithms
 * Returns available routing algorithms
 */
router.get('/algorithms', (req, res) => {
    res.json({
        success: true,
        algorithms: [
            {
                id: 'dijkstra',
                name: 'Dijkstra',
                description: 'Shortest path algorithm (optimal)',
                timeComplexity: 'O((V + E) log V)'
            },
            {
                id: 'bfs',
                name: 'BFS',
                description: 'Breadth-First Search (unweighted)',
                timeComplexity: 'O(V + E)'
            },
            {
                id: 'dfs',
                name: 'DFS',
                description: 'Depth-First Search (exploratory)',
                timeComplexity: 'O(V + E)'
            },
            {
                id: 'multistop',
                name: 'Multi-Stop Route',
                description: 'Optimal path through intermediate waypoints',
                timeComplexity: 'O(k * (V + E) log V) where k = stops'
            }
        ]
    });
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
    const graphPath = path.join(__dirname, '../../data/processed_graph.json');
    const geojsonPath = path.join(__dirname, '../../data/map-5.geojson');
    
    res.json({ 
        success: true, 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        files: {
            graph: fs.existsSync(graphPath),
            geojson: fs.existsSync(geojsonPath)
        }
    });
});

/**
 * GET /api/stats
 * Returns system statistics
 */
router.get('/stats', (req, res) => {
    try {
        const graphPath = path.join(__dirname, '../../data/processed_graph.json');
        
        if (!fs.existsSync(graphPath)) {
            return res.json({
                success: true,
                stats: {
                    graphProcessed: false
                }
            });
        }
        
        const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
        const buildings = graph.nodes.filter(n => n.isBuilding).length;
        const pathNodes = graph.nodes.filter(n => !n.isBuilding).length;
        
        res.json({
            success: true,
            stats: {
                graphProcessed: true,
                totalNodes: graph.nodes.length,
                buildings: buildings,
                pathNodes: pathNodes,
                edges: graph.edges.length,
                avgDegree: (graph.edges.length * 2 / graph.nodes.length).toFixed(2)
            }
        });
    } catch (error) {
        console.error('Error loading stats:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

module.exports = router;
