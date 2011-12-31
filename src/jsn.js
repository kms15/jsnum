/*global define */
define([], function () {
    "use strict";
    var jsn = {}, basearray;

    basearray = {
        // create a human-readable version of the array
        // TODO: handle 0 dim arrays
        // TODO: document
        'toString' : function () {
            var fieldWidth;

            function padLeft(value, width) {
                var result = String(value);

                while (result.length < width) {
                    result = ' ' + result;
                }

                return result;
            }


            function getMaxFieldWidth(get_element, shape, minFieldWidth) {
                var result, i;

                if (shape.length === 0) {
                    return Math.max(minFieldWidth,
                            String(get_element()).length);
                } else {
                    result = minFieldWidth;

                    for (i = 0; i < shape[0]; i += 1) {
                        result = getMaxFieldWidth(get_element.bind(null, i),
                            shape.slice(1), result);
                    }

                    return result;
                }
            }
            fieldWidth = getMaxFieldWidth(this.get_element.bind(this),
                    this.shape, 0);


            function format1D(array, fieldWidth) {
                var result, i;

                result = '[ ';
                for (i = 0; i < array.shape[0]; i += 1) {
                    result += padLeft(array.get_element(i), fieldWidth);
                    if (i < array.shape[0] - 1) {
                        result += ', ';
                    } else {
                        result += ' ]';
                    }
                }

                return result;
            }

            function format2D(array, fieldWidth, indent) {
                var result, i;

                result = padLeft('', indent) + '[';
                for (i = 0; i < array.shape[0]; i += 1) {
                    result += format1D(array.collapse([i]), fieldWidth);
                    if (i < array.shape[0] - 1) {
                        result += ',\n' + padLeft('', indent + 1);
                    } else {
                        result += ']';
                    }
                }

                return result;
            }

            function formatND(array, fieldWidth, indent) {
                var result, i;

                if (array.shape.length === 1) {
                    result = format1D(array, fieldWidth);
                } else if (array.shape.length === 2) {
                    result = format2D(array, fieldWidth, indent);
                } else {
                    result = padLeft('', indent) + '[\n';
                    for (i = 0; i < array.shape[0]; i += 1) {
                        result += formatND(array.collapse([i]), fieldWidth, 
                                indent + 1);
                        if (i < array.shape[0] - 1) {
                            result += ',\n\n';
                        } else {
                            result += '\n' + padLeft('', indent) + ']';
                        }
                    }
                }

                return result;
            }

            return formatND(this, fieldWidth, 0);
        },

        // create a new array object that maps indexes to the selected
        // portions of the array.
        // TODO: check that indexes is not longer than shape
        // TODO: make copy of indexes
        // TODO: input validation for get_element
        // TODO: lock down shape
        // TODO: document
        'collapse' : function (indexes) {
            var o, i, map = [], newShape = [], that = this;

            for (i = 0; i < this.shape.length; ++i) {
                if (indexes[i] === undefined) {
                    newShape.push(this.shape[i]);
                    map.push(i);
                }
            }                        

            o = Object.create(basearray);
            o.shape = newShape;
            o.get_element = function () {
                var expandedIndexes = [], i;
                
                for (i = 0; i < indexes.length; ++i) {
                    expandedIndexes.push(indexes[i]);
                }
                for (i = 0; i < map.length; ++i) {
                    expandedIndexes[map[i]] = arguments[i];
                }

                //return that.get_element(expandedIndexes);
                return that.get_element.apply(that, expandedIndexes);
            };
            
            return o;
        }
    };


    // Create an ND array from the given nested Array.
    // TODO: input validation
    // TODO: switch get_element to [] syntax
    // TODO: make copy of vals
    // TODO: lock down shape
    // TODO: document
    jsn.array = function (vals) {
        var o = Object.create(basearray),
            val;

        val = vals;
        o.shape = [];
        while (val.length !== undefined) {
            o.shape.push(val.length);
            val = val[0];
        }

        o.get_element = function () {
            var i, val = vals;
            for (i = 0; i < arguments.length; i += 1) {
                val = val[arguments[i]];
            }
            return val;
        };

        return o;
    };

    return jsn;
});
