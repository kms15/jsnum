define(
    ['tools/test','tools/assert', 'src/jsn'],
    function (test, assert, jsn) {
        "use strict";

        test.createSuite("unit:BaseArray", {
            "should build from 1-d list" : function () {
                var A = jsn.array([1.5,3.25,5.125])
                
                assert.strictEqual(String(A), 
                    'BaseArray:\n[ 1.5, 3.25, 5.125 ]');
            }
        });
    }
);
