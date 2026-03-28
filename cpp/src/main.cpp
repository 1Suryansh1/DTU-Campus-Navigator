#include "graph.h"
#include "algorithms.h"
#include "processor.h"
#include "json.hpp"
#include <iostream>
#include <vector>
#include <string>

using json = nlohmann::json;

// Print final JSON result, only to stdout
void printJSONResult(const PathResult& result, const Graph& graph) {
    json output;
    output["algorithm"] = result.algorithm;
    output["found"] = result.found;
    output["distance"] = result.distance;
    output["nodesVisited"] = result.nodesVisited;
    output["path"] = json::array();
    output["coordinates"] = json::array();

    if (result.found) {
        for (size_t i = 0; i < result.path.size(); ++i) {
            const Node& node = graph.getNode(result.path[i]);
            json pathNode;
            pathNode["id"] = node.id;
            pathNode["name"] = node.name.empty() ? "Junction" : node.name;
            pathNode["lat"] = node.lat;
            pathNode["lon"] = node.lon;
            output["path"].push_back(pathNode);
            output["coordinates"].push_back(json::array({node.lat, node.lon}));
        }
    }
    // Only the final JSON object appears on stdout!
    std::cout << output.dump() << std::endl;
}

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cerr << "{\"success\": false, \"error\": \"No command provided\"}" << std::endl;
        return 1;
    }

    std::string command = argv[1];

    try {
        if (command == "process") {
            if (argc < 3) {
                std::cerr << "{\"success\": false, \"error\": \"No input file\"}" << std::endl;
                return 1;
            }
            Graph graph = processGeoJSON(argv[2]);
            exportGraphToJSON(graph, "../data/processed_graph.json");
            exportGraphAsGeoJSON(graph, "../data/processed_graph_visual.geojson");
            std::cerr << "{\"success\": true, \"message\": \"Graph processed\"}" << std::endl;

        } else if (command == "route") {
            // --------- Persistent Service Mode ----------
            // 1. Load graph ONCE at boot (not per route!)
            std::cerr << "[C++] Starting persistent mode, loading map file..." << std::endl;
            Graph graph = processGeoJSON("../data/map-5.geojson"); // adjust path if needed
            std::cerr << "[C++] Graph loaded. Awaiting route queries..." << std::endl;

            std::string inputLine;
            // 2. Infinite loop: One route per input line
            while (std::getline(std::cin, inputLine)) {
                try {
                    json inputJson = json::parse(inputLine);

                    int start = inputJson["start"];
                    int end = inputJson["end"];
                    std::string algorithm = inputJson["algorithm"];

                    PathResult result;
                    if (algorithm == "dijkstra") {
                        result = dijkstra(graph, start, end);
                    } else if (algorithm == "bfs") {
                        result = bfs(graph, start, end);
                    } else if (algorithm == "dfs") {
                        result = dfs(graph, start, end);
                    } else if (algorithm == "multistop") {
                        std::vector<int> stops;
                        if (inputJson.count("intermediateStops") > 0) {
                            for (size_t i = 0; i < inputJson["intermediateStops"].size(); ++i) {
                                stops.push_back(inputJson["intermediateStops"][i]);
                            }
                        }
                        result = multiStopRoute(graph, start, end, stops);
                    } else {
                        result = dijkstra(graph, start, end);
                    }

                    printJSONResult(result, graph);

                } catch (const std::exception& qerr) {
                    json errorOutput;
                    errorOutput["success"] = false;
                    errorOutput["error"] = std::string("Query error: ") + qerr.what();
                    // For failed input/query, output valid JSON error to stdout to keep protocol
                    std::cout << errorOutput.dump() << std::endl;
                    std::cerr << "[C++] Query error: " << qerr.what() << std::endl;
                }
            }

        } else {
            std::cerr << "{\"success\": false, \"error\": \"Unknown command\"}" << std::endl;
            return 1;
        }

    } catch (const std::exception& e) {
        json errorOutput;
        errorOutput["success"] = false;
        errorOutput["error"] = e.what();
        std::cerr << errorOutput.dump() << std::endl;
        return 1;
    }

    return 0;
}
