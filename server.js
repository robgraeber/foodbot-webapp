var cluster = require('cluster');

// Code to run if we're in the master process
if (cluster.isMaster) {

    // Count the machine's CPUs
    var cpuCount = require('os').cpus().length;

    // Create a worker for each CPU
    for (var i = 0; i < cpuCount; i += 1) {
        cluster.fork();
    }

    // Listen for dying workers
    cluster.on('exit', function (worker) {
        // Replace the dead worker
        console.log('Worker ' + worker.id + ' died :(');
        cluster.fork();
    });
    
// Code to run if we're in a worker process
} else {
    console.log('Worker ' + cluster.worker.id + ' running!');
    require("./server/")
}