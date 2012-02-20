/*global requirejs */
/*jslint browser: true */
requirejs(
    ['tools/test', 'lib/domReady.js', 'test/basearray_test.js'],
    function (test, domReady, basearray_test) {
        "use strict";

        domReady(function () {
            var report = document.getElementById('report');

            report.innerHTML = '';
            test.runTests(test.textReporter(function (text) {
                report.innerHTML += text + '\n';
            }));
        });
    }
);
