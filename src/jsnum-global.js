/*jslint browser: true */

// This file allows the library to be used by code that doesn't use the
// Asynchronous Module Definition (AMD) part of Common.js (and supported by
// the require library for this project).  We do this by just loading the
// jsnum module and making it a global variable.
require(["src/jsnum.js"], function (jsnum) {
    "use strict";
    window.jsnum = jsnum;
}, undefined, true);
