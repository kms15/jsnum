/*global define */
define(
    ['tools/test', 'tools/assert', 'src/jsn'],
    function (test, assert, jsn) {
        "use strict";

        test.createSuite("unit:asNDArray", {
            "should build from scalar" : function () {
                var A = jsn.asNDArray(3.25);

                assert.strictEqual(String(A), '( 3.25 )');
                assert.strictEqual(A.shape.length, 0);
            },

            "should build from 1D list" : function () {
                var A = jsn.asNDArray([1.5, 3.25, 5.125]);

                assert.strictEqual(String(A),
                    '[   1.5,  3.25, 5.125 ]');
                assert.strictEqual(String(A.shape), '3');
            },

            "should build from 2D list" : function () {
                var A = jsn.asNDArray([[1.5, 3.25], [5.125, 6], [7.5, 8.625]]),
                    B = jsn.asNDArray([[1.5, 3.25, 5.125], [6, 7.5, 8.625]]);

                assert.strictEqual(String(A),
                    '[[   1.5,  3.25 ],\n' +
                    ' [ 5.125,     6 ],\n' +
                    ' [   7.5, 8.625 ]]');
                assert.strictEqual(String(A.shape), '3,2');
                assert.strictEqual(String(B),
                    '[[   1.5,  3.25, 5.125 ],\n' +
                    ' [     6,   7.5, 8.625 ]]');
                assert.strictEqual(String(B.shape), '2,3');
            },

            "should build from higher dimensional list" : function () {
                var A = jsn.asNDArray([[[[1.5], [3.25]], [[5.125], [6]]],
                    [[[7.5], [8.625]], [[9.25], [10.125]]]]);

                assert.strictEqual(String(A),
                    '[\n' +
                    ' [\n' +
                    '  [[    1.5 ],\n' +
                    '   [   3.25 ]],\n' +
                    '\n' +
                    '  [[  5.125 ],\n' +
                    '   [      6 ]]\n' +
                    ' ],\n' +
                    '\n' +
                    ' [\n' +
                    '  [[    7.5 ],\n' +
                    '   [  8.625 ]],\n' +
                    '\n' +
                    '  [[   9.25 ],\n' +
                    '   [ 10.125 ]]\n' +
                    ' ]\n' +
                    ']');
                assert.strictEqual(String(A.shape), '2,2,2,1');
            },

            "should make a copy of values" : function () {
                var a = [[1, 2], [3, 4]],
                    A = jsn.asNDArray(a);

                a[0][1] = 5;
                assert.strictEqual(String(A),
                    '[[ 1, 2 ],\n' +
                    ' [ 3, 4 ]]');
            },

            "if passed an ndarray should return the array" : function () {
                var A = jsn.asNDArray([[1, 2], [3, 4]]),
                    B = jsn.asNDArray(A);

                assert.strictEqual(B, A);
            },

            "should use (tested) UntypedNDArray class" : function () {
                var A = jsn.asNDArray([[1.5, 3.25], [5.125, 6], [7.5, 8.625]]),
                    B = jsn.asNDArray(3);

                assert.ok(A instanceof jsn.UntypedNDArray);
                assert.ok(B instanceof jsn.UntypedNDArray);
            },

            "should not accept ragged arrays" : function () {
                assert.throws(function () {
                    jsn.asNDArray([[1, 2], [3, 4, 5]]);
                }, TypeError, "first shorter");
                assert.throws(function () {
                    jsn.asNDArray([[1, 2, 3], [4, 5]]);
                }, TypeError, "later shorter");
                assert.throws(function () {
                    jsn.asNDArray([[[1, 2], 3], [4, 5]]);
                }, TypeError, "first element deeper");
                assert.throws(function () {
                    jsn.asNDArray([[1, 2], [[3, 4], 5]]);
                }, TypeError, "later element deeper");
            },
        });

        test.createSuite("unit:miscUtils", {
            "should support checkShape" : function () {

                // should not throw with valid data
                jsn.AbstractNDArray.checkShape([2, 3, 1, 6]);
                jsn.AbstractNDArray.checkShape([]);

                assert.throws(function () { jsn.AbstractNDArray.checkShape('a'); },
                    TypeError, "non-Array");
                assert.throws(function () { jsn.AbstractNDArray.checkShape([1, 'a', 2]); },
                    TypeError, "non-numeric length");
                assert.throws(function () { jsn.AbstractNDArray.checkShape([1, 3, 0]); },
                    RangeError, "zero length");
                assert.throws(function () { jsn.AbstractNDArray.checkShape([-2, 3, 3]); },
                    RangeError, "negative length");
                assert.throws(function () {
                    jsn.AbstractNDArray.checkShape([2, Number.NaN, 3]);
                }, RangeError, "nan length");
                assert.throws(function () { jsn.AbstractNDArray.checkShape([2.5, 3, 3]); },
                    TypeError, "fractional length");
            }
        });

        test.createSuite("unit:miscUtils:areClose", {
            "should use abstol when out of range for reltol" : function () {
                assert.ok(!jsn.areClose(1, 0.74, 0.25, 0.125));
                assert.ok(jsn.areClose(1, 0.75, 0.25, 0.125));
                assert.ok(jsn.areClose(1, 0.76, 0.25, 0.125));
                assert.ok(jsn.areClose(1, 1.25, 0.25, 0.125));
                assert.ok(jsn.areClose(1, 1.24, 0.25, 0.125));
                assert.ok(!jsn.areClose(1, 1.26, 0.25, 0.125));
            },

            "should use reltol when out of range for abstol" : function () {
                assert.ok(!jsn.areClose(100, 87.4, 0.25, 0.125));
                assert.ok(jsn.areClose(100, 87.5, 0.25, 0.125));
                assert.ok(jsn.areClose(100, 87.6, 0.25, 0.125));

                assert.ok(!jsn.areClose(87.4, 100, 0.25, 0.125));
                assert.ok(jsn.areClose(87.5, 100, 0.25, 0.125));
                assert.ok(jsn.areClose(87.6, 100, 0.25, 0.125));
            }
        });
    }
);
