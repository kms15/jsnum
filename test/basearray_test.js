/*global define */
define(
    ['tools/test', 'tools/assert', 'src/jsn'],
    function (test, assert, jsn) {
        "use strict";

        test.createSuite("unit:array", {
            "should build from scalar" : function () {
                var A = jsn.array(3.25);

                assert.strictEqual(String(A), '( 3.25 )');
                assert.strictEqual(A.shape.length, 0);
            },

            "should build from 1D list" : function () {
                var A = jsn.array([1.5, 3.25, 5.125]);

                assert.strictEqual(String(A),
                    '[   1.5,  3.25, 5.125 ]');
                assert.strictEqual(String(A.shape), '3');
            },

            "should build from 2D list" : function () {
                var A = jsn.array([[1.5, 3.25], [5.125, 6], [7.5, 8.625]]);

                assert.strictEqual(String(A),
                    '[[   1.5,  3.25 ],\n' +
                    ' [ 5.125,     6 ],\n' +
                    ' [   7.5, 8.625 ]]');
                assert.strictEqual(String(A.shape), '3,2');
            },

            "should build from higher dimensional list" : function () {
                var A = jsn.array([[[[1.5], [3.25]], [[5.125], [6]]],
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

            "should support get_element" : function () {
                var A = jsn.array([[1.5, 3.25], [5.125, 6], [7.5, 8.625]]);
                assert.strictEqual(A.get_element([1, 0]), 5.125);
                assert.strictEqual(A.get_element([2, 1]), 8.625);
            },

            "should support set_element" : function () {
                var A = jsn.array([[1.5, 3.25], [5.125, 6], [7.5, 8.625]]);
                A.set_element([1, 0], 3.125);
                assert.strictEqual(A.get_element([1, 0]), 3.125);
                assert.strictEqual(A.get_element([2, 1]), 8.625);
            },
        });


        test.createSuite("unit:BaseArray:views", {
            "should support collapse" : function () {
                var A = jsn.array([[[[1.5], [3.25]], [[5.125], [6]]],
                    [[[7.5], [8.625]], [[9.25], [10.125]]]]);

                assert.strictEqual(String(A.collapse([1])),
                    '[\n' +
                    ' [[    7.5 ],\n' +
                    '  [  8.625 ]],\n' +
                    '\n' +
                    ' [[   9.25 ],\n' +
                    '  [ 10.125 ]]\n' +
                    ']');

                assert.strictEqual(String(A.collapse([,,0,0])),
                    '[[   1.5, 5.125 ],\n' +
                    ' [   7.5,  9.25 ]]');

                assert.strictEqual(String(A.collapse([1,1,0,0])), '( 9.25 )');
            },
        });
    }
);
