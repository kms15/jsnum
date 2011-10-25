var assert = require('assert'),
    suites = {};

exports.createSuite = function (name, tests) {
    "use strict"
    assert.strictEqual(name, '' + name, "name should be a string");
    assert.strictEqual(typeof tests, "object", "tests should be an object");
    assert.strictEqual(suites[name], undefined, "test already declared");
    suites[name] = tests;
};

exports.runTests = function (callback, /*optional*/ prefix) {
    "use strict"
    
    var goodSuites, suite, i, test, goodTests, j,
        numTests = 0, numFailures = 0;

    assert.strictEqual(typeof callback, "function");
    prefix = prefix || '';
    
    callback("startTestRun");

    goodSuites = [];
    for (suite in suites) {
        if (suites.hasOwnProperty(suite) && suite.indexOf(prefix) == 0) {
            goodSuites.push(suite);
        }
    }
    
    goodSuites.sort();
    for (i = 0; i < goodSuites.length; i += 1) {
        callback("startSuite", goodSuites[i]);
        suite = suites[goodSuites[i]];
        goodTests = [];

        for (test in suites[goodSuites[i]]) {
            if (suite.hasOwnProperty(test) && test.charAt(0) != '_') {
                goodTests.push(test);
            }
        }

        for (j = 0; j < goodTests.length; j += 1) {
            callback("startTest", goodSuites[i], goodTests[j]);
            try {
                numTests += 1;
                suite[goodTests[j]]();

                callback("passTest", goodSuites[i], goodTests[j]);
            }
            catch (e) {
                numFailures += 1;
                callback("failTest", goodSuites[i], goodTests[j], 
                    e.toString());
            }
        }

        callback("endSuite", goodSuites[i]);
    }

    callback("endTestRun", numTests, numFailures);
};

// Tests
//
// Note: probably silly to run these all of the time, but how else do you test 
// the test harness?

(function () {
    "use strict"
    var calls = [];
    
    function trackCalls() {
        calls.push(Array.prototype.slice.apply(arguments,[0]));
    }    

    assert.throws(function () { exports.createSuite(undefined,{}) });
    assert.throws(function () { exports.createSuite("foo"); });
    exports.createSuite("foo",{});
    assert.throws(function () { exports.createSuite("foo", {}); });

    suites = {};
    exports.createSuite("A:A", {
        "a" : function () {
        },
        "b" : function () {
            throw new Error("Oh no, A:A:b!");
        }
    });

    exports.createSuite("B:A", {
        "c" : function () {
        }
    });

    exports.createSuite("A:B", {
        "b" : function () {
        },
        _private : function () {
            throw new Error("Private!");
        }
    });

    exports.runTests(trackCalls, "A:");
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
    suites = {};
}());
