/*global define */
/*
 * Implements assert framework, based on the CommonJS Unit Testing proposal 1.0
 * found at wiki.commonjs.org/wiki/Unit_Testing/1.0 
 */

define([], function () {
    "use strict";
    var assert = {},
        globalObj = (function () { return this; }());

    assert.AssertionError = function (init) {
        if (this === globalObj) {
            // called without new
            return new assert.AssertionError(init);
        } else {
            this.message = init.message;
            this.expected = init.expected;
            this.actual = init.actual;
        }
    };
    assert.AssertionError.prototype = Object.create(Error);
    assert.AssertionError.prototype.toString = function () {
        return "Assertion failed: " + this.message +
            (this.expected ? "  Expected: " + this.expected : "") +
            (this.actual ? "  Actual: " + this.actual : "");
    };

    assert.strictEqual = function (actual, expected, message) {
        if (actual !== expected) {
            throw new assert.AssertionError({
                message : message,
                actual : actual,
                expected : expected
            });
        }
    };

    return assert;
});

