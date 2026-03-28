#include "graph.h"
#include <stdexcept>
#include <algorithm>

Graph::Graph() : nodeCount(0) {}

int Graph::addNode(const std::string& name, double lat, double lon,
                   const std::string& type, bool accessible, bool isBuilding) {
    int id = nodeCount++;
    nodes[id] = {id, name, lat, lon, type, accessible, isBuilding};
    return id;
}

void Graph::addEdge(int from, int to, double weight, bool accessible) {
    if (!hasNode(from) || !hasNode(to)) {
        return;
    }
    adjList[from].push_back(std::make_pair(to, weight));
    adjList[to].push_back(std::make_pair(from, weight));
    edges.push_back({from, to, weight, accessible});
}

Node Graph::getNode(int id) const {
    std::unordered_map<int, Node>::const_iterator it = nodes.find(id);
    if (it != nodes.end()) {
        return it->second;
    }
    throw std::runtime_error("Node not found: " + std::to_string(id));
}

std::vector<std::pair<int, double> > Graph::getNeighbors(int id) const {
    std::unordered_map<int, std::vector<std::pair<int, double> > >::const_iterator it = adjList.find(id);
    if (it != adjList.end()) {
        return it->second;
    }
    return std::vector<std::pair<int, double> >();
}

int Graph::getNodeCount() const {
    return nodeCount;
}

// C++14 compatible comparator
struct NodeIdComparator {
    bool operator()(const Node& a, const Node& b) const {
        return a.id < b.id;
    }
};

std::vector<Node> Graph::getAllNodes() const {
    std::vector<Node> result;
    for (std::unordered_map<int, Node>::const_iterator it = nodes.begin(); it != nodes.end(); ++it) {
        result.push_back(it->second);
    }
    std::sort(result.begin(), result.end(), NodeIdComparator());
    return result;
}

std::vector<Edge> Graph::getAllEdges() const {
    return edges;
}

std::map<std::string, int> Graph::getNameToIdMap() const {
    std::map<std::string, int> nameMap;
    for (std::unordered_map<int, Node>::const_iterator it = nodes.begin(); it != nodes.end(); ++it) {
        if (!it->second.name.empty() && it->second.isBuilding) {
            nameMap[it->second.name] = it->first;
        }
    }
    return nameMap;
}

int Graph::getIdByName(const std::string& name) const {
    for (std::unordered_map<int, Node>::const_iterator it = nodes.begin(); it != nodes.end(); ++it) {
        if (it->second.name == name) {
            return it->first;
        }
    }
    throw std::runtime_error("Node name not found: " + name);
}

bool Graph::hasNode(int id) const {
    return nodes.find(id) != nodes.end();
}
