define([], function() {
    "use strict";
    var assert = {};

    assert.strictEqual = function (actual, expected, message) {
        if (actual !== expected) {
            throw Error("Assertion failed: " + 
                (message ? message + '; ' : '') + 
                "expected exactly " + expected + " but value was " +
                actual + ".");
        }
    };

    return assert;
});

