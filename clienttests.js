requirejs(
    ['tools/test','test/basearray_test.js'], 
    function(test, basearray_test) {
    "use strict";

    document.write('<pre>');
    test.runTests(test.textReporter(function (text) {
        document.write(text + '\n');
    }));
    document.write('</pre>');
});
