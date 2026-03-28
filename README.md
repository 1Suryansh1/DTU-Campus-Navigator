# 🗺️ DTU Campus Navigator

A high-performance, interactive web application to find optimal routes across the Delhi Technological University (DTU) campus.

## 🌟 Overview

DTU Campus Navigator integrates a sleek Leaflet-based frontend, a lightweight Node.js/Express API layer, and a robust C++ routing engine. It parses GeoJSON map data into an optimized graph structure and uses classic algorithms to compute routes dynamically, including shortest paths and multi-stop journeys.

## ✨ Features

- **Interactive Map:** Built with Leaflet.js for smooth zooming, panning, and path visualization.
- **Multiple Routing Algorithms:**
  - **Dijkstra:** Finds the absolute shortest optimal path.
  - **BFS (Breadth-First Search):** Unweighted path exploration.
  - **DFS (Depth-First Search):** Exploratory path generation.
  - **Multi-stop Routing:** Calculates the optimal route passing through multiple intermediate waypoints.
- **High-Performance C++ Engine:** The graph representations and pathfinding run on a custom-built, persistent C++ backend for sub-millisecond route calculations.
- **Node.js Bridge:** Express API interfaces with the spawned C++ engine using stdin/stdout JSON messaging.

## 🏗️ Architecture & Project Structure

The project is split into four primary components:

- **`frontend/`**: The visual layer. Includes `index.html`, vanilla CSS styling, and JavaScript logic (`api.js`, `map.js`) to handle user interaction and Leaflet map rendering.
- **`backend/`**: Node.js Express server (`server.js`). It serves the frontend static files and exposes RESTful endpoints (`/api/locations`, `/api/route`) located in `routes/api.js`. It communicates with the C++ executable via the `cppBridge`.
- **`cpp/`**: The core routing engine.
  - Uses `nlohmann/json` for parsing map data and queries.
  - Standard Makefile available for building the `campusNav` executable.
  - Compiles graph nodes and edges from GeoJSON and runs continuous "persistent mode" to answer API routing requests instantly.
- **`data/`**: Geographic dataset layer. Contains original campus features in `map-5.geojson` and the exported, optimized representations (`processed_graph.json` and `processed_graph_visual.geojson`).

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v14.0.0 or higher)
- **C++ Compiler** (supporting C++14, e.g., `g++`)
- **Make** (for compiling the C++ engine)

### Installation & Setup

1. **Build the C++ Engine:**
   Navigate into the `cpp` directory and build the executable:
   ```bash
   cd cpp
   make
   ```
   This generates the `campusNav.exe` file inside the `cpp/build` directory (or locally based on OS).

2. **Install Node.js Dependencies:**
   Navigate to the `backend` directory and install required NPM packages:
   ```bash
   cd ../backend
   npm install
   ```

3. **(Optional) Process Map Data:**
   If the graph JSON needs to be regenerated from the GeoJSON:
   ```bash
   cd ../cpp
   ./campusNav process ../data/map-5.geojson
   ```

4. **Start the Server:**
   From the `backend` directory, start the Express server:
   ```bash
   cd ../backend
   npm start
   ```
   *Note: For development, you can use `npm run dev` (requires `nodemon`).*

### Usage

Open your web browser and navigate to the local server, typically running at:
```
http://localhost:3000
```
- Select your Start and End locations.
- Pick a routing algorithm.
- (Optional) Add intermediate stops if using the Multi-stop algorithm.
- Click **Find Route** to view the calculated path on the map entirely along with statistics (time, distance traversed, and nodes visited).

## 🛠️ Tech Stack 

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla), Leaflet.js
- **Backend:** Node.js, Express.js
- **Routing Engine:** C++14 (nlohmann/json for parsing)
- **Data:** GeoJSON


## AI SUPPORT IS REMOVED AS OF NOW
## 📄 License

This project is licensed under the MIT License.
