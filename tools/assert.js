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
        return "Assertion failed: " + (this.message ? this.message : "") +
            "  Expected: " + this.expected +
            "  Actual: " + this.actual;
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

    function deepEqual(item1, item2) {
        var propName;

        if (item1 === item2) {
            return true;
        } else if (item1 instanceof Date &&
                item2 instanceof Date) {
            return item1.toJSON() === item2.toJSON();
        } else if (typeof item1 === "object" &&
                typeof item2 == "object") {

            for (propName in item1) {
                if (item1.hasOwnProperty(propName) && (
                        !item2.hasOwnProperty(propName)
                        || !deepEqual(item1[propName], item2[propName])
                    )) {
                    return false;
                }
            }

            for (propName in item2) {
                if (item2.hasOwnProperty(propName) &&
                        !item1.hasOwnProperty(propName)) {
                    return false;
                }
            }

            return item1.prototype === item2.prototype;
        } else {
            return item1 == item2;
        }
    }

    assert.deepEqual = function (actual, expected, message_opt) {
        if (!deepEqual(actual, expected)) {
            throw new assert.AssertionError({
                message : message_opt,
                actual : actual,
                expected : expected
            });
        }
    };

    assert.notDeepEqual = function (actual, expected, message_opt) {
        if (deepEqual(actual, expected)) {
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
            actual : "No exception",
            expected : "Exception"
        });
    };

    //
    // extensions to the standard
    //

    assert.calls = function (obj, member, block, message_opt) {
        var original = obj[member], called = false;

        obj[member] = function () {
            called = true;
            original.apply(this, arguments);
        };

        try {
            block();
        } finally {
            obj[member] = original;
        }

        if (!called) {
            throw new assert.AssertionError({
                message : message_opt,
                actual : member + " not called",
                expected : member + " called"
            });
        }
    };

    return assert;
});

