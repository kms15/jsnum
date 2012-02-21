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

        // Checks a given list of indexes to make sure they are valid.
        // This function throws an exception if indexes is not an array of
        // integers with the same length as the shape.  If you would like
        // to allow undefined values (and shorter arrays), set
        // opts.allowUndefined to be true.
        checkIndexes : function (indexes, opts) {
            var i;

            if (!Array.isArray(indexes)) {
                throw new TypeError(
                    "Non-array given as an index."
                );
            }

            if (indexes.length !== this.shape.length) {
                if (!opts || !opts.allowUndefined ||
                        indexes.length > this.shape.length) {
                    throw new RangeError("Expected " +
                        this.shape.length + " indexes but given " +
                        indexes.length + " indexes.");
                }
            }

            for (i = 0; i < indexes.length; i += 1) {
                if (typeof indexes[i] !== 'number') {
                    if (!opts || !opts.allowUndefined ||
                            indexes[i] !== undefined) {
                        throw new TypeError(
                            "Encountered non-numeric index \"" +
                                indexes[i] + "\"."
                        );
                    }
                }

                if (indexes[i] < 0 || indexes[i] >= this.shape[i]) {
                    throw new RangeError(
                        "Index out of range, " +
                            indexes[i] + " is not within (0, " +
                            this.shape[i] + ")."
                    );
                }

                if (indexes[i] && indexes[i] !== Math.floor(indexes[i])) {
                    throw new TypeError("Non-integer index " + indexes[i]);
                }
            }
        },


        // create a new n-D array object that maps indexes to the selected
        // portions of the array.
        // TODO: document
        collapse : function (indexes) {
            var o, i, map = [], newShape = [], newIndexes = [], that = this;

            this.checkIndexes(indexes, { allowUndefined : true });

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
            Object.defineProperty(o, "shape",
                { value : newShape, writable : false });
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
    // TODO: document
    function asNDArray(vals) {
        var o = Object.create(AbstractNDArray.prototype), val, shape;

        // if it's already an array, we're done
        if (vals.getElement !== undefined) {
            return vals;
        }

        val = vals;
        shape = [];
        while (val.length !== undefined) {
            shape.push(val.length);
            val = val[0];
        }

        o.getElement = function (indexes) {
            var i, val = vals;

            this.checkIndexes(indexes);
            for (i = 0; i < indexes.length; i += 1) {
                val = val[indexes[i]];
            }
            return val;
        };

        o.setElement = function (indexes, newVal) {
            var i, val = vals;

            this.checkIndexes(indexes);
            for (i = 0; i < indexes.length - 1; i += 1) {
                val = val[indexes[i]];
            }
            val[indexes[i]] = newVal;
        };

        Object.defineProperty(o, "shape",
            { value : shape, writable : false });

        return o;
    }

    jsn.asNDArray = asNDArray;
    jsn.AbstractNDArray = AbstractNDArray;

    return jsn;
});
