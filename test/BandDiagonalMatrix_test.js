/*global define */
define(
    ['tools/test', 'tools/assert', 'src/jsnum'],
    function (test, assert, jsnum) {
        "use strict";

        test.createSuite("unit:BandDiagonalMatrix", {
            "should inherit from AbstractNDArray" : function () {
                var A = new jsnum.BandDiagonalMatrix(5, 1, 2);

                assert.ok(A instanceof jsnum.AbstractNDArray);
            },

            "should handle missing new" : function () {
                var A = jsnum.BandDiagonalMatrix(5, 1, 2);

                assert.ok(A instanceof jsnum.BandDiagonalMatrix);
                assert.ok(A instanceof jsnum.AbstractNDArray);
            },

            "should check that size is valid" : function () {
                assert.throws(
                    function() { var A = jsnum.BandDiagonalMatrix(0,0,0); },
                    RangeError,
                    "0"
                    );
                assert.throws(
                    function() { var A = jsnum.BandDiagonalMatrix("5",0,0); },
                    TypeError,
                    "\"5\""
                    );
                assert.throws(
                    function() { var A = jsnum.BandDiagonalMatrix(5.5,0,0); },
                    TypeError,
                    "5.5"
                    );
            },

            "should had valid shape" : function () {
                var A = new jsnum.BandDiagonalMatrix(5, 1, 2),
                    B = new jsnum.BandDiagonalMatrix(7, 1, 2);

                assert.deepEqual(A.shape, [5,5]);
                assert.deepEqual(B.shape, [7,7]);
            },

            "should implement basic array functionality" : function () {
                var A = new jsnum.BandDiagonalMatrix(5, 1, 2);

                A.setElement([0, 0], 1.0); // on the diagonal
                A.setElement([4, 4], 4.4); // on the diagonal
                A.setElement([3, 4], 1.2); // above the diagonal
                A.setElement([2, 0], 2.5); // below the diagonal
                A.setElement([3, 0], 0.0); // below band, but 0
                assert.strictEqual(A.getElement([0, 0]), 1.0);
                assert.strictEqual(A.getElement([4, 4]), 4.4);
                assert.strictEqual(A.getElement([3, 4]), 1.2);
                assert.strictEqual(A.getElement([2, 0]), 2.5);
                assert.strictEqual(A.getElement([1, 3]), 0.0,
                        "above band should default to zero");
                assert.strictEqual(A.getElement([4, 1]), 0.0,
                        "below band should default to zero");
                assert.strictEqual(A.setElement([0, 1], 2), A,
                    "set element is chainable");
                assert.throws(
                    function() { A.setElement([3,0], 1); },
                    RangeError,
                    "non-zero below band"
                    );
                assert.throws(
                    function() { A.setElement([2,4], -1); },
                    RangeError,
                    "non-zero above band"
                    );
                assert.deepEqual(A.shape, [5, 5]);
            },

            "getElement should call checkIndexes" : function () {
                var A = new jsnum.BandDiagonalMatrix(5, 1, 2);
                A.setElement([1, 2], 2.5);

                assert.calls(A, "checkIndexes", function () {
                    A.getElement([1, 2]);
                });
            },

            "setElement should call checkIndexes" : function () {
                var A = new jsnum.BandDiagonalMatrix(5, 1, 2);

                assert.calls(A, "checkIndexes", function () {
                    A.setElement([1, 2], 13);
                });
            },

            "shape should not be writable" : function () {
                var A = new jsnum.BandDiagonalMatrix(5, 1, 2);

                assert.strictEqual(Object.getOwnPropertyDescriptor(A, "shape").
                        writable, false);
            },

/*
            "should support 0D array" : function () {
                var A = new jsnum.BandDiagonalMatrix([]);

                A.setElement([], 3.5);
                assert.strictEqual(A.getElement([]), 3.5);
                assert.deepEqual(A.shape, []);
            },

            "should call checkShape" : function () {
                assert.calls(jsnum.AbstractNDArray, "checkShape", function () {
                    return new jsnum.BandDiagonalMatrix([3]);
                });
            },

            "should make a copy of shape" : function () {
                var myShape = [2, 4],
                    A = new jsnum.BandDiagonalMatrix(myShape);

                myShape[1] = 8;
                assert.deepEqual(A.shape, [2, 4]);
            }
            */
        });
    }
);
