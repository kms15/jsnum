define(
    ['tools/test','tools/assert'],
    function (test, assert, basearray) {
        "use strict";

        test.createSuite("unit:BaseArray", {
            "this should pass" : function () {
                assert.strictEqual(1, 2);
            }
        });
    }
);
