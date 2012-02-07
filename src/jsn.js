/*global define */
define([], function () {
    "use strict";
    var jsn = {}, basearray;

    basearray = {
        // create a human-readable version of the array
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


            function getMaxFieldWidth(array, minFieldWidth) {
                var result, i;

                if (array.shape.length === 0) {
                    return Math.max(minFieldWidth,
                            String(array.get_element([])).length);
                } else {
                    result = minFieldWidth;

                    for (i = 0; i < array.shape[0]; i += 1) {
                        result = getMaxFieldWidth(array.collapse([i]), result);
                    }

                    return result;
                }
            }
            fieldWidth = getMaxFieldWidth(this, 0);


            function format1D(array, fieldWidth) {
                var result, i;

                result = '[ ';
                for (i = 0; i < array.shape[0]; i += 1) {
                    result += padLeft(array.get_element([i]), fieldWidth);
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

                if (array.shape.length === 0) {
                    result = '( ' + array.get_element([]) + ' )';
                } else if (array.shape.length === 1) {
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
        // TODO: input validation for get_element
        // TODO: lock down shape
        // TODO: document
        'collapse' : function (indexes) {
            var o, i, map = [], newShape = [], newIndexes = [], that = this;

            if (!Array.isArray(indexes)) {
                throw new TypeError("indexes should be a javascript array");
            }

            if (indexes.length > this.shape.length) {
                throw new RangeError("More indexes than dimensions to index");
            }

            function expandIndexes(reducedIndexes) {
                var expandedIndexes = [], i;

                for (i = 0; i < newIndexes.length; i += 1) {
                    expandedIndexes.push(newIndexes[i]);
                }
                for (i = 0; i < map.length; i += 1) {
                    expandedIndexes[map[i]] = reducedIndexes[i];
                }

                return expandedIndexes;
            }

            for (i = 0; i < this.shape.length; i += 1) {
                newIndexes.push(indexes[i]);
                if (indexes[i] === undefined) {
                    newShape.push(this.shape[i]);
                    map.push(i);
                }
            }

            o = Object.create(basearray);
            o.shape = newShape;
            o.get_element = function (reducedIndexes) {
                return that.get_element(expandIndexes(reducedIndexes));
            };

            o.set_element = function (reducedIndexes, value) {
                return that.set_element(expandIndexes(reducedIndexes), value);
            };

            return o;
        }
    };


    // Create an ND array from the given nested Array.
    // TODO: make sure input isn't ragged
    // TODO: make copy of vals
    // TODO: lock down shape
    // TODO: document
    jsn.asNDArray = function (vals) {
        var o = Object.create(basearray),
            val;

        // if it's already an array, we're done
        if (vals.get_element !== undefined) {
            return vals;
        }

        val = vals;
        o.shape = [];
        while (val.length !== undefined) {
            o.shape.push(val.length);
            val = val[0];
        }

        o.get_element = function (indexes) {
            var i, val = vals;
            for (i = 0; i < indexes.length; i += 1) {
                val = val[indexes[i]];
            }
            return val;
        };

        o.set_element = function (indexes, newVal) {
            var i, val = vals;
            for (i = 0; i < indexes.length - 1; i += 1) {
                val = val[indexes[i]];
            }
            val[indexes[i]] = newVal;
        };

        return o;
    };

    return jsn;
});
