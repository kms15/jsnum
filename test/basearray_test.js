/*global define */
define(
    ['tools/test', 'tools/assert', 'src/jsn'],
    function (test, assert, jsn) {
        "use strict";

        test.createSuite("unit:BaseArray", {
            "should build from 1-d list" : function () {
                var A = jsn.array([1.5, 3.25, 5.125]);

                assert.strictEqual(String(A),
                    '[   1.5,  3.25, 5.125 ]');
                assert.strictEqual(String(A.shape), '3');
            },

            "should build from 2-d list" : function () {
                var A = jsn.array([[1.5, 3.25], [5.125, 6], [7.5, 8.625]]);

                assert.strictEqual(String(A),
                    '[[   1.5,  3.25 ],\n' +
                    ' [ 5.125,     6 ],\n' +
                    ' [   7.5, 8.625 ]]');
                assert.strictEqual(String(A.shape), '3,2');
            },

            "should support get_element" : function () {
                var A = jsn.array([[1.5, 3.25], [5.125, 6], [7.5, 8.625]]);
                assert.strictEqual(A.get_element(1, 0), 5.125);
                assert.strictEqual(A.get_element(2, 1), 8.625);
            }
        });
    }
);
