#!/usr/bin/node
var requirejs = require('requirejs');

// standard requirejs server initialization to choose the default require call
requirejs.config({
    nodeRequire: require
});

requirejs(
    ['tools/test', 'test/utilities_test.js', 'test/AbstractNDArray_test.js'],
    function (test, basearray_test) {
        "use strict";

        test.runTests(test.consoleReporter);
    }
);
