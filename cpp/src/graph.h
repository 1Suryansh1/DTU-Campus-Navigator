#ifndef GRAPH_H
#define GRAPH_H

#include <string>
#include <vector>
#include <unordered_map>
#include <map>

struct Node {
    int id;
    std::string name;
    double lat;
    double lon;
    std::string type;
    bool accessible;
    bool isBuilding;
};

struct Edge {
    int from;
    int to;
    double weight;
    bool accessible;
};

class Graph {
private:
    std::unordered_map<int, Node> nodes;
    std::unordered_map<int, std::vector<std::pair<int, double> > > adjList;
    std::vector<Edge> edges;
    int nodeCount;

public:
    Graph();

    int addNode(const std::string& name, double lat, double lon,
                const std::string& type, bool accessible, bool isBuilding);

    void addEdge(int from, int to, double weight, bool accessible = true);

    Node getNode(int id) const;

    std::vector<std::pair<int, double> > getNeighbors(int id) const;

    int getNodeCount() const;

    std::vector<Node> getAllNodes() const;

    std::vector<Edge> getAllEdges() const;

    std::map<std::string, int> getNameToIdMap() const;

    int getIdByName(const std::string& name) const;

    bool hasNode(int id) const;
};

#endif
