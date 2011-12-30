define([], function() {
    "use strict";
    var jsn = {}, basearray;

    basearray = {
        // create a human-readable version of the array
        'toString' : function () {
            var result, i, fieldWidth;
            
            function padLeft(value, width) {
                var result = String(value);

                while (result.length < width) {
                    result = ' ' + result;
                }

                return result;
            }


            function getMaxFieldWidth(get_element, shape, minFieldWidth) {
                var result, i;

                if (shape.length == 0) {
                    return Math.max(minFieldWidth, 
                            String(get_element()).length);
                } else {
                    result = minFieldWidth;

                    for (i = 0; i < shape[0]; i += 1) {
                        result = getMaxFieldWidth(
                            get_element.bind(null, i), 
                            shape.slice(1), result
                            );
                    }
                    
                    return result;
                }
            }
            fieldWidth = getMaxFieldWidth(this.get_element.bind(this), 
                    this.shape, 0);


            function format1D(get_element, length, fieldWidth) {
                var result, i;

                var result = '[ '
                for (i = 0; i < length; i += 1) {
                    result += padLeft(get_element(i), fieldWidth);
                    if (i < length - 1) {
                        result += ', ';
                    }
                    else {
                        result += ' ]'
                    }
                }

                return result;
            }

            function format2D(get_element, shape, fieldWidth) {
                var result, i;

                result = '[';
                for (i = 0; i < shape[0]; i += 1) {
                    result += format1D(get_element.bind(null,i), 
                            shape[1], fieldWidth);
                    if (i < shape[0] - 1) {
                        result += ',\n ';
                    }
                    else {
                        result += ']'
                    }
                }

                return result;
            }

            result = '';
            if (this.shape.length > 1) {
                result += format2D(this.get_element.bind(this), 
                        this.shape, fieldWidth);
            } else {
                result += format1D(this.get_element.bind(this), 
                        this.shape[0], fieldWidth);
            }
            return result;
        }
    };

    jsn.array = function (vals) {
        var o = Object.create(basearray),
            val;

        val = vals;
        o.shape = [];
        while (val.length !== undefined) { 
            o.shape.push(val.length);
            val = val[1];
        }
        
        o.get_element = function () {
            var i, val = vals;
            for (i = 0; i < arguments.length; ++i) {
                val = val[arguments[i]];
            }
            return val;
        };

        return o;
    };

    return jsn;
});
