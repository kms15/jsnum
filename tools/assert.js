/*global define */
/*jslint eqeq: true */
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

    assert.ok = function (guard, message_opt) {
        if (!guard) {
            throw new assert.AssertionError({
                message : message_opt,
                actual : guard,
                expected : true
            });
        }
    };

    assert.equal = function (actual, expected, message_opt) {
        if (actual != expected) {
            throw new assert.AssertionError({
                message : message_opt,
                actual : actual,
                expected : expected
            });
        }
    };

    assert.notEqual = function (actual, expected, message_opt) {
        if (actual == expected) {
            throw new assert.AssertionError({
                message : message_opt,
                actual : actual,
                expected : expected
            });
        }
    };

    assert.strictEqual = function (actual, expected, message_opt) {
        if (actual !== expected) {
            throw new assert.AssertionError({
                message : message_opt,
                actual : actual,
                expected : expected
            });
        }
    };

    assert.notStrictEqual = function (actual, expected, message_opt) {
        if (actual === expected) {
            throw new assert.AssertionError({
                message : message_opt,
                actual : actual,
                expected : expected
            });
        }
    };

    assert.throws = function (block, Error_opt, message_opt) {
        try {
            block();
        } catch (e) {
            if (!Error_opt || e instanceof Error_opt) {
                return;
            } else {
                throw e;
            }
        }

        throw new assert.AssertionError({
            message : message_opt,
            expected : "Exception"
        });
    };

    return assert;
});

