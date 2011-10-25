var test = require("../tools/test.js"),
    assert = require("assert");

test.createSuite("unit:SafeArray", {
    "this should fail" : function () {
        assert.strictEqual(2, 1);
    }
});
