(function () {
    "use strict";

    var test = require("../tools/test.js"),
        assert = require("assert");

    test.createSuite("unit:BaseArray", {
        "this should pass" : function () {
            assert.strictEqual(1, 1);
        }
    });
}());
