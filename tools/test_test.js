var assert = require('assert'),
    test = require('./test');

(function () {
    "use strict";
    var calls = [];

    function trackCalls() {
        calls.push(Array.prototype.slice.apply(arguments, [0]));
    }

    assert.throws(function () { test.createSuite(undefined, {}); });
    assert.throws(function () { test.createSuite("foo"); });
    test.createSuite("foo", {});
    assert.throws(function () { test.createSuite("foo", {}); });

    test.removeAllSuites();
    test.createSuite("A:A", {
        "a" : function () {
        },
        "b" : function () {
            throw new Error("Oh no, A:A:b!");
        }
    });

    test.createSuite("B:A", {
        "c" : function () {
        }
    });

    test.createSuite("A:B", {
        "b" : function () {
        },
        $private : function () {
            throw new Error("Private!");
        }
    });

    test.runTests(trackCalls, "A:");
    assert.equal(JSON.stringify(calls), '[' +
        '["startTestRun"],' +
        '["startSuite","A:A"],' +
        '["startTest","A:A","a"],' +
        '["passTest","A:A","a"],' +
        '["startTest","A:A","b"],' +
        '["failTest","A:A","b","Error: Oh no, A:A:b!"],' +
        '["endSuite","A:A"],' +
        '["startSuite","A:B"],' +
        '["startTest","A:B","b"],' +
        '["passTest","A:B","b"],' +
        '["endSuite","A:B"],' +
        '["endTestRun",3,1]' +
        ']');
    test.removeAllSuites();
}());

