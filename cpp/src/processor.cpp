#include "processor.h"
#include "json.hpp"
#include <fstream>
#include <cmath>
#include <iostream>
#include <vector>
#include <map>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

using json = nlohmann::json;

double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    const double R = 6371000;
    double dLat = (lat2 - lat1) * M_PI / 180.0;
    double dLon = (lon2 - lon1) * M_PI / 180.0;
    double a = std::sin(dLat / 2.0) * std::sin(dLat / 2.0) +
               std::cos(lat1 * M_PI / 180.0) * std::cos(lat2 * M_PI / 180.0) *
               std::sin(dLon / 2.0) * std::sin(dLon / 2.0);
    double c = 2.0 * std::atan2(std::sqrt(a), std::sqrt(1.0 - a));
    return R * c;
}

Graph processGeoJSON(const std::string& filename) {
    std::ifstream file(filename.c_str());
    if (!file.is_open())
        throw std::runtime_error("Cannot open file: " + filename);

    json data;
    file >> data;
    file.close();

    Graph graph;
    std::cerr << "Processing GeoJSON File: " << filename << std::endl;

    std::map<std::pair<double, double>, int> coordToNodeID;

    // Process Point features
    for (size_t i = 0; i < data["features"].size(); ++i) {
        const json& feature = data["features"][i];
        if (feature["geometry"]["type"] == "Point") {
            std::vector<double> coords = feature["geometry"]["coordinates"];
            double lon = coords[0];
            double lat = coords[1];
            std::string name = feature["properties"].count("name") ? feature["properties"]["name"].get<std::string>() : "";
            std::string type = feature["properties"].count("type") ? feature["properties"]["type"].get<std::string>() : "poi";
            bool accessible = feature["properties"].count("accessible") ? feature["properties"]["accessible"].get<bool>() : true;
            
            if (!name.empty()) {
                int nodeId = graph.addNode(name, lat, lon, type, accessible, true);
                coordToNodeID[std::make_pair(lat, lon)] = nodeId;
                std::cerr << "Added Point: " << name << std::endl;
            }
        }
    }

    // Process LineString features
    for (size_t i = 0; i < data["features"].size(); ++i) {
        const json& feature = data["features"][i];
        if (feature["geometry"]["type"] == "LineString") {
            const json& arr = feature["geometry"]["coordinates"];
            std::vector<int> pathNodeIds;

            for (size_t j = 0; j < arr.size(); ++j) {
                double lon = arr[j][0];
                double lat = arr[j][1];
                std::pair<double, double> key = std::make_pair(lat, lon);

                if (coordToNodeID.count(key) == 0) {
                    int newID = graph.addNode("", lat, lon, "path", true, false);
                    coordToNodeID[key] = newID;
                }
                pathNodeIds.push_back(coordToNodeID[key]);
            }

            for (size_t j = 1; j < pathNodeIds.size(); ++j) {
                int idA = pathNodeIds[j - 1];
                int idB = pathNodeIds[j];
                if (idA != idB) {
                    const Node& nodeA = graph.getNode(idA);
                    const Node& nodeB = graph.getNode(idB);
                    double dist = calculateDistance(nodeA.lat, nodeA.lon, nodeB.lat, nodeB.lon);
                    graph.addEdge(idA, idB, dist);
                }
            }
        }
    }

    std::cerr << "Total Nodes: " << graph.getNodeCount() << std::endl;
    return graph;
}

void exportGraphToJSON(const Graph& graph, const std::string& filename) {
    json out;
    out["nodes"] = json::array();
    out["edges"] = json::array();

    std::vector<Node> nodes = graph.getAllNodes();
    std::vector<Edge> edges = graph.getAllEdges();

    for (size_t i = 0; i < nodes.size(); ++i) {
        json n;
        n["id"] = nodes[i].id;
        n["name"] = nodes[i].name;
        n["lat"] = nodes[i].lat;
        n["lon"] = nodes[i].lon;
        n["type"] = nodes[i].type;
        n["accessible"] = nodes[i].accessible;
        n["isBuilding"] = nodes[i].isBuilding;
        out["nodes"].push_back(n);
    }

    for (size_t i = 0; i < edges.size(); ++i) {
        json e;
        e["from"] = edges[i].from;
        e["to"] = edges[i].to;
        e["weight"] = edges[i].weight;
        e["accessible"] = edges[i].accessible;
        out["edges"].push_back(e);
    }

    std::ofstream f(filename.c_str());
    f << out.dump(2);
    f.close();
    std::cerr << "Graph Exported: " << filename << std::endl;
}

void exportPathsToJSON(const std::vector<PathResult>& paths, const std::string& filename) {
    json out = json::array();
    for (size_t i = 0; i < paths.size(); ++i) {
        json p;
        p["startId"] = paths[i].startId;
        p["endId"] = paths[i].endId;
        p["algorithm"] = paths[i].algorithm;
        p["found"] = paths[i].found;
        p["distance"] = paths[i].distance;
        p["nodesVisited"] = paths[i].nodesVisited;
        p["path"] = paths[i].path;
        p["pathNames"] = paths[i].pathNames;
        out.push_back(p);
    }
    std::ofstream f(filename.c_str());
    f << out.dump(2);
    f.close();
    std::cerr << "Paths Exported: " << filename << std::endl;
}

void exportGraphAsGeoJSON(const Graph& graph, const std::string& filename) {
    json out;
    out["type"] = "FeatureCollection";
    out["features"] = json::array();

    const std::vector<Node> nodes = graph.getAllNodes();
    for (size_t i = 0; i < nodes.size(); ++i) {
        json feat;
        feat["type"] = "Feature";
        feat["geometry"] = {
            {"type", "Point"},
            {"coordinates", {nodes[i].lon, nodes[i].lat}}
        };
        feat["properties"] = {
            {"id", nodes[i].id},
            {"name", nodes[i].name},
            {"type", nodes[i].type},
            {"isBuilding", nodes[i].isBuilding}
        };
        out["features"].push_back(feat);
    }

    const std::vector<Edge> edges = graph.getAllEdges();
    for (size_t i = 0; i < edges.size(); ++i) {
        const Node& n1 = graph.getNode(edges[i].from);
        const Node& n2 = graph.getNode(edges[i].to);
        json feat;
        feat["type"] = "Feature";
        feat["geometry"] = {
            {"type", "LineString"},
            {"coordinates", { {n1.lon, n1.lat}, {n2.lon, n2.lat} }}
        };
        feat["properties"] = {
            {"from", edges[i].from},
            {"to", edges[i].to},
            {"weight", edges[i].weight}
        };
        out["features"].push_back(feat);
    }

    std::ofstream f(filename.c_str());
    f << out.dump(2);
    f.close();
    std::cerr << "Visual GeoJSON Exported: " << filename << std::endl;
}
