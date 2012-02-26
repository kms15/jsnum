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

    // A base class for n-dimensional arrays that provides a rich set of
    // functionality building on a small set of functions required in
    // derived classes.
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
        // Built-in methods
        //

        // TODO: createResult

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
        // TODO: document
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
                if (typeof indexes[i] === 'number') {
                    if (!(indexes[i] >= 0 && indexes[i] < this.shape[i])) {
                        throw new RangeError(
                            "Index out of range, " +
                                indexes[i] + " is not within (0, " +
                                this.shape[i] + ")."
                        );
                    }

                    if (indexes[i] && indexes[i] !== Math.floor(indexes[i])) {
                        throw new TypeError("Non-integer index " + indexes[i]);
                    }
                } else {
                    if (!opts || !opts.allowUndefined ||
                            indexes[i] !== undefined) {
                        throw new TypeError(
                            "Encountered non-numeric index \"" +
                                indexes[i] + "\"."
                        );
                    }
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
                that.setElement(expandIndexes(reducedIndexes), value);
                return this;
            };

            return o;
        }
    };


    // An implementation of an NDArray that stores arbitrary types of elements.
    // This is likely to work for most uses, but more specialized types of
    // NDArray are likely to have better performance and memory usage.
    // TODO: document
    function UntypedNDArray(shape) {
        var i,
            size = 1,
            data = [],
            that = this,
            myShape = shape.slice(0);

        jsn.checkShape(shape);

        // if called without new, create a new object
        if (!(this instanceof UntypedNDArray)) {
            return new UntypedNDArray(myShape);
        }

        for (i = 0; i < myShape.length; i += 1) {
            size = size * myShape[i];
        }
        data.length = size;

        function calc1DIndex(indexes) {
            var index1D;

            that.checkIndexes(indexes);
            if (myShape.length === 0) {
                return 0;
            } else {
                index1D = indexes[0];

                for (i = 1; i < myShape.length; i += 1) {
                    index1D = index1D * myShape[i - 1] + indexes[i];
                }

                return index1D;
            }
        }

        this.getElement = function (indexes) {
            return data[calc1DIndex(indexes)];
        };

        this.setElement = function (indexes, value) {
            data[calc1DIndex(indexes)] = value;
            return this;
        };

        Object.defineProperty(this, "shape",
            { value : myShape, writable : false });
    }

    UntypedNDArray.prototype = Object.create(AbstractNDArray.prototype);


    // Create an ND array from the given nested Array.
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

        function copyVals(o, vals) {
            var i;

            if (o.shape.length === 0) {
                // 0D array
                if (Array.isArray(vals)) {
                    throw new TypeError("These lists do not appear to form" +
                        " and n-dimensional array!");
                }
                o.setElement([], vals);
            } else {
                if (vals.length !== o.shape[0]) {
                    throw new TypeError("These lists do not appear to form" +
                        " and n-dimensional array!");
                }

                for (i = 0; i < o.shape[0]; i += 1) {
                    copyVals(o.collapse([i]), vals[i]);
                }
            }
        }

        o = new jsn.UntypedNDArray(shape);
        copyVals(o, vals);

        return o;
    }

    // Ensures shape is a JavasScript array of non-negative integers.
    // TODO: document
    function checkShape(shape) {
        var i;

        if (!Array.isArray(shape)) {
            throw new TypeError(
                "Non-array given as a shape."
            );
        }

        for (i = 0; i < shape.length; i += 1) {
            if (typeof shape[i] !== 'number') {
                throw new TypeError(
                    "Encountered non-numeric length \"" +
                        shape[i] + "\"."
                );
            }

            if (shape[i] <= 0 || isNaN(shape[i])) {
                throw new RangeError(
                    "Encountered non-positive length " + shape[i]
                );
            }

            if (shape[i] !== Math.floor(shape[i])) {
                throw new TypeError("Non-integer length " + shape[i]);
            }

        }
    }
    jsn.asNDArray = asNDArray;
    jsn.AbstractNDArray = AbstractNDArray;
    jsn.UntypedNDArray = UntypedNDArray;
    jsn.checkShape = checkShape;

    return jsn;
});
