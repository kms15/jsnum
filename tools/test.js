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

        callback({ type: "startTestRun" });

        goodSuites = [];
        for (suite in suites) {
            if (suites.hasOwnProperty(suite) && suite.indexOf(prefix) === 0) {
                goodSuites.push(suite);
            }
        }

        goodSuites.sort();
        for (i = 0; i < goodSuites.length; i += 1) {
            callback({ type: "startSuite", suite: goodSuites[i] });
            suite = suites[goodSuites[i]];
            goodTests = [];

            for (test in suite) {
                if (suite.hasOwnProperty(test) && test.charAt(0) !== '$') {
                    goodTests.push(test);
                }
            }

            for (j = 0; j < goodTests.length; j += 1) {
                callback({ type: "startTest", suite: goodSuites[i],
                    test: goodTests[j] });
                try {
                    numTests += 1;
                    suite[goodTests[j]]();

                    callback({ type: "passTest", suite: goodSuites[i],
                        test: goodTests[j] });
                } catch (e) {
                    numFailures += 1;
                    callback({ type: "failTest", suite: goodSuites[i],
                        test: goodTests[j], error: e });
                }
            }

            callback({ type: "endSuite", suite: goodSuites[i] });
        }

        callback({ type: "endTestRun", numTests: numTests,
            numFailures: numFailures });
    };


    test.removeAllSuites = function () {
        suites = {};
    };


    test.textReporter = function (outputLine) {
        var startTime;

        return function (e) {
            switch (e.type) {
            case 'startTestRun':
                outputLine('======================================');
                outputLine(' Starting test run');
                outputLine('======================================');
                startTime = new Date();
                break;

            case 'startSuite':
                //outputLine('--------------------------------------');
                outputLine(((new Date() - startTime)/1000).toFixed(3) +
                        ' Running suite ' + e.suite);
                //outputLine('--------------------------------------');
                break;

            case 'startTest':
                //outputLine(((new Date() - startTime)/1000).toFixed(3) +
                //        '    Running test ' + e.test);
                //outputLine(c  + ':');
                break;

            case 'passTest':
                //outputLine('passed');
                break;

            case 'failTest':
                outputLine('######### ' + e.test + ' FAILED ##########');
                outputLine(e.error.toString());
                break;

            case 'endSuite':
                //outputLine('--------------------------------------');
                break;

            case 'endTestRun':
                outputLine('======================================');
                outputLine(' Tests completed:');
                outputLine(' ' + e.numTests + ' tests, ' +
                    e.numFailures + ' failures, ' +
                    ((new Date() - startTime)/1000).toFixed(3) + ' seconds');
                outputLine('======================================');
                if (e.numFailures === 0) {
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
