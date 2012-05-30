#!/usr/bin/node
var requirejs = require('requirejs');

// standard requirejs server initialization to choose the default require call
requirejs.config({
    nodeRequire: require
});

requirejs(['tools/test.js', 'test/allTests.js'], function (test, allTests) {
    "use strict";

    function reporter(a, b, c, d) {
        // do the default processing
        test.consoleReporter(a, b, c, d);

        if (a === "endTestRun") {
            // return the number of failures as the exit code
            process.exit(c);
        }
    }

    allTests.runTests(reporter);
});
