/*global define */
define(['tools/assert'], function (assert) {
    "use strict";
    var test = {},
        suites = {};


    test.createSuite = function (name, tests) {
        assert.strictEqual(name, String(name), "name should be a string");
        assert.strictEqual(typeof tests, "object", "tests should be an object");
        assert.strictEqual(suites[name], undefined, "test already declared");
        suites[name] = tests;
    };


    test.runTests = function (callback, /*optional*/ prefix) {
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


    test.removeAllSuites = function () {
        suites = {};
    };


    test.textReporter = function (outputLine) {
        return function (a, b, c, d) {
            switch (a) {
            case 'startTestRun':
                outputLine('======================================');
                outputLine(' Starting test run');
                outputLine('======================================');
                break;

            case 'startSuite':
                outputLine('--------------------------------------');
                outputLine('Running suite ' + b);
                outputLine('--------------------------------------');
                break;

            case 'startTest':
                outputLine(c  + ':');
                break;

            case 'passTest':
                outputLine('passed');
                break;

            case 'failTest':
                outputLine('######### FAILED ##########');
                outputLine(d);
                break;

            case 'endSuite':
                //outputLine('--------------------------------------');
                break;

            case 'endTestRun':
                outputLine('======================================');
                outputLine(' Tests completed:');
                outputLine(' ' + b + ' tests, ' + c + ' failures.');
                outputLine('======================================');
                if (c === 0) {
                    outputLine('');
                    outputLine('All tests passed!');
                    outputLine('');
                } else {
                    outputLine('');
                    outputLine('######### Tests failed! ##########');
                    outputLine('');
                }
                break;
            }
        };
    };

    test.consoleReporter = test.textReporter(console.log);

    return test;
});
