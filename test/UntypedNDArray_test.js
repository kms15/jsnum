/*global define */
define(
    ['tools/test', 'tools/assert', 'src/jsnum'],
    function (test, assert, jsnum) {
        "use strict";

        test.createSuite("unit:UntypedNDArray", {
            "should inherit from AbstractNDArray" : function () {
                var A = new jsnum.UntypedNDArray([2, 3]);

                assert.ok(A instanceof jsnum.AbstractNDArray);
            },

            "should handle missing new" : function () {
                var A = jsnum.UntypedNDArray([2, 3]);

                assert.ok(A instanceof jsnum.AbstractNDArray);
            },

            "should implement basic array functionality" : function () {
                var A = new jsnum.UntypedNDArray([2, 3]);

                A.setElement([1, 2], 2.5);
                A.setElement([0, 0], "a");
                assert.strictEqual(A.getElement([1, 2]), 2.5);
                assert.strictEqual(A.getElement([0, 0]), "a");
                assert.strictEqual(A.setElement([0, 1], 2), A,
                    "set element is chainable");
                assert.deepEqual(A.shape, [2, 3]);
            },

            "should support 0D array" : function () {
                var A = new jsnum.UntypedNDArray([]);

                A.setElement([], 3.5);
                assert.strictEqual(A.getElement([]), 3.5);
                assert.deepEqual(A.shape, []);
            },

            "getElement should call checkIndexes" : function () {
                var A = new jsnum.UntypedNDArray([2, 3, 6]);
                A.setElement([1, 2, 3], 2.5);

                assert.calls(A, "checkIndexes", function () {
                    A.getElement([1, 2, 3]);
                });
            },

            "setElement should call checkIndexes" : function () {
                var A = new jsnum.UntypedNDArray([3]);

                assert.calls(A, "checkIndexes", function () {
                    A.setElement([2], 13);
                });
            },

            "shape should not be writable" : function () {
                var A = new jsnum.UntypedNDArray([2, 3]);

                assert.strictEqual(Object.getOwnPropertyDescriptor(A, "shape").
                        writable, false);
            },

            "should call checkShape" : function () {
                assert.calls(jsnum.AbstractNDArray, "checkShape", function () {
                    var A = new jsnum.UntypedNDArray([3]);
                });
            },

            "should make a copy of shape" : function () {
                var myShape = [2, 4],
                    A = new jsnum.UntypedNDArray(myShape);

                myShape[1] = 8;
                assert.deepEqual(A.shape, [2, 4]);
            },
        });
    }
);
