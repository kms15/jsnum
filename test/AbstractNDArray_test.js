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
                    [[[7.5], [8.625]], [[9.25], [10.125]]]]);

                // should not throw with valid data
                A.checkIndexes([1, 0, 1, 0]);

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

            "should support createResult using untyped array" : function () {
                var A = jsn.asNDArray([10.125, 3]),
                    B = A.createResult([3, 5]);

                assert.ok(B instanceof jsn.UntypedNDArray);
                assert.deepEqual(B.shape, [3, 5]);
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
    }
);
