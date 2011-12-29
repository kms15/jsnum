define([], function() {
    "use strict";
    var jsn = {}, basearray;

    basearray = {
        'toString' : function () {
            var result, i, fieldWidth, vals1d, vals2d;
            
            function padLeft(value, width) {
                var result = String(value);

                while (result.length < width) {
                    result = ' ' + result;
                }

                return result;
            }


            function getMaxFieldWidth(vals) {
                var result, i;

                if (vals.length === undefined) {
                    return String(vals).length;
                } else {
                    result = 0;

                    for (i = 0; i < vals.length; i += 1) {
                        result = Math.max(result, 
                            getMaxFieldWidth(vals[i]));
                    }
                    
                    return result;
                }
            }
            fieldWidth = getMaxFieldWidth(this._vals);


            function format1D(vals, fieldWidth) {
                var result, i;

                var result = '[ '
                for (i = 0; i < vals.length; i += 1) {
                    result += padLeft(vals[i], fieldWidth);
                    if (i < vals.length - 1) {
                        result += ', ';
                    }
                    else {
                        result += ' ]'
                    }
                }

                return result;
            }
            
            result = 'BaseArray:\n';
            if (this._vals.length > 0 && this._vals[0].length !== undefined) {
                result += '[';
                for (i = 0; i < this._vals.length; i += 1) {
                    result += format1D(this._vals[i], fieldWidth);
                    if (i < this._vals.length - 1) {
                        result += ',\n ';
                    }
                    else {
                        result += ']'
                    }
                }
            } else {
                result += format1D(this._vals, fieldWidth);
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
