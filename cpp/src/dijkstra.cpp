#include "algorithms.h"
#include <queue>
#include <limits>
#include <algorithm>

typedef std::pair<double, int> PQNode;

PathResult dijkstra(const Graph& graph, int start, int end, bool accessible) {
    const double INF = std::numeric_limits<double>::max();
    int n = graph.getNodeCount();
    
    std::vector<double> dist(n, INF);
    std::vector<int> parent(n, -1);
    std::priority_queue<PQNode, std::vector<PQNode>, std::greater<PQNode> > pq;
    
    dist[start] = 0;
    pq.push(std::make_pair(0.0, start));
    int nodesVisited = 0;
    
    while (!pq.empty()) {
        PQNode top = pq.top();
        pq.pop();
        int u = top.second;
        nodesVisited++;
        
        if (u == end) break;
        if (top.first > dist[u]) continue;
        
        std::vector<std::pair<int, double> > neighbors = graph.getNeighbors(u);
        for (size_t i = 0; i < neighbors.size(); ++i) {
            int v = neighbors[i].first;
            double weight = neighbors[i].second;
            double newDist = dist[u] + weight;
            
            if (newDist < dist[v]) {
                dist[v] = newDist;
                parent[v] = u;
                pq.push(std::make_pair(newDist, v));
            }
        }
    }
    
    PathResult result;
    result.algorithm = "Dijkstra";
    result.startId = start;
    result.endId = end;
    result.nodesVisited = nodesVisited;
    result.found = (dist[end] != INF);
    result.distance = dist[end];
    
    if (result.found) {
        int curr = end;
        while (curr != -1) {
            result.path.push_back(curr);
            curr = parent[curr];
        }
        std::reverse(result.path.begin(), result.path.end());
        
        for (size_t i = 0; i < result.path.size(); ++i) {
            const Node& node = graph.getNode(result.path[i]);
            result.pathNames.push_back(node.name.empty() ? "Junction" : node.name);
        }
    }
    
    return result;
}
