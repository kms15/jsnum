define([], function() {
    "use strict";
    var jsn = {}, basearray;

    basearray = {
        'toString' : function () {
            var result, i;
           
            result = 'BaseArray:\n[ ';
            for (i = 0; i < this._vals.length; i += 1) {
                result +=  String(this._vals[i]);
                if (i < this._vals.length - 1) {
                    result += ', ';
                }
                else {
                    result += ' ]'
                }
            }

            return result;
        }
    };

    jsn.array = function (vals) {
        var o = Object.create(basearray);

        o.shape = [ vals.length ];
        o._vals = vals;

        return o;
    };

    return jsn;
});
