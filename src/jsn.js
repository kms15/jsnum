/*global define */
define([], function () {
    "use strict";
    var jsn = {};

    function abstractMethod() {
        throw new TypeError("call to an abstract method");
    }

    function AbstractNDArray() {
        throw new TypeError("AbstractNDArray is an abstract class and " +
            "should not be directly instantiated - please use an child class.");
    }

    AbstractNDArray.prototype = {
        //
        // Abstract methods
        //

        // getElement is used to read one element of the array.  It takes
        // one parameter, which is the list of indexes for the desired 
        // element, and returns the value stored in that element.              
        getElement : abstractMethod,

        // setElement is used to change the value of a single element in the
        // array.  It takes two parameters - the first being the list of 
        // indexes of that element and the second being the new value of that
        // element.  
        setElement : abstractMethod,

        // shape contains an array with the lengths of each dimension of the 
        // n-dimensional array
        shape: undefined,


        //
        // Build-in methods
        //

        // create a human-readable version of the array
        // TODO: document
        toString : function () {
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
                            String(array.getElement([])).length);
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
                    result += padLeft(array.getElement([i]), fieldWidth);
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
                    result = '( ' + array.getElement([]) + ' )';
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

        checkIndexes : function (indexes) {
            var i;

            if (!Array.isArray(indexes)) {
                throw new TypeError(
                    "Non-array given as an index."
                );
            }

            if (indexes.length !== this.shape.length) {
                throw new RangeError(
                    "Expected " + this.shape.length + " indexes but given " +
                        indexes.length + " indexes."
                );
            }

            for (i = 0; i < indexes.length; i += 1) {
                if (typeof indexes[i] !== 'number') {
                    throw new TypeError(
                        "Encountered non-numeric index \"" +
                            indexes[i] + "\"."
                    );
                }

                if (indexes[i] < 0 || indexes[i] >= this.shape[i]) {
                    throw new RangeError(
                        "Index out of range, " +
                            indexes[i] + " is not within (0, " +
                            this.shape[i] + ")."
                    );
                }
            }
        },


        // create a new array object that maps indexes to the selected
        // portions of the array.
        // TODO: lock down shape
        // TODO: document
        collapse : function (indexes) {
            var o, i, map = [], newShape = [], newIndexes = [], that = this;

            if (!Array.isArray(indexes)) {
                throw new TypeError("indexes should be a javascript array");
            }

            if (indexes.length > this.shape.length) {
                throw new RangeError("More indexes than dimensions to index");
            }

            function expandIndexes(reducedIndexes) {
                var expandedIndexes = [], i;
                o.checkIndexes(reducedIndexes);


                // build a full length index
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

            o = Object.create(AbstractNDArray.prototype);
            o.shape = newShape;
            o.getElement = function (reducedIndexes) {
                return that.getElement(expandIndexes(reducedIndexes));
            };

            o.setElement = function (reducedIndexes, value) {
                return that.setElement(expandIndexes(reducedIndexes), value);
            };

            return o;
        }
    };


    // Create an ND array from the given nested Array.
    // TODO: make sure input isn't ragged
    // TODO: make copy of vals
    // TODO: lock down shape
    // TODO: document
    function asNDArray(vals) {
        var o = Object.create(AbstractNDArray.prototype),
            val;

        // if it's already an array, we're done
        if (vals.getElement !== undefined) {
            return vals;
        }

        val = vals;
        o.shape = [];
        while (val.length !== undefined) {
            o.shape.push(val.length);
            val = val[0];
        }

        o.getElement = function (indexes) {
            var i, val = vals;
            for (i = 0; i < indexes.length; i += 1) {
                val = val[indexes[i]];
            }
            return val;
        };

        o.setElement = function (indexes, newVal) {
            var i, val = vals;
            for (i = 0; i < indexes.length - 1; i += 1) {
                val = val[indexes[i]];
            }
            val[indexes[i]] = newVal;
        };

        return o;
    }

    jsn.asNDArray = asNDArray;
    jsn.AbstractNDArray = AbstractNDArray;

    return jsn;
});
