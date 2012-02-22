/*global requirejs */
/*jslint browser: true */
requirejs(
    [
        'tools/test',
        'lib/domReady.js',
        'test/utilities_test.js',
        'test/AbstractNDArray_test.js',
        'test/UntypedNDArray_test.js'
    ],
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
