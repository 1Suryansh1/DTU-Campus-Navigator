#include "graph.h"
#include "algorithms.h"
#include <stack>
#include <unordered_map>
#include <vector>
#include <limits>
#include <stdexcept>
#include <algorithm>

PathResult dfs(const Graph& graph, int start, int end) {
    PathResult result;
    result.algorithm = "dfs";
    result.found = false;
    result.distance = 0.0;

    if (!graph.hasNode(start) || !graph.hasNode(end))
        return result;

    std::unordered_map<int, bool> visited;
    std::unordered_map<int, int> parent;
    std::stack<int> s;

    s.push(start);
    visited[start] = true;

    while (!s.empty()) {
        int current = s.top();
        s.pop();

        if (current == end) {
            result.found = true;
            break;
        }

        for (const auto& neighbor : graph.getNeighbors(current)) {
            int next = neighbor.first;
            if (!visited[next]) {
                visited[next] = true;
                parent[next] = current;
                s.push(next);
            }
        }
    }

    // reconstruct path if found
    if (result.found) {
        std::vector<int> path;
        int crawl = end;
        while (crawl != start) {
            path.push_back(crawl);
            crawl = parent[crawl];
        }
        path.push_back(start);
        std::reverse(path.begin(), path.end());
        result.path = path;

        // compute total distance
        double total = 0.0;
        for (size_t i = 0; i + 1 < path.size(); ++i) {
            int u = path[i];
            int v = path[i + 1];
            for (auto& nb : graph.getNeighbors(u)) {
                if (nb.first == v) {
                    total += nb.second;
                    break;
                }
            }
        }
        result.distance = total;
        result.nodesVisited = visited.size();
    }

    return result;
}
