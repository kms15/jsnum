/*global define */
define(
    ['tools/test', 'tools/assert', 'src/jsnum'],
    function (test, assert, jsnum) {
        "use strict";

        test.createSuite("unit:asNDArray", {
            "should build from scalar" : function () {
                var A = jsnum.asNDArray(3.25);

                assert.strictEqual(String(A), '( 3.25 )');
                assert.strictEqual(A.shape.length, 0);
            },

            "should build from 1D list" : function () {
                var A = jsnum.asNDArray([1.5, 3.25, 5.125]);

                assert.strictEqual(String(A),
                    '[   1.5,  3.25, 5.125 ]');
                assert.strictEqual(String(A.shape), '3');
            },

            "should build from 2D list" : function () {
                var A = jsnum.asNDArray([[1.5, 3.25], [5.125, 6], [7.5, 8.625]]),
                    B = jsnum.asNDArray([[1.5, 3.25, 5.125], [6, 7.5, 8.625]]);

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
                var A = jsnum.asNDArray([[[[1.5], [3.25]], [[5.125], [6]]],
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
                    A = jsnum.asNDArray(a);

                a[0][1] = 5;
                assert.strictEqual(String(A),
                    '[[ 1, 2 ],\n' +
                    ' [ 3, 4 ]]');
            },

            "if passed an ndarray should return the array" : function () {
                var A = jsnum.asNDArray([[1, 2], [3, 4]]),
                    B = jsnum.asNDArray(A);

                assert.strictEqual(B, A);
            },

            "should use (tested) UntypedNDArray class" : function () {
                var A = jsnum.asNDArray([[1.5, 3.25], [5.125, 6], [7.5, 8.625]]),
                    B = jsnum.asNDArray(3);

                assert.ok(A instanceof jsnum.UntypedNDArray);
                assert.ok(B instanceof jsnum.UntypedNDArray);
            },

            "should not accept ragged arrays" : function () {
                assert.throws(function () {
                    jsnum.asNDArray([[1, 2], [3, 4, 5]]);
                }, TypeError, "first shorter");
                assert.throws(function () {
                    jsnum.asNDArray([[1, 2, 3], [4, 5]]);
                }, TypeError, "later shorter");
                assert.throws(function () {
                    jsnum.asNDArray([[[1, 2], 3], [4, 5]]);
                }, TypeError, "first element deeper");
                assert.throws(function () {
                    jsnum.asNDArray([[1, 2], [[3, 4], 5]]);
                }, TypeError, "later element deeper");
            },
        });


        test.createSuite("unit:miscUtils", {
            "should support checkShape" : function () {

                // should not throw with valid data
                jsnum.AbstractNDArray.checkShape([2, 3, 1, 6]);
                jsnum.AbstractNDArray.checkShape([]);

                assert.throws(function () { jsnum.AbstractNDArray.checkShape('a'); },
                    TypeError, "non-Array");
                assert.throws(function () { jsnum.AbstractNDArray.checkShape([1, 'a', 2]); },
                    TypeError, "non-numeric length");
                assert.throws(function () { jsnum.AbstractNDArray.checkShape([1, 3, 0]); },
                    RangeError, "zero length");
                assert.throws(function () { jsnum.AbstractNDArray.checkShape([-2, 3, 3]); },
                    RangeError, "negative length");
                assert.throws(function () {
                    jsnum.AbstractNDArray.checkShape([2, Number.NaN, 3]);
                }, RangeError, "nan length");
                assert.throws(function () { jsnum.AbstractNDArray.checkShape([2.5, 3, 3]); },
                    TypeError, "fractional length");
            },

            "should support eye" : function () {
                assert.deepEqual(jsnum.eye(1).toArray(), [[1]]);
                assert.deepEqual(jsnum.eye(2).toArray(), [[1, 0], [0, 1]]);
                assert.deepEqual(jsnum.eye(3).toArray(), [[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
            }
        });


        test.createSuite("unit:miscUtils:solveLinearSystem", {
            "should support vectors" : function () {
                var A = jsnum.asNDArray([[1, 3, 2], [5, 11, 13], [8, 2, 7]]),
                    x = jsnum.asNDArray([4, 5, 2]),
                    b = A.dot(x),
                    xNew = jsnum.solveLinearSystem(A, b);

                assert.ok(jsnum.areClose(x, xNew));
            },

            "should support matrices" : function () {
                var A = jsnum.asNDArray([[1, 3, 2], [5, 11, 13], [8, 2, 7]]),
                    X = jsnum.asNDArray([[4, 5], [2, 3], [5, 8]]),
                    B = A.dot(X),
                    XNew = jsnum.solveLinearSystem(A, B);

                assert.ok(jsnum.areClose(X, XNew));
            },

            "should use previous LU decomposition" : function () {
                var A = jsnum.asNDArray([[1, 3, 2], [5, 11, 13], [8, 2, 7]]),
                    X = jsnum.asNDArray([[4, 5], [2, 3], [5, 8]]),
                    B = A.dot(X),
                    x = jsnum.asNDArray([4, 5, 2]),
                    b = A.dot(x),
                    lu = A.LUDecomposition(),
                    xNew = jsnum.solveLinearSystem(lu, b),
                    XNew = jsnum.solveLinearSystem(lu, B);

                assert.ok(jsnum.areClose(x, xNew));
                assert.ok(jsnum.areClose(X, XNew));
            },

            "should check for incompatible shapes" : function () {
                var A = jsnum.asNDArray([[1, 3, 2], [5, 11, 13], [8, 2, 7]]),
                    B = jsnum.asNDArray([[4, 5, 2], [3, 5, 8]]),
                    b = jsnum.asNDArray([4, 5, 2, 8]);

                assert.throws(function () {
                    jsnum.solveLinearSystem(A, B);
                }, RangeError, "matrix");

                assert.throws(function () {
                    jsnum.solveLinearSystem(A, b);
                }, RangeError, "vector");
            },

            "should check for non-matrix arguments" : function () {
                var A = jsnum.asNDArray([[1, 3, 2], [5, 11, 13], [8, 2, 7]]),
                    X = jsnum.asNDArray([[4, 5], [2, 3], [5, 8]]),
                    B = A.dot(X);

                assert.throws(function () {
                    jsnum.solveLinearSystem("", B);
                }, TypeError, "A string");

                assert.throws(function () {
                    jsnum.solveLinearSystem(A, "");
                }, TypeError, "B string");
            }
        });


        test.createSuite("unit:miscUtils:areClose", {
            "should use abstol when out of range for reltol" : function () {
                assert.ok(!jsnum.areClose(1, 0.74, 0.25, 0.125));
                assert.ok(jsnum.areClose(1, 0.75, 0.25, 0.125));
                assert.ok(jsnum.areClose(1, 0.76, 0.25, 0.125));
                assert.ok(jsnum.areClose(1, 1.25, 0.25, 0.125));
                assert.ok(jsnum.areClose(1, 1.24, 0.25, 0.125));
                assert.ok(!jsnum.areClose(1, 1.26, 0.25, 0.125));
            },

            "should use reltol when out of range for abstol" : function () {
                assert.ok(!jsnum.areClose(100, 87.4, 0.25, 0.125));
                assert.ok(jsnum.areClose(100, 87.5, 0.25, 0.125));
                assert.ok(jsnum.areClose(100, 87.6, 0.25, 0.125));

                assert.ok(!jsnum.areClose(87.4, 100, 0.25, 0.125));
                assert.ok(jsnum.areClose(87.5, 100, 0.25, 0.125));
                assert.ok(jsnum.areClose(87.6, 100, 0.25, 0.125));
            },

            "should throw an exception if given negative tolerances" : function () {
                assert.throws(function () { jsnum.areClose(10, 11, 1, -1); },
                    RangeError);
                assert.throws(function () { jsnum.areClose(10, 11, -1, 1); },
                    RangeError);
            },

            "should use default reltol of 1e-9" : function () {
                assert.ok(!jsnum.areClose(100, 100 * (1 - 1.1e-9)));
                assert.ok(jsnum.areClose(100, 100 * (1 - 0.9e-9)));
            },

            "should use default abstol of 1e-9" : function () {
                assert.ok(!jsnum.areClose(0, 1.1e-9));
                assert.ok(jsnum.areClose(0, 0.9e-9));
            },

            "should support NDArrays" : function () {
                var A = jsnum.asNDArray([[1, 2], [3, 4]]),
                    B = jsnum.asNDArray([[1, 2.5], [3, 4]]);
                assert.ok(jsnum.areClose(A, B, 0.5));
                assert.ok(!jsnum.areClose(A, B, 0.4));
            },

            "should throw exception for non-arrays and non-numbers" : function () {
                var A = jsnum.asNDArray([[1, 2], [3, 4]]);
                assert.throws(function () { jsnum.areClose("a", "b"); },
                    TypeError);
                assert.throws(function () { jsnum.areClose(1, A); },
                    TypeError);
            },

            "should throw exception if arrays are different shapes" : function () {
                var A = jsnum.asNDArray([[1, 2], [3, 4]]),
                    B = jsnum.asNDArray([[1.5, 3.25], [5.125, 6], [7.5, 8.625]]),
                    C = jsnum.asNDArray([1, 2]);
                assert.throws(function () { jsnum.areClose(A, B); }, RangeError);
                assert.throws(function () { jsnum.areClose(C, A); }, RangeError);
            }
        });
    }
);
