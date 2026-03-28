#include "algorithms.h"
#include <queue>
#include <algorithm>
#include <cmath>
PathResult bfs(const Graph& graph, int start, int end) {
    int n = graph.getNodeCount();
    std::vector<bool> visited(n, false);
    std::vector<int> parent(n, -1);
    std::queue<int> q;
    
    q.push(start);
    visited[start] = true;
    int nodesVisited = 0;
    bool found = false;
    
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        nodesVisited++;
        
        if (u == end) {
            found = true;
            break;
        }
        
        std::vector<std::pair<int, double> > neighbors = graph.getNeighbors(u);
        for (size_t i = 0; i < neighbors.size(); ++i) {
            int v = neighbors[i].first;
            if (!visited[v]) {
                visited[v] = true;
                parent[v] = u;
                q.push(v);
            }
        }
    }
    
    PathResult result;
    result.algorithm = "BFS";
    result.startId = start;
    result.endId = end;
    result.nodesVisited = nodesVisited;
    result.found = found;
    
    if (found) {
        int curr = end;
        double totalDist = 0.0;
        
        while (curr != -1) {
            result.path.push_back(curr);
            if (parent[curr] != -1) {
                const Node& n1 = graph.getNode(curr);
                const Node& n2 = graph.getNode(parent[curr]);
                totalDist += std::sqrt(std::pow(n1.lat - n2.lat, 2) + std::pow(n1.lon - n2.lon, 2)) * 111000;
            }
            curr = parent[curr];
        }
        std::reverse(result.path.begin(), result.path.end());
        result.distance = totalDist;
        
        for (size_t i = 0; i < result.path.size(); ++i) {
            const Node& node = graph.getNode(result.path[i]);
            result.pathNames.push_back(node.name.empty() ? "Junction" : node.name);
        }
    }
    
    return result;
}
