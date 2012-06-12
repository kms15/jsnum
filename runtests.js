#!/usr/bin/node
var requirejs = require('requirejs');

// standard requirejs server initialization to choose the default require call
requirejs.config({
    nodeRequire: require
});

requirejs(['tools/test.js', 'test/allTests.js'], function (test, allTests) {
    "use strict";

    function reporter(e) {
        // do the default processing
        test.consoleReporter(e);

        if (e.type === "endTestRun") {
            // return the number of failures as the exit code
            process.exit(e.numFailures);
        }
    }

    allTests.runTests(reporter);
});
