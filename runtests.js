#!/usr/bin/node
var requirejs = require('requirejs');

// standard requirejs server initialization to choose the default require call
requirejs.config({
    nodeRequire: require
});

requirejs(['tools/test.js', 'test/allTests.js'], function (test, allTests) {
    "use strict";

    allTests.runTests(test.consoleReporter);
});
