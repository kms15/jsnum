/*global define */
define(
    ['tools/test', 'tools/assert', 'src/jsnum'],
    function (test, assert, jsnum) {
        "use strict";

        test.createSuite("unit:AbstractNDArray:utilities", {
            "should have virtual methods" : function () {
                assert.throws(
                    function () {
                        var A = new jsnum.AbstractNDArray();
                    },
                    TypeError,
                    "can't instantiate"
                );

                assert.throws(
                    function () {
                        jsnum.AbstractNDArray.prototype.getElement([1, 1]);
                    },
                    TypeError,
                    "abstract get"
                );

                assert.throws(
                    function () {
                        jsnum.AbstractNDArray.prototype.setElement([1, 1], 1);
                    },
                    TypeError,
                    "abstract set"
                );

                assert.strictEqual(jsnum.AbstractNDArray.prototype.shape,
                    undefined);
            },


            "should support walkIndexes" : function () {
                var A = jsnum.asNDArray([[[1.5, 2, 4 ], [3.25, 5, 3]], [[5.125, 6, 1 ], [ 6, 23, 2 ]]]),
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

            "should support hasShape" : function () {
                var A = jsnum.asNDArray([[[1.5, 2, 4 ], [3.25, 5, 3]], [[5.125, 6, 1 ], [ 6, 23, 2 ]]]),
                    B = jsnum.asNDArray(4);
                assert.ok(A.hasShape([2, 2, 3]), "match");
                assert.ok(!A.hasShape([2, 3, 3]), "non-match");
                assert.ok(!A.hasShape([2, 2]), "too few dimensions");
                assert.ok(!A.hasShape([2, 2, 3, 1]), "too many dimensions");
                assert.ok(B.hasShape([]), "0-D case");
                assert.ok(!B.hasShape([1]), "0-D case, non-match");
            },

            "should support createResult using untyped array" : function () {
                var A = jsnum.asNDArray([10.125, 3]),
                    B = A.createResult([3, 5]);

                assert.ok(B instanceof jsnum.UntypedNDArray);
                assert.deepEqual(B.shape, [3, 5]);
            },

            "should support copy" : function () {
                var A = jsnum.asNDArray([[1, 2], [3, 4]]),
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
                var A = jsnum.asNDArray([[1, 5], [3, 4]]);
                assert.deepEqual(A.toArray(), [[1, 5], [3, 4]]);
            },

            "should support isReadOnly" : function () {
                var A = jsnum.asNDArray([[1, 5], [3, 4]]);

                assert.ok(!A.isReadOnly());
                A.setElement = jsnum.AbstractNDArray.prototype.setElement;
                assert.ok(A.isReadOnly());
            },

            "should support val" : function () {
                var A = jsnum.asNDArray([[1, 5], [3, 4]]),
                    B = jsnum.asNDArray(7);

                assert.strictEqual(A.val([0, 1]), 5, "with index");
                assert.strictEqual(B.val(), 7, "without index");
                assert.strictEqual(A.val([-1, 1]), 4, "negative index 1");
                assert.strictEqual(A.val([1, -2]), 3, "negative index 2");
            },

            "val should call checkIndexes" : function () {
                var A = jsnum.asNDArray([[1, 5], [3, 4]]);

                A.getElement = function () {};
                assert.calls(A, "checkIndexes", function () {
                    A.val([1, 0]);
                });
            },

            "should support set" : function () {
                var A = jsnum.asNDArray([[1, 3, 5], [4, 6, 8]]),
                    B = jsnum.asNDArray([[2, 4, 1], [7, 5, 11]]),
                    result;

                result = A.set(B);
                assert.deepEqual(A.toArray(), B.toArray());
                assert.strictEqual(result, A); // chainable

                result = A.set(3);
                assert.deepEqual(result.toArray(), [[3, 3, 3], [3, 3, 3]]);
                assert.strictEqual(result, A); // chainable
            },

            "set should throw on invalid arguments" : function () {
                var A = jsnum.asNDArray([[1, 3, 5], [4, 6, 8]]);

                assert.throws(function () {
                    A.set(jsnum.asNDArray([[1, 3, 5, 4], [4, 6, 8, 9]]));
                }, RangeError, "wrong shape");
            }
        });


        test.createSuite("unit:AbstractNDArray:utilities:checkIndexes", {
            "should allow valid numeric indexes" : function () {
                var A = jsnum.asNDArray([[[[1.5], [3.25]], [[5.125], [6]]],
                    [[[7.5], [8.625]], [[9.25], [10.125]]]]),
                    result;

                assert.strictEqual(A.checkIndexes([1, 0, 1, 0]), A); // chainable
                A.checkIndexes([1, 0, -1, 0]); // negative indexes
                A.checkIndexes([-1, -2, 1, -1]); // negative indexes
                A.checkIndexes([1, 0, 1, 0], { nonnegative: true });
            },

            "should throw on value out of range" : function () {
                var A = jsnum.asNDArray([[[[1.5], [3.25]], [[5.125], [6]]],
                    [[[7.5], [8.625]], [[9.25], [10.125]]]]);

                assert.throws(function () { A.checkIndexes([1, 0, 1, 1]); },
                    RangeError, "index too large");
                assert.throws(function () { A.checkIndexes([1, 0, -1, 0], { nonnegative: true }); },
                    RangeError, "index negative");
                assert.throws(function () { A.checkIndexes([1, 0, -3, 0]); },
                    RangeError, "index too negative");
                assert.throws(function () { A.checkIndexes([1, 0.2, 1, 0]); },
                    TypeError, "fractional index");
                assert.throws(function () {
                    A.checkIndexes([1, Number.NaN, 1, 0]);
                }, RangeError, "nan index");
            },

            "should support negativeIndexes" : function () {
                var A = jsnum.asNDArray([[[[1.5], [3.25]], [[5.125], [6]]],
                    [[[7.5], [8.625]], [[9.25], [10.125]]]]);

                A.checkIndexes([1, 0, -2, 0]);
            },

            "should throw with incorrect number of indexes" : function () {
                var A = jsnum.asNDArray([[[[1.5], [3.25]], [[5.125], [6]]],
                    [[[7.5], [8.625]], [[9.25], [10.125]]]]);

                assert.throws(function () { A.checkIndexes([0, 0, 0]); },
                    RangeError, "too few indices");

                assert.throws(
                    function () { A.checkIndexes([1, 1, 1, 0, 0]); },
                    RangeError,
                    "too many indices"
                );
            },

            "should throw with non-numeric indexes" : function () {
                var A = jsnum.asNDArray([[[[1.5], [3.25]], [[5.125], [6]]],
                    [[[7.5], [8.625]], [[9.25], [10.125]]]]);

                assert.throws(function () { A.checkIndexes([1, '3', 0, 0]); },
                    TypeError, "string index");
                assert.throws(function () { A.checkIndexes([[1, 2], 0, 0, 0]); },
                    TypeError, "array index");
                assert.throws(
                    function () { A.checkIndexes([1, undefined, 0, 0]); },
                    TypeError,
                    "undefined index"
                );
                assert.throws(function () { A.checkIndexes('a'); },
                    TypeError, "non-list");
            },

            "should support allowUndefined" : function () {
                var A = jsnum.asNDArray([[[[1.5], [3.25]], [[5.125], [6]]],
                    [[[7.5], [8.625]], [[9.25], [10.125]]]]);

                A.checkIndexes([0, 0, 0], { allowUndefined : true });
                A.checkIndexes([1, undefined, 0, 0],
                    { allowUndefined : true });
            },

            "should support allowDummy" : function () {
                var A = jsnum.asNDArray([[[[1.5], [3.25]], [[5.125], [6]]],
                    [[[7.5], [8.625]], [[9.25], [10.125]]]]);

                A.checkIndexes([1, '3', 0, 0],
                    { allowDummy : true, allowUndefined : true });
                A.checkIndexes([1, '3', 0, 0, 0], { allowDummy : true });
                A.checkIndexes([1, 0, 0, 0, '3'], { allowDummy : true });
                jsnum.asNDArray([[1], [3], [4]]).checkIndexes([1, "3", 0],
                    { allowDummy : true });
                jsnum.asNDArray(2).checkIndexes(["4"], { allowDummy : true });
                assert.throws(
                    function () {
                        A.checkIndexes([1, '3a', 0, 0], { allowDummy : true });
                    },
                    TypeError,
                    "non-numeric index with allowDummy = true"
                );
                assert.throws(
                    function () {
                        var B = jsnum.asNDArray([[1], [3], [4]]);
                        B.checkIndexes([0, "3", 1],
                            { allowDummy : true });
                    },
                    RangeError,
                    "should test length of correct dimension with dummy"
                );
            },

            "should support allowRange" : function () {
                var A = jsnum.asNDArray([[[[1.5], [3.25]], [[5.125], [6]]],
                    [[[7.5], [8.625]], [[9.25], [10.125]]]]);

                A.checkIndexes([[1, 2], 0, 0, 0], { allowRange: true });
                A.checkIndexes([[-2, -1], 0, 0, 0], { allowRange: true });
                A.checkIndexes([0, [undefined, 1], 0, 0], { allowRange: true });
                A.checkIndexes([0, [1, undefined], 0, 0], { allowRange: true });
                A.checkIndexes([0, [undefined, undefined], 0, 0], { allowRange: true });
                assert.throws(function () {
                    A.checkIndexes([[1, 5], 0, 1, 0], { allowRange: true });
                }, RangeError, "max too large");
                assert.throws(function () {
                    A.checkIndexes([[-3, 2], 0, 1, 0], { allowRange: true });
                }, RangeError, "min too negative");
                assert.throws(function () {
                    A.checkIndexes([[1, 0], 0, 1, 0], { allowRange: true });
                }, RangeError, "min > max");
                assert.throws(function () {
                    A.checkIndexes([[1, 1], 0, 1, 0], { allowRange: true });
                }, RangeError, "min == max");
                assert.throws(function () {
                    A.checkIndexes([["0", 2], 0, 1, 0], { allowRange: true });
                }, TypeError, "min not a number");
                assert.throws(function () {
                    A.checkIndexes([[0, "2"], 0, 1, 0], { allowRange: true });
                }, TypeError, "max not a number");
                assert.throws(function () {
                    A.checkIndexes([[0, 1, 2], 0, 1, 0], { allowRange: true });
                }, RangeError, "too many numbers in range");
            }
        });


        test.createSuite("unit:AbstractNDArray:views:at", {
            "should support at" : function () {
                var A = jsnum.asNDArray([[[[1.5], [3.25]], [[5.125], [6]]],
                    [[[7.5], [8.625]], [[9.25], [10.125]]]]);

                assert.strictEqual(String(A.at([1])),
                    '[\n' +
                    ' [[    7.5 ],\n' +
                    '  [  8.625 ]],\n' +
                    '\n' +
                    ' [[   9.25 ],\n' +
                    '  [ 10.125 ]]\n' +
                    ']');

                assert.strictEqual(
                    String(A.at([undefined, undefined, 0, 0])),
                    '[[   1.5, 5.125 ],\n' +
                        ' [   7.5,  9.25 ]]'
                );

                assert.strictEqual(String(A.at([1, 1, 0, 0])),
                    '( 9.25 )');
            },

            "at should support setElement" : function () {
                var A = jsnum.asNDArray(
                    [[1.5, 3.25], [5.125, 6.125], [7.5, 8.625]]
                ),
                    B = A.at([undefined, 1]);

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

            "at should support negative indexes" : function () {
                var A = jsnum.asNDArray(
                    [[1.5, 3.25], [5.125, 6.125], [7.5, 8.625]]
                );

                assert.strictEqual(A.at([undefined, -1]).toString(),
                    '[  3.25, 6.125, 8.625 ]');
            },

            "at should respect isReadOnly" : function () {
                assert.ok(jsnum.eye(3).at([1]).isReadOnly());
            },

            "at should not track original index array" : function () {
                var A = jsnum.asNDArray([[1.5, 3.25],
                    [5.125, 6.125], [7.5, 8.625]]),
                    l = [undefined, 1],
                    B = A.at(l);

                l[1] = 0;
                assert.strictEqual(String(B),
                    '[  3.25, 6.125, 8.625 ]');
            },

            "at should call checkIndexes" : function () {
                var A = jsnum.asNDArray([[1.5, 3.25],
                    [5.125, 6.125], [7.5, 8.625]]);

                assert.calls(A, "checkIndexes", function () {
                    A.at([1, 0]);
                });
            },


            "at(...).getElement should call check indexes" :
                function () {

                    var A = jsnum.asNDArray([[[[1.5], [3.25]], [[5.125], [6]]],
                        [[[7.5], [8.625]], [[9.25], [10.125]]]]),
                        B = A.at([1, undefined, 1]);

                    assert.calls(B, "checkIndexes", function () {
                        B.getElement([1, 0]);
                    });
                },

            "at(...).setElement should call check indexes" :
                function () {

                    var A = jsnum.asNDArray([[[[1.5], [3.25]], [[5.125], [6]]],
                        [[[7.5], [8.625]], [[9.25], [10.125]]]]),
                        B = A.at([1, undefined, 1]);

                    assert.calls(B, "checkIndexes", function () {
                        B.setElement([1, 0], 3);
                    });
                },

            "at(...).shape should not be writable" : function () {
                var A = jsnum.asNDArray([[[[1.5], [3.25]], [[5.125], [6]]],
                    [[[7.5], [8.625]], [[9.25], [10.125]]]]),
                    B = A.at([1, undefined, 1]);

                assert.throws(function () { B.shape = [1, 1]; });
            },

            "at should support dummy indexes" : function () {
                var A = jsnum.asNDArray([[1.5, 3.25], [5.125, 6.125]]),
                    B = A.at([undefined, "4", undefined]),
                    C = A.at([undefined, "3", 1]),
                    D = A.at([1, 0, "3"]);

                assert.deepEqual(B.shape, [2, 4, 2]);
                assert.deepEqual(B.toArray(), [
                    [[1.5, 3.25], [1.5, 3.25], [1.5, 3.25], [1.5, 3.25]],
                    [[5.125, 6.125], [5.125, 6.125], [5.125, 6.125], [5.125, 6.125]]
                ]);
                assert.deepEqual(C.shape, [2, 3]);
                assert.deepEqual(C.toArray(),
                    [[3.25, 3.25, 3.25], [6.125, 6.125, 6.125]]);
                assert.deepEqual(D.shape, [3]);
                assert.deepEqual(D.toArray(), [5.125, 5.125, 5.125]);
            },

            "at should support ranges" : function () {
                var A = jsnum.asNDArray([[1, 3, 2], [5, 11, 13]]);

                assert.deepEqual(A.at([[1, 2]]).toArray(),
                        [[5, 11, 13]], "first index");
                assert.deepEqual(A.at([undefined, [0, 2]]).toArray(),
                        [[1, 3], [5, 11]], "second index");
                assert.deepEqual(A.at([[0, 2], [0, 2]]).toArray(),
                        [[1, 3], [5, 11]], "two indexes");
                assert.deepEqual(A.at([[undefined, 1]]).toArray(),
                        [[1, 3, 2]], "undefined first index");
                assert.deepEqual(A.at([undefined, [1, undefined]]).toArray(),
                        [[3, 2], [11, 13]], "undefined second index");
                assert.deepEqual(A.at([1, [1, undefined]]).toArray(),
                        [11, 13], "fixed first index, undefined second index");
            }
        });


        test.createSuite("unit:AbstractNDArray:matrix_operations:dot", {
            "should support dot product between vectors" : function () {
                var A = jsnum.asNDArray([1, 3, 5]),
                    B = jsnum.asNDArray([7, 2, 9]);
                assert.strictEqual(String(A.dot(B)), '( 58 )');
            },

            "should support matrix product between a matrix and a vector" : function () {
                var A = jsnum.asNDArray([[1, 3, 2], [5, 11, 13]]),
                    B = jsnum.asNDArray([7, 2, 1]);
                assert.strictEqual(String(A.dot(B)), '[ 15, 70 ]');
            },

            "should support matrix product between a vector and a matrix" : function () {
                var A = jsnum.asNDArray([7, 2, 1]),
                    B = jsnum.asNDArray([[1, 3], [5, 11], [2, 13]]);
                assert.strictEqual(String(A.dot(B)), '[ 19, 56 ]');
            },

            "should support matrix product between matrixes" : function () {
                var A = jsnum.asNDArray([[1, 2, 3], [4, 5, 6], [7, 8, 9]]),
                    B = jsnum.asNDArray([[1.5, 2.5, 3.5], [4.5, 5.5, 6.5], [7.5, 8.5, 9.5]]);
                assert.strictEqual(String(A.dot(B)),
                    '[[    33,    39,    45 ],\n' +
                    ' [  73.5,  88.5, 103.5 ],\n' +
                    ' [   114,   138,   162 ]]');
            },

            "should throw an exception if matrix shapes are not compatible" : function () {
                assert.throws(function () {
                    var A = jsnum.asNDArray([1, 3]),
                        B = jsnum.asNDArray([7, 2, 9]);
                    A.dot(B);
                }, RangeError, "vector-vector");

                assert.throws(function () {
                    var A = jsnum.asNDArray([1, 3, 5]),
                        B = jsnum.asNDArray([[1, 3, 2], [5, 11, 13]]);
                    A.dot(B);
                }, RangeError, "vector-matrix");

                assert.throws(function () {
                    var A = jsnum.asNDArray([[1, 3, 2], [5, 11, 13]]),
                        B = jsnum.asNDArray([[1, 3, 2], [5, 11, 13]]);
                    A.dot(B);
                }, RangeError, "matrix-matrix");
            }
        });


        test.createSuite("unit:AbstractNDArray:matrix_operations:LUDecomposition", {
            "should support LUDecomposition" : function () {
                var rowUsed = [], colUsed = [],
                    A = jsnum.asNDArray([[1, 3, 2], [5, 11, 13], [8, 2, 7]]),
                    res = A.LUDecomposition();
                assert.ok(jsnum.areClose(res.P.dot(res.L.dot(res.U)), A),
                    "Product should be original matrix");
                res.L.walkIndexes(function (index) {
                    assert.ok(index[0] >= index[1] || this.val(index) === 0,
                        "L should be lower diagonal");
                });
                res.U.walkIndexes(function (index) {
                    assert.ok(index[0] <= index[1] || this.val(index) === 0,
                        "U should be upper diagonal");
                });
                res.P.walkIndexes(function (index) {
                    var val = this.val(index);
                    if (val !== 0) {
                        assert.ok(val === 1, "P should only contain 0s and 1s");
                        assert.ok(!rowUsed[index[0]] && !colUsed[index[1]],
                            "P should only have one non-zero element " +
                            "in each row or column");
                        rowUsed[index[0]] = colUsed[index[1]] = true;
                    }
                });

                assert.ok(res.P.isReadOnly(), "P should be readonly");
                assert.ok(res.L.isReadOnly(), "L should be readonly");
                assert.ok(res.U.isReadOnly(), "U should be readonly");
            },


            "should error on unsuported array shapes" : function () {

                assert.throws(function () {
                    var A = jsnum.asNDArray(3);
                    A.LUDecomposition();
                }, TypeError, "0D");

                assert.throws(function () {
                    var A = jsnum.asNDArray([1, 3, 2]);
                    A.LUDecomposition();
                }, TypeError, "vector");

                // TODO: would be nice to generalize these to higher dimensions
                assert.throws(function () {
                    var A = jsnum.asNDArray([[[1, 3, 2], [5, 11, 13]], [[1, 3, 2], [5, 11, 13]]]);
                    A.LUDecomposition();
                }, TypeError, "3D NDArray");

                // TODO: we can and should support rectangular matrices eventually
                assert.throws(function () {
                    var A = jsnum.asNDArray([[1, 3, 2], [5, 11, 13]]);
                    A.LUDecomposition();
                }, TypeError, "rectangular matrix");
            }
        });


        test.createSuite("unit:AbstractNDArray:matrix_operations:bidiagonalization", {
            "should support bidiagonalization" : function () {
                var A = jsnum.asNDArray([[1, 3, 2], [5, 11, 13], [1, 3, 2], [6, 7, 2]]),
                    B = jsnum.asNDArray([[1, 3, 2, 5], [11, 13, 1, 3], [2, 6, 7, 2]]);

                function check(M) {
                    var bidiag = M.bidiagonalization();
                    //console.log('U:\n'+bidiag.U+'\nB:\n'+bidiag.B+'\nV:\n'+bidiag.V)

                    assert.ok(bidiag.U.isOrthogonal(), "U orthogonal");
                    assert.ok(bidiag.V.isOrthogonal(), "V orthogonal");
                    assert.ok(jsnum.areClose(M, bidiag.U.dot(bidiag.B).dot(bidiag.V)),
                        "is a decomposition of M");
                    bidiag.B.walkIndexes(function (index) {
                        if (index[0] !== index[1] && index[0] !== index[1] - 1 &&
                                bidiag.B.val(index) !== 0) {
                            assert.ok(false, "B should be bidiagonal, but is: \n" + bidiag.B);
                        }
                    });
                }

                check(A);
                check(B);
            },

            "should error on unsuported array shapes" : function () {

                assert.throws(function () {
                    var A = jsnum.asNDArray(3);
                    A.bidiagonalization();
                }, TypeError, "0D");

                assert.throws(function () {
                    var A = jsnum.asNDArray([1, 3, 2]);
                    A.bidiagonalization();
                }, TypeError, "vector");

                // TODO: would be nice to generalize these to higher dimensions
                assert.throws(function () {
                    var A = jsnum.asNDArray([[[1, 3, 2], [5, 11, 13]], [[1, 3, 2], [5, 11, 13]]]);
                    A.bidiagonalization();
                }, TypeError, "3D NDArray");
            }
        });


        test.createSuite("unit:AbstractNDArray:matrix_operations:givens_rotation", {
            "should support givens rotation" : function () {
                function check(M) {
                    var G = M.givensRotation();
                    //console.log('G:\n'+G+'\nM:\n'+M+'\nG·M:\n'+G.dot(M))

                    assert.ok(jsnum.areClose(G.dot(M).val([1]), 0),
                        "rotation zeros second element");
                    assert.ok(G.isOrthogonal(), "G is orthogonal");
                    assert.strictEqual(G.val([0, 0]), G.val([1, 1]), "cos match");
                    assert.strictEqual(-G.val([0, 1]), G.val([1, 0]), "sin match");
                }

                check(jsnum.asNDArray([1, 3]));
                check(jsnum.asNDArray([6, 2]));
                check(jsnum.asNDArray([0, 3]));
                check(jsnum.asNDArray([2, 0]));
                check(jsnum.asNDArray([2, 1e-160]));
                check(jsnum.asNDArray([1e-160, -3]));
            },

            "should error on unsuported array shapes" : function () {

                assert.throws(function () {
                    var A = jsnum.asNDArray(3);
                    A.givensRotation();
                }, TypeError, "0D");

                assert.throws(function () {
                    var A = jsnum.asNDArray([1, 3, 2]);
                    A.givensRotation();
                }, TypeError, "vector too long");

                assert.throws(function () {
                    var A = jsnum.asNDArray([[1, 3, 2], [5, 11, 13]]);
                    A.givensRotation();
                }, TypeError, "matrix");
            }
        });


        test.createSuite("unit:AbstractNDArray:matrix_operations:singular_value_decomposition", {
            "should support svd" : function () {
                var A = jsnum.asNDArray([[1, 3, 2, 8], [5, 11, 13, 7],
                        [1, 3, 2, 15], [6, 7, 2, 11], [5, 3, 12, 8]]),
                    B = jsnum.asNDArray([[1, 3, 2, 5], [11, 13, 1, 3],
                        [2, 6, 7, 2]]),
                    C = jsnum.asNDArray([[1e200, 2e200], [3e200, 4e200]]);

                function check(M) {
                    var svd = M.singularValueDecomposition();
                    //console.log('U:\n'+svd.U+'\nD:\n'+svd.D+'\nV:\n'+svd.V)

                    assert.ok(svd.U.isOrthogonal(), "U orthogonal");
                    assert.ok(svd.V.isOrthogonal(), "V orthogonal");
                    assert.ok(jsnum.areClose(M, svd.U.dot(svd.D).dot(svd.V)),
                        "is a decomposition of M");
                    svd.D.walkIndexes(function (index) {
                        if (index[0] !== index[1] && svd.D.val(index) !== 0) {
                            assert.ok(false,
                                "D should be diagonal, but is: \n" + svd.D);
                        }
                    });
                }

                check(A);
                check(B);
                check(C);
            },

            "should error on unsuported array shapes" : function () {

                assert.throws(function () {
                    var A = jsnum.asNDArray(3);
                    A.svd();
                }, TypeError, "0D");

                assert.throws(function () {
                    var A = jsnum.asNDArray([1, 3, 2]);
                    A.svd();
                }, TypeError, "vector");

                // TODO: would be nice to generalize these to higher dimensions
                assert.throws(function () {
                    var A = jsnum.asNDArray([[[1, 3, 2], [5, 11, 13]], [[1, 3, 2], [5, 11, 13]]]);
                    A.svd();
                }, TypeError, "3D NDArray");

                // TODO: we can and should support rectangular matrices eventually
                assert.throws(function () {
                    var A = jsnum.asNDArray([[1, 3, 2], [5, 11, 13]]);
                    A.svd();
                }, TypeError, "rectangular matrix");
            }
        });


        test.createSuite("unit:AbstractNDArray:matrix_operations:misc", {
            "should support inverse" : function () {
                var A = jsnum.asNDArray([[1, 3, 2], [5, 11, 13], [8, 2, 7]]);

                assert.ok(jsnum.areClose(A.dot(A.inverse()), jsnum.eye(3)));
            },

            "should support det" : function () {
                var A = jsnum.asNDArray([[1, 3, 2], [5, 11, 13], [8, 2, 7]]),
                    B = jsnum.asNDArray([[1, 3, 2], [5, 11, -13], [8, 2, 7]]);

                assert.ok(jsnum.areClose(A.det(), 102));
                assert.ok(jsnum.areClose(B.det(), -470));
            },

            "should support transpose" : function () {
                assert.deepEqual(jsnum.asNDArray(2).transpose().toArray(), 2, "0D");
                assert.deepEqual(
                    jsnum.asNDArray([1, 3, 2]).transpose().toArray(),
                    [1, 3, 2],
                    "1D"
                );
                assert.deepEqual(
                    jsnum.asNDArray([[1, 3, 2], [5, 11, 13]]).transpose().toArray(),
                    [[1, 5], [3, 11], [2, 13]],
                    "2D"
                );
                assert.deepEqual(
                    jsnum.asNDArray([[[1, 3], [2, 2]], [[5, 11], [4, 13]]]).transpose().toArray(),
                    [[[1, 5], [2, 4]], [[3, 11], [2, 13]]],
                    "3D"
                );
                assert.deepEqual(new jsnum.UntypedNDArray([2, 3, 4, 5]).transpose().shape,
                    [5, 4, 3, 2], "4D");

                assert.ok(jsnum.eye(3).transpose().isReadOnly(), "should respect read-only");
            },

            "should support isOrthogonal" : function () {
                var sqrt2 = Math.pow(2, 0.5),
                    A = jsnum.asNDArray([[1, -1], [1, 1]]).mul(1 / sqrt2),
                    B = jsnum.eye(3),
                    C = jsnum.asNDArray([[7, 2, 9], [6, 11, 4], [2, 8, 5]]),
                    D = jsnum.asNDArray([[1, 0, 0], [0, 1, 0], [0, 1 / sqrt2, 1 / sqrt2]]),
                    E = jsnum.asNDArray([[1, 3, 5], [4, 6, 8]]),
                    F = jsnum.asNDArray([[[1, 3], [2, 2]], [[5, 11], [4, 13]]]);


                assert.ok(A.isOrthogonal(), "simple 2D");
                assert.ok(B.isOrthogonal(), "I_3");
                assert.ok(!C.isOrthogonal(), "Counterexample 1");
                assert.ok(!D.isOrthogonal(), "Counterexample 2");
                assert.ok(!E.isOrthogonal(), "rectangular matrix");
                assert.ok(!F.isOrthogonal(), "non-matrix");
            },

            "should support householderTransform" : function () {
                var a = jsnum.asNDArray([3, -3, 4, 2]),
                    b = jsnum.asNDArray([-2, -3, 4, 2]),
                    c = jsnum.asNDArray([-4, 0, 0, 0]),
                    d = jsnum.asNDArray([5, 0, 0, 0]),
                    e = jsnum.asNDArray([3e200, -3e200, 4e200, 2e200]);

                function check(x) {
                    var house = x.householderTransform(),
                        Px = house.P.dot(x);
                    assert.strictEqual(house.v.val([0]), 1, "1 as first element");
                    assert.ok(jsnum.areClose(house.P,
                        jsnum.eye(4).sub(house.v.at([undefined, "1"]).
                            dot(house.v.at(["1", undefined])).mul(house.beta))),
                        "P = I - beta v v^t");
                    assert.ok(house.P.isOrthogonal(), "P is orthogonal");
                    assert.ok(jsnum.areClose(x.norm(), Px.norm()),
                        "The norm of Px is the same as the norm of x");
                    assert.ok(jsnum.areClose(Px.val([0]), Px.norm()),
                        "P x has only one non-zero element");
                }

                // check several different types of vectors
                check(a);
                check(b);
                check(c);
                check(d);
                check(e);
            }
        });


        test.createSuite("unit:AbstractNDArray:math_ops", {
            "should support swap" : function () {
                var A = jsnum.asNDArray([[1, 3, 5], [4, 6, 8]]),
                    B = jsnum.asNDArray([[7, 2, 9], [6, 11, 4]]);

                A.swap(B);

                assert.deepEqual(A.toArray(), [[7, 2, 9], [6, 11, 4]]);
                assert.deepEqual(B.toArray(), [[1, 3, 5], [4, 6, 8]]);
            },

            "should support abs" : function () {
                var A = jsnum.asNDArray([[-1, 3, -5], [4, -6, 8]]);
                assert.deepEqual(A.abs().toArray(), [[1, 3, 5], [4, 6, 8]]);
            },

            "should support argMax" : function () {
                var A = jsnum.asNDArray([[-1, 3, -5], [4, -6, 2]]);
                assert.deepEqual(A.argMax(), [1, 0]);
            },

            "should support max" : function () {
                var A = jsnum.asNDArray([[-1, 3, -5], [4, -6, 2]]);
                assert.deepEqual(A.max(), 4);
            },

            "should support argMin" : function () {
                var A = jsnum.asNDArray([[-1, 3, -5], [4, -6, 2]]);
                assert.deepEqual(A.argMin(), [1, 1]);
            },

            "should support min" : function () {
                var A = jsnum.asNDArray([[-1, 3, -5], [4, -6, 2]]);
                assert.deepEqual(A.min(), -6);
            },

            "should support reciprocal" : function () {
                var A = jsnum.asNDArray([[-1, 2, 0.25], [0.125, -8, 4]]);
                assert.deepEqual(A.reciprocal().toArray(), [[-1, 0.5, 4], [8, -0.125, 0.25]]);
            },

            "should support addHere" : function () {
                var A = jsnum.asNDArray([[1, 3, 5], [4, 6, 8]]),
                    B = jsnum.asNDArray([[7, 2, 9], [6, 11, 4]]);

                assert.strictEqual(A.addHere(B), A);
                assert.strictEqual(String(A),
                    '[[  8,  5, 14 ],\n' +
                    ' [ 10, 17, 12 ]]');
                assert.deepEqual(B.addHere(3).toArray(), [[10, 5, 12], [9, 14, 7]]);
            },

            "addHere should throw on invalid arguments" : function () {
                var A = jsnum.asNDArray([[1, 3, 5], [4, 6, 8]]);

                assert.throws(function () {
                    A.addHere("B");
                }, TypeError, "string");

                assert.throws(function () {
                    A.addHere(jsnum.asNDArray([[1, 3, 5, 4], [4, 6, 8, 9]]));
                }, RangeError, "wrong shape");
            },

            "should support add" : function () {
                var A = jsnum.asNDArray([[1, 3, 5], [4, 6, 8]]),
                    B = jsnum.asNDArray([[7, 2, 9], [6, 11, 4]]);

                assert.strictEqual(String(A.add(B)),
                    '[[  8,  5, 14 ],\n' +
                    ' [ 10, 17, 12 ]]');
            },

            "should support subHere" : function () {
                var A = jsnum.asNDArray([[1, 3, 5], [4, 6, 8]]),
                    B = jsnum.asNDArray([[7, 2, 9], [6, 11, 4]]);

                assert.strictEqual(A.subHere(B), A);
                assert.strictEqual(String(A),
                    '[[ -6,  1, -4 ],\n' +
                    ' [ -2, -5,  4 ]]');
                assert.deepEqual(B.subHere(3).toArray(), [[4, -1, 6], [3, 8, 1]]);
            },

            "subHere should throw on invalid arguments" : function () {
                var A = jsnum.asNDArray([[1, 3, 5], [4, 6, 8]]);

                assert.throws(function () {
                    A.subHere("B");
                }, TypeError, "string");

                assert.throws(function () {
                    A.subHere(jsnum.asNDArray([[1, 3, 5, 4], [4, 6, 8, 9]]));
                }, RangeError, "wrong shape");
            },

            "should support sub" : function () {
                var A = jsnum.asNDArray([[1, 3, 5], [4, 6, 8]]),
                    B = jsnum.asNDArray([[7, 2, 9], [6, 11, 4]]);

                assert.strictEqual(String(A.sub(B)),
                    '[[ -6,  1, -4 ],\n' +
                    ' [ -2, -5,  4 ]]');
            },

            "should support mulHere" : function () {
                var A = jsnum.asNDArray([[1, 3, 5], [4, 6, 8]]),
                    B = jsnum.asNDArray([[7, 2, 9], [6, 11, 4]]);

                assert.strictEqual(A.mulHere(B), A);
                assert.strictEqual(String(A),
                    '[[  7,  6, 45 ],\n' +
                    ' [ 24, 66, 32 ]]');
                assert.deepEqual(B.mulHere(2).toArray(), [[14, 4, 18], [12, 22, 8]]);
            },

            "mulHere should throw on invalid arguments" : function () {
                var A = jsnum.asNDArray([[1, 3, 5], [4, 6, 8]]);

                assert.throws(function () {
                    A.mulHere("B");
                }, TypeError, "string");

                assert.throws(function () {
                    A.mulHere(jsnum.asNDArray([[1, 3, 5, 4], [4, 6, 8, 9]]));
                }, RangeError, "wrong shape");
            },

            "should support mul" : function () {
                var A = jsnum.asNDArray([[1, 3, 5], [4, 6, 8]]),
                    B = jsnum.asNDArray([[7, 2, 9], [6, 11, 4]]);

                assert.strictEqual(String(A.mul(B)),
                    '[[  7,  6, 45 ],\n' +
                    ' [ 24, 66, 32 ]]');
            },

            "should support divHere" : function () {
                var A = jsnum.asNDArray([[1, 3, 5], [4, 6, 8]]),
                    B = jsnum.asNDArray([[2, 4, 8], [0.5, 0.25, 4]]);

                assert.strictEqual(A.divHere(B), A);
                assert.strictEqual(String(A),
                    '[[   0.5,  0.75, 0.625 ],\n' +
                    ' [     8,    24,     2 ]]');
                assert.deepEqual(B.divHere(2).toArray(), [[1, 2, 4], [0.25, 0.125, 2]]);
            },

            "should support div" : function () {
                var A = jsnum.asNDArray([[1, 3, 5], [4, 6, 8]]),
                    B = jsnum.asNDArray([[2, 4, 8], [0.5, 0.25, 4]]);

                assert.strictEqual(String(A.div(B)),
                    '[[   0.5,  0.75, 0.625 ],\n' +
                    ' [     8,    24,     2 ]]');
            },

            "divHere should throw on invalid arguments" : function () {
                var A = jsnum.asNDArray([[1, 3, 5], [4, 6, 8]]);

                assert.throws(function () {
                    A.divHere("B");
                }, TypeError, "string");

                assert.throws(function () {
                    A.divHere(jsnum.asNDArray([[1, 3, 5, 4], [4, 6, 8, 9]]));
                }, RangeError, "wrong shape");
            },

            "should support negHere" : function () {
                var A = jsnum.asNDArray([[1, -3, 5], [4, 6, 8]]);

                assert.strictEqual(A.negHere(), A);
                assert.strictEqual(String(A),
                    '[[ -1,  3, -5 ],\n' +
                    ' [ -4, -6, -8 ]]');
            },

            "should support neg" : function () {
                var A = jsnum.asNDArray([[1, -3, 5], [4, 6, 8]]);

                assert.strictEqual(String(A.neg()),
                    '[[ -1,  3, -5 ],\n' +
                    ' [ -4, -6, -8 ]]');
            },

            "should support sum" : function () {
                var A = jsnum.asNDArray(3),
                    B = jsnum.asNDArray([2, 1, 4]),
                    C = jsnum.asNDArray([[1, 3], [6, 7]]);

                assert.strictEqual(A.sum(), 3);
                assert.strictEqual(B.sum(), 7);
                assert.strictEqual(C.sum(), 17);
            },

            "should support norm" : function () {
                var A = jsnum.asNDArray(7),
                    B = jsnum.asNDArray([-3, 4]),
                    C = jsnum.asNDArray([[5, 1, 3], [1, 6, 7]]),
                    D = jsnum.asNDArray([3e200, -4e200]);

                assert.strictEqual(A.norm(), 7);
                assert.strictEqual(B.norm(), 5);
                assert.strictEqual(C.norm(), 11);
                assert.ok(jsnum.areClose(D.norm(), 5e200));
            }
        });
    }
);
