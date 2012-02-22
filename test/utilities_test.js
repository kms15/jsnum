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
                var A = jsn.asNDArray([[1.5, 3.25], [5.125, 6], [7.5, 8.625]]);

                assert.strictEqual(String(A),
                    '[[   1.5,  3.25 ],\n' +
                    ' [ 5.125,     6 ],\n' +
                    ' [   7.5, 8.625 ]]');
                assert.strictEqual(String(A.shape), '3,2');
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

            "if passed an ndarray should return the array" : function () {
                var A = jsn.asNDArray([[1, 2], [3, 4]]),
                    B = jsn.asNDArray(A);

                assert.strictEqual(B, A);
            },

            "should support getElement" : function () {
                var A = jsn.asNDArray([[1.5, 3.25], [5.125, 6], [7.5, 8.625]]);
                assert.strictEqual(A.getElement([1, 0]), 5.125);
                assert.strictEqual(A.getElement([2, 1]), 8.625);
            },

            "should support setElement" : function () {
                var A = jsn.asNDArray([[1.5, 3.25], [5.125, 6], [7.5, 8.625]]);
                A.setElement([1, 0], 3.125);
                assert.strictEqual(A.getElement([1, 0]), 3.125);
                assert.strictEqual(A.getElement([2, 1]), 8.625);
            },

            "getElement should call checkIndexes" : function () {
                var A = jsn.asNDArray([[1.5, 3.25], [5.125, 6], [7.5, 8.625]]);

                assert.calls(A, "checkIndexes", function () {
                    A.getElement([1, 0]);
                });
            },

            "setElement should call checkIndexes" : function () {
                var A = jsn.asNDArray([[1.5, 3.25], [5.125, 6], [7.5, 8.625]]);

                assert.calls(A, "checkIndexes", function () {
                    A.setElement([1, 0], 2);
                });
            },

            "shape should not be writable" : function () {
                var A = jsn.asNDArray([[1.5, 3.25], [5.125, 6], [7.5, 8.625]]);

                assert.throws(function () { A.shape = [1, 1]; });
            },

        });
    }
);
