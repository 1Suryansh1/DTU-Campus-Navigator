#ifndef PROCESSOR_H
#define PROCESSOR_H

#include "graph.h"
#include "algorithms.h"
#include <string>
#include <vector>

// Haversine formula
double calculateDistance(double lat1, double lon1, double lat2, double lon2);

// Main GeoJSON Processor
Graph processGeoJSON(const std::string& filename);

// Export functions
void exportGraphToJSON(const Graph& graph, const std::string& filename);
void exportGraphAsGeoJSON(const Graph& graph, const std::string& filename);
void exportPathsToJSON(const std::vector<PathResult>& paths, const std::string& filename);

#endif
