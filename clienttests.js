requirejs(
    ['tools/test','test/basearray_test.js', 'lib/domReady.js'], 
    function(test, basearray_test, domReady) {
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
