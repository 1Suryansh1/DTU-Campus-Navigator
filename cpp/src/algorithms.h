#ifndef ALGORITHMS_H
#define ALGORITHMS_H

#include "graph.h"
#include <vector>
#include <string>

struct PathResult {
    std::string algorithm;
    int startId;
    int endId;
    bool found;
    double distance;
    int nodesVisited;
    std::vector<int> path;
    std::vector<std::string> pathNames;
};

// Shortest Path Algorithms
PathResult dijkstra(const Graph& graph, int start, int end, bool accessible = true);
PathResult bfs(const Graph& graph, int start, int end);
PathResult dfs(const Graph& graph, int start, int end);

// Multi-Stop Route
PathResult multiStopRoute(const Graph& graph, int start, int end, const std::vector<int>& intermediateStops);

#endif
