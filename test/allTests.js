/*global define */
define(
    [
        'tools/test',
        'test/utilities_test.js',
        'test/AbstractNDArray_test.js',
        'test/UntypedNDArray_test.js',
        'test/BandDiagonalMatrix_test.js'
    ],
    function (test) {
        "use strict";
        var allTests = {};

        allTests.runTests = function (reporter) {
            test.runTests(reporter);
        };

        return allTests;
    }
);
