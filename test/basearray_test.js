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
        });


        test.createSuite("unit:BaseArray:utilities", {
            "should support checkIndexes" : function () {
                var A = jsn.asNDArray([[[[1.5], [3.25]], [[5.125], [6]]],
                    [[[7.5], [8.625]], [[9.25], [10.125]]]]);

                // should not throw with valid data
                A.checkIndexes([1, 0, 1, 0]);

                assert.throws(function () { A.checkIndexes([2, 3, 4]); },
                    RangeError, "too few indices");
                assert.throws(
                    function () { A.checkIndexes([1, 1, 1, 0, 0]); },
                    RangeError,
                    "too many indices"
                );
                assert.throws(function () { A.checkIndexes([1, 'a', 0, 0]); },
                    TypeError, "non-numeric index");
                assert.throws(function () { A.checkIndexes('a'); },
                    TypeError, "non-list");

                assert.throws(function () { A.checkIndexes([1, 0, -1, 0]); },
                    RangeError, "negative index");
                assert.throws(function () { A.checkIndexes([1, 0, 1, 1]); },
                    RangeError, "index too large");
            }
        });

        test.createSuite("unit:BaseArray:views", {
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
            },

            "collapse should not track original index array" : function () {
                var A = jsn.asNDArray(
                    [[1.5, 3.25], [5.125, 6.125], [7.5, 8.625]]
                ),
                    l = [undefined, 1],
                    B = A.collapse(l);

                l[1] = 0;
                assert.strictEqual(String(B),
                    '[  3.25, 6.125, 8.625 ]');
            },

            "collapse should throw if given bad arguments" : function () {

                var A = jsn.asNDArray(
                    [[1.5, 3.25], [5.125, 6.125], [7.5, 8.625]]
                );

                assert.throws(function () { A.collapse([1, 2, 3]); },
                    RangeError, "too many indexes");
                assert.throws(function () { A.collapse(); },
                    TypeError, "no indexes");
                assert.throws(function () { A.collapse(3); },
                    TypeError, "single number");
                assert.throws(function () { A.collapse("hello"); },
                    TypeError, "string");
            },

            "collapse(...).getElement should thow if given bad arguments" :
                function () {

                    var A = jsn.asNDArray([[[[1.5], [3.25]], [[5.125], [6]]],
                        [[[7.5], [8.625]], [[9.25], [10.125]]]]),
                        B = A.collapse([1, undefined, 1]);

                    assert.throws(function () { B.getElement([2]); },
                        RangeError, "too few indices");
                    assert.throws(function () { B.getElement([1, 1, 1]); },
                        RangeError, "too many indices");
                    assert.throws(function () { B.getElement([1, 'a']); },
                        TypeError, "non-numeric index");
                }
        });
    }
);
