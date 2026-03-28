const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config();

// Persistent process setup
const CPP_EXECUTABLE = path.resolve(
    __dirname,
    process.env.CPP_EXECUTABLE || '../../cpp/campusNav'
);
const cppExec = process.platform === 'win32'
    ? (CPP_EXECUTABLE.endsWith('.exe') ? CPP_EXECUTABLE : CPP_EXECUTABLE + '.exe')
    : CPP_EXECUTABLE;

console.log(`[C++] Persistent process initialized: ${cppExec}`);

// === Start persistent C++ process (runs until server shutdown) ===
const persistentCppProc = spawn(cppExec, ['route'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: false
});

const pendingRequests = [];

// Capture output and resolve only most recent request
persistentCppProc.stdout.on('data', (data) => {
    if (pendingRequests.length) {
        // flush queue in FIFO (one by one)
        const { resolve } = pendingRequests.shift();
        resolve(data.toString());
    }
});

persistentCppProc.stderr.on('data', (data) => {
    if (pendingRequests.length) {
        const { reject } = pendingRequests.shift();
        reject(`C++ error: ${data.toString()}`);
    }
});

persistentCppProc.on('error', (err) => {
    console.error('[C++] Fatal error:', err);
    while (pendingRequests.length) {
        const { reject } = pendingRequests.shift();
        reject(err);
    }
});

persistentCppProc.on('exit', (code) => {
    console.error(`[C++] Process exited with code ${code}`);
    while (pendingRequests.length) {
        const { reject } = pendingRequests.shift();
        reject(new Error('C++ process exited prematurely'));
    }
});

// Main function for route computation
function computeRoute(start, end, algorithm = 'dijkstra', intermediateStops = []) {
    return new Promise((resolve, reject) => {
        const input = JSON.stringify({
            start: parseInt(start),
            end: parseInt(end),
            algorithm: algorithm,
            intermediateStops: intermediateStops.map(s => parseInt(s))
        });
        pendingRequests.push({ resolve, reject });
        // Send query to always-open process
        persistentCppProc.stdin.write(input + '\n');
    })
    .then(output => {
        try {
            return JSON.parse(output.trim());
        } catch (err) {
            throw new Error(`Failed to parse C++ output: ${err.message}, raw output: ${output}`);
        }
    });
}

// Simple test connection
async function testConnection() {
    const fs = require('fs');
    if (!fs.existsSync(cppExec)) {
        console.error(` C++ executable not found at: ${cppExec}`);
        return false;
    }
    console.log(`C++ executable found at: ${cppExec}`);
    return true;
}

// Clean shutdown on server quit
process.on('SIGINT', () => {
    console.log('\nShutting down persistent C++ process...');
    persistentCppProc.kill('SIGINT');
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.log('\n Shutting down persistent C++ process...');
    persistentCppProc.kill('SIGTERM');
    process.exit(0);
});

module.exports = {
    computeRoute,
    testConnection
};
