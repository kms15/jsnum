var assert = require('assert'),
    suites = {};

exports.createSuite = function (name, tests) {
    "use strict";
    assert.strictEqual(name, String(name), "name should be a string");
    assert.strictEqual(typeof tests, "object", "tests should be an object");
    assert.strictEqual(suites[name], undefined, "test already declared");
    suites[name] = tests;
};

exports.runTests = function (callback, /*optional*/ prefix) {
    "use strict";

    var goodSuites, suite, i, test, goodTests, j,
        numTests = 0, numFailures = 0;

    assert.strictEqual(typeof callback, "function");
    prefix = prefix || '';

    callback("startTestRun");

    goodSuites = [];
    for (suite in suites) {
        if (suites.hasOwnProperty(suite) && suite.indexOf(prefix) === 0) {
            goodSuites.push(suite);
        }
    }

    goodSuites.sort();
    for (i = 0; i < goodSuites.length; i += 1) {
        callback("startSuite", goodSuites[i]);
        suite = suites[goodSuites[i]];
        goodTests = [];

        for (test in suite) {
            if (suite.hasOwnProperty(test) && test.charAt(0) !== '$') {
                goodTests.push(test);
            }
        }

        for (j = 0; j < goodTests.length; j += 1) {
            callback("startTest", goodSuites[i], goodTests[j]);
            try {
                numTests += 1;
                suite[goodTests[j]]();

                callback("passTest", goodSuites[i], goodTests[j]);
            } catch (e) {
                numFailures += 1;
                callback("failTest", goodSuites[i], goodTests[j],
                    e.toString());
            }
        }

        callback("endSuite", goodSuites[i]);
    }

    callback("endTestRun", numTests, numFailures);
};

exports.removeAllSuites = function () {
    "use strict";

    suites = {};
};
