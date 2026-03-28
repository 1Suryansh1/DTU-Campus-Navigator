#include "algorithms.h"
#include <limits>
#include <iostream>

PathResult multiStopRoute(const Graph& graph, int start, int end, const std::vector<int>& intermediateStops) {
    PathResult result;
    result.algorithm = "Multi-Stop Route";
    result.startId = start;
    result.endId = end;
    result.found = true;
    result.distance = 0.0;
    result.nodesVisited = 0;

    std::vector<int> fullRoute;
    fullRoute.push_back(start);
    for (size_t i = 0; i < intermediateStops.size(); ++i) {
        fullRoute.push_back(intermediateStops[i]);
    }
    fullRoute.push_back(end);

    std::vector<int> completePath;
    double totalDistance = 0.0;
    int totalNodesVisited = 0;

    for (size_t i = 0; i < fullRoute.size() - 1; ++i) {
        int from = fullRoute[i];
        int to = fullRoute[i + 1];

        PathResult segment = dijkstra(graph, from, to);

        if (!segment.found) {
            result.found = false;
            std::cout << "No path found between nodes " << from << " and " << to << std::endl;
            return result;
        }

        if (i == 0) {
            completePath.insert(completePath.end(), segment.path.begin(), segment.path.end());
        } else {
            completePath.insert(completePath.end(), segment.path.begin() + 1, segment.path.end());
        }

        totalDistance += segment.distance;
        totalNodesVisited += segment.nodesVisited;
    }

    result.path = completePath;
    result.distance = totalDistance;
    result.nodesVisited = totalNodesVisited;

    for (size_t i = 0; i < completePath.size(); ++i) {
        const Node& node = graph.getNode(completePath[i]);
        result.pathNames.push_back(node.name.empty() ? "Junction" : node.name);
    }

    return result;
}
