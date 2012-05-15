/*global define */
define(
    ['tools/test', 'tools/assert', 'src/jsn'],
    function (test, assert, jsn) {
        "use strict";

        test.createSuite("unit:AbstractNDArray:utilities", {
            "should have virtual methods" : function () {
                assert.throws(
                    function () {
                        var A = new jsn.AbstractNDArray();
                    },
                    TypeError,
                    "can't instantiate"
                );

                assert.throws(
                    function () {
                        jsn.AbstractNDArray.prototype.getElement([1, 1]);
                    },
                    TypeError,
                    "abstract get"
                );

                assert.throws(
                    function () {
                        jsn.AbstractNDArray.prototype.setElement([1, 1], 1);
                    },
                    TypeError,
                    "abstract set"
                );

                assert.strictEqual(jsn.AbstractNDArray.prototype.shape,
                    undefined);
            },

            "should support checkIndexes" : function () {
                var A = jsn.asNDArray([[[[1.5], [3.25]], [[5.125], [6]]],
                    [[[7.5], [8.625]], [[9.25], [10.125]]]]),
                    result;

                // should not throw with valid data
                result = A.checkIndexes([1, 0, 1, 0]);
                assert.strictEqual(result, A);

                assert.throws(function () { A.checkIndexes([0, 0, 0]); },
                    RangeError, "too few indices");
                A.checkIndexes([0, 0, 0], { allowUndefined : true });

                assert.throws(
                    function () { A.checkIndexes([1, 1, 1, 0, 0]); },
                    RangeError,
                    "too many indices"
                );
                assert.throws(function () { A.checkIndexes([1, 'a', 0, 0]); },
                    TypeError, "non-numeric index");
                assert.throws(
                    function () { A.checkIndexes([1, undefined, 0, 0]); },
                    TypeError,
                    "non-numeric index"
                );
                A.checkIndexes([1, undefined, 0, 0],
                    { allowUndefined : true });
                assert.throws(function () { A.checkIndexes('a'); },
                    TypeError, "non-list");

                assert.throws(function () { A.checkIndexes([1, 0, -1, 0]); },
                    RangeError, "negative index");
                assert.throws(function () { A.checkIndexes([1, 0, 1, 1]); },
                    RangeError, "index too large");
                assert.throws(function () { A.checkIndexes([1, 0.2, 1, 0]); },
                    TypeError, "fractional index");
                assert.throws(function () {
                    A.checkIndexes([1, Number.NaN, 1, 0]);
                }, RangeError, "nan index");
            },

            "should support walkIndexes" : function () {
                var A = jsn.asNDArray([[[1.5, 2, 4 ], [3.25, 5, 3]], [[5.125, 6, 1 ], [ 6, 23, 2 ]]]),
                    totalCalls = 0,
                    result;

                // replace every element with "A"
                result = A.walkIndexes(function (index) {
                    this.setElement(index, "A");
                    totalCalls += 1;
                });

                assert.strictEqual(result, A); // chainable
                assert.strictEqual(String(A),
                    '[\n' +
                    ' [[ A, A, A ],\n' +
                    '  [ A, A, A ]],\n' +
                    '\n' +
                    ' [[ A, A, A ],\n' +
                    '  [ A, A, A ]]\n' +
                    ']');
                assert.strictEqual(totalCalls, 12);
            },

            "should support createResult using untyped array" : function () {
                var A = jsn.asNDArray([10.125, 3]),
                    B = A.createResult([3, 5]);

                assert.ok(B instanceof jsn.UntypedNDArray);
                assert.deepEqual(B.shape, [3, 5]);
            },

            "should support copy" : function () {
                var A = jsn.asNDArray([[1, 2], [3, 4]]),
                    B = A.copy();

                A.setElement([0, 1], 5);
                B.setElement([1, 0], 7);
                assert.strictEqual(String(A),
                    '[[ 1, 5 ],\n' +
                    ' [ 3, 4 ]]');
                assert.strictEqual(String(B),
                    '[[ 1, 2 ],\n' +
                    ' [ 7, 4 ]]');
            },

            "should support toArray" : function () {
                var A = jsn.asNDArray([[1, 5], [3, 4]]);
                assert.deepEqual(A.toArray(), [[1, 5], [3, 4]]);
            }
        });

        test.createSuite("unit:AbstractNDArray:views", {
            "should support collapse" : function () {
                var A = jsn.asNDArray([[[[1.5], [3.25]], [[5.125], [6]]],
                    [[[7.5], [8.625]], [[9.25], [10.125]]]]);

                assert.strictEqual(String(A.collapse([1])),
                    '[\n' +
                    ' [[    7.5 ],\n' +
                    '  [  8.625 ]],\n' +
                    '\n' +
                    ' [[   9.25 ],\n' +
                    '  [ 10.125 ]]\n' +
                    ']');

                //assert.strictEqual(String(A.collapse([,,0,0])),
                assert.strictEqual(
                    String(A.collapse([undefined, undefined, 0, 0])),
                    '[[   1.5, 5.125 ],\n' +
                        ' [   7.5,  9.25 ]]'
                );

                assert.strictEqual(String(A.collapse([1, 1, 0, 0])),
                    '( 9.25 )');
            },

            "collapse should support setElement" : function () {
                var A = jsn.asNDArray(
                    [[1.5, 3.25], [5.125, 6.125], [7.5, 8.625]]
                ),
                    B = A.collapse([undefined, 1]);

                B.setElement([1], 2);

                assert.strictEqual(String(B),
                    '[  3.25,     2, 8.625 ]');
                assert.strictEqual(String(A),
                    '[[   1.5,  3.25 ],\n' +
                    ' [ 5.125,     2 ],\n' +
                    ' [   7.5, 8.625 ]]');
                assert.strictEqual(B.setElement([0], 3), B,
                    "set element is chainable");
            },

            "collapse should not track original index array" : function () {
                var A = jsn.asNDArray([[1.5, 3.25],
                    [5.125, 6.125], [7.5, 8.625]]),
                    l = [undefined, 1],
                    B = A.collapse(l);

                l[1] = 0;
                assert.strictEqual(String(B),
                    '[  3.25, 6.125, 8.625 ]');
            },

            "collapse should call checkIndexes" : function () {
                var A = jsn.asNDArray([[1.5, 3.25],
                    [5.125, 6.125], [7.5, 8.625]]);

                assert.calls(A, "checkIndexes", function () {
                    A.collapse([1, 0]);
                });
            },


            "collapse(...).getElement should call check indexes" :
                function () {

                    var A = jsn.asNDArray([[[[1.5], [3.25]], [[5.125], [6]]],
                        [[[7.5], [8.625]], [[9.25], [10.125]]]]),
                        B = A.collapse([1, undefined, 1]);

                    assert.calls(B, "checkIndexes", function () {
                        B.getElement([1, 0]);
                    });
                },

            "collapse(...).setElement should call check indexes" :
                function () {

                    var A = jsn.asNDArray([[[[1.5], [3.25]], [[5.125], [6]]],
                        [[[7.5], [8.625]], [[9.25], [10.125]]]]),
                        B = A.collapse([1, undefined, 1]);

                    assert.calls(B, "checkIndexes", function () {
                        B.setElement([1, 0], 3);
                    });
                },

            "collapse(...).shape should not be writable" : function () {
                var A = jsn.asNDArray([[[[1.5], [3.25]], [[5.125], [6]]],
                    [[[7.5], [8.625]], [[9.25], [10.125]]]]),
                    B = A.collapse([1, undefined, 1]);

                assert.throws(function () { B.shape = [1, 1]; });
            },
        });

        test.createSuite("unit:AbstractNDArray:matrix_operations:dot", {
            "should support dot product between vectors" : function () {
                var A = jsn.asNDArray([1, 3, 5]),
                    B = jsn.asNDArray([7, 2, 9]);
                assert.strictEqual(String(A.dot(B)), '( 58 )');
            },

            "should support matrix product between a matrix and a vector" : function () {
                var A = jsn.asNDArray([[1, 3, 2], [5, 11, 13]]),
                    B = jsn.asNDArray([7, 2, 1]);
                assert.strictEqual(String(A.dot(B)), '[ 15, 70 ]');
            },

            "should support matrix product between a vector and a matrix" : function () {
                var A = jsn.asNDArray([7, 2, 1]),
                    B = jsn.asNDArray([[1, 3], [5, 11], [2, 13]]);
                assert.strictEqual(String(A.dot(B)), '[ 19, 56 ]');
            },

            "should support matrix product between matrixes" : function () {
                var A = jsn.asNDArray([[1, 2, 3], [4, 5, 6], [7, 8, 9]]),
                    B = jsn.asNDArray([[1.5, 2.5, 3.5], [4.5, 5.5, 6.5], [7.5, 8.5, 9.5]]);
                assert.strictEqual(String(A.dot(B)),
                    '[[    33,    39,    45 ],\n' +
                    ' [  73.5,  88.5, 103.5 ],\n' +
                    ' [   114,   138,   162 ]]');
            },

            "should throw an exception if matrix shapes are not compatible" : function () {
                assert.throws(function () {
                    var A = jsn.asNDArray([1, 3]),
                        B = jsn.asNDArray([7, 2, 9]);
                    A.dot(B);
                }, RangeError, "vector-vector");

                assert.throws(function () {
                    var A = jsn.asNDArray([1, 3, 5]),
                        B = jsn.asNDArray([[1, 3, 2], [5, 11, 13]]);
                    A.dot(B);
                }, RangeError, "vector-matrix");

                assert.throws(function () {
                    var A = jsn.asNDArray([[1, 3, 2], [5, 11, 13]]),
                        B = jsn.asNDArray([[1, 3, 2], [5, 11, 13]]);
                    A.dot(B);
                }, RangeError, "matrix-matrix");
            }
        });

        test.createSuite("unit:AbstractNDArray:math_ops", {
            "should support swap" : function () {
                var A = jsn.asNDArray([[1, 3, 5], [4, 6, 8]]),
                    B = jsn.asNDArray([[7, 2, 9], [6, 11, 4]]);

                A.swap(B);

                assert.deepEqual(A.toArray(), [[7, 2, 9], [6, 11, 4]]);
                assert.deepEqual(B.toArray(), [[1, 3, 5], [4, 6, 8]]);
            },

            "should support abs" : function () {
                var A = jsn.asNDArray([[-1, 3, -5], [4, -6, 8]]);
                assert.deepEqual(A.abs().toArray(), [[1, 3, 5], [4, 6, 8]]);
            },

            "should support reciprocal" : function () {
                var A = jsn.asNDArray([[-1, 2, 0.25], [0.125, -8, 4]]);
                assert.deepEqual(A.reciprocal().toArray(), [[-1, 0.5, 4], [8, -0.125, 0.25]]);
            },

            "should support addHere" : function () {
                var A = jsn.asNDArray([[1, 3, 5], [4, 6, 8]]),
                    B = jsn.asNDArray([[7, 2, 9], [6, 11, 4]]);

                assert.strictEqual(A.addHere(B), A);
                assert.strictEqual(String(A),
                    '[[  8,  5, 14 ],\n' +
                    ' [ 10, 17, 12 ]]');
                assert.deepEqual(B.addHere(3).toArray(), [[10, 5, 12], [9, 14, 7]]);
            },

            "should support add" : function () {
                var A = jsn.asNDArray([[1, 3, 5], [4, 6, 8]]),
                    B = jsn.asNDArray([[7, 2, 9], [6, 11, 4]]);

                assert.strictEqual(String(A.add(B)),
                    '[[  8,  5, 14 ],\n' +
                    ' [ 10, 17, 12 ]]');
            },

            "should support subHere" : function () {
                var A = jsn.asNDArray([[1, 3, 5], [4, 6, 8]]),
                    B = jsn.asNDArray([[7, 2, 9], [6, 11, 4]]);

                assert.strictEqual(A.subHere(B), A);
                assert.strictEqual(String(A),
                    '[[ -6,  1, -4 ],\n' +
                    ' [ -2, -5,  4 ]]');
                assert.deepEqual(B.subHere(3).toArray(), [[4, -1, 6], [3, 8, 1]]);
            },

            "should support sub" : function () {
                var A = jsn.asNDArray([[1, 3, 5], [4, 6, 8]]),
                    B = jsn.asNDArray([[7, 2, 9], [6, 11, 4]]);

                assert.strictEqual(String(A.sub(B)),
                    '[[ -6,  1, -4 ],\n' +
                    ' [ -2, -5,  4 ]]');
            },

            "should support mulHere" : function () {
                var A = jsn.asNDArray([[1, 3, 5], [4, 6, 8]]),
                    B = jsn.asNDArray([[7, 2, 9], [6, 11, 4]]);

                assert.strictEqual(A.mulHere(B), A);
                assert.strictEqual(String(A),
                    '[[  7,  6, 45 ],\n' +
                    ' [ 24, 66, 32 ]]');
                assert.deepEqual(B.mulHere(2).toArray(), [[14, 4, 18], [12, 22, 8]]);
            },

            "should support mul" : function () {
                var A = jsn.asNDArray([[1, 3, 5], [4, 6, 8]]),
                    B = jsn.asNDArray([[7, 2, 9], [6, 11, 4]]);

                assert.strictEqual(String(A.mul(B)),
                    '[[  7,  6, 45 ],\n' +
                    ' [ 24, 66, 32 ]]');
            },

            "should support divHere" : function () {
                var A = jsn.asNDArray([[1, 3, 5], [4, 6, 8]]),
                    B = jsn.asNDArray([[2, 4, 8], [0.5, 0.25, 4]]);

                assert.strictEqual(A.divHere(B), A);
                assert.strictEqual(String(A),
                    '[[   0.5,  0.75, 0.625 ],\n' +
                    ' [     8,    24,     2 ]]');
                assert.deepEqual(B.divHere(2).toArray(), [[1, 2, 4], [0.25, 0.125, 2]]);
            },

            "should support div" : function () {
                var A = jsn.asNDArray([[1, 3, 5], [4, 6, 8]]),
                    B = jsn.asNDArray([[2, 4, 8], [0.5, 0.25, 4]]);

                assert.strictEqual(String(A.div(B)),
                    '[[   0.5,  0.75, 0.625 ],\n' +
                    ' [     8,    24,     2 ]]');
            },

            "should support negHere" : function () {
                var A = jsn.asNDArray([[1, -3, 5], [4, 6, 8]]);

                assert.strictEqual(A.negHere(), A);
                assert.strictEqual(String(A),
                    '[[ -1,  3, -5 ],\n' +
                    ' [ -4, -6, -8 ]]');
            },

            "should support neg" : function () {
                var A = jsn.asNDArray([[1, -3, 5], [4, 6, 8]]);

                assert.strictEqual(String(A.neg()),
                    '[[ -1,  3, -5 ],\n' +
                    ' [ -4, -6, -8 ]]');
            }
        });
    }
);
