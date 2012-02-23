/*global requirejs */
/*jslint browser: true */
requirejs(
    [
        'tools/test',
        'lib/domReady.js',
        'test/allTests.js'
    ],
    function (test, domReady, allTests) {
        "use strict";

        domReady(function () {
            var report = document.getElementById('report');

            report.innerHTML = '';
            allTests.runTests(test.textReporter(function (text) {
                report.innerHTML += text + '\n';
            }));
        });
    }
);
