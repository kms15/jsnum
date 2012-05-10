/*global define, UntypedNDArray */

/** @overview This file declares the main components of the JSN module
 *  @copyright (c) 2012 Kendrick Shaw
 */

define(
    [],
    /** central module for the JSN library
     *  @exports jsn
     */
    function () {
        "use strict";
        var jsn = {};

        function abstractMethod() {
            throw new TypeError("call to an abstract method");
        }

        /** A base class for n-dimensional arrays that provides a rich set of
         * functionality building on a small set of functions required in
         * derived classes.  To create a new n-D array class, you can simply
         * create a new class inheriting from this one that implements
         * getElement, shape, and (for writable arrays) setElement.
         * @constructor
         */
        function AbstractNDArray() {
            throw new TypeError("AbstractNDArray is an abstract class and " +
                "should not be directly instantiated - please use an child class.");
        }

        AbstractNDArray.prototype = {
            //
            // Abstract methods
            //

            /** Reads one element of the array.  This must be overloaded in derived
             * classes.
             * @param { Array<int> } index A list of indexes for the desired element.
             * @returns The value of the array element at index
             * @abstract
             */
            getElement : function (index) {
                throw new TypeError("call to an abstract method");
            },

            /** Sets the value of one element of the array.  This must be overloaded in derived
             * classes if the array is not read only.
             * @param { Array<int> } index A list of indexes for the desired element.
             * @param newValue The new value to assign to the array element at index.
             * @returns The array (chainable)
             * @abstract
             */
            setElement : function (index, newValue) {
                throw new TypeError("call to an abstract method");
            },

            /** The lengths of each dimension of the n-dimensional array.  This must
              * be overloaded in derived classes
              * @type Array<int>
              * @readonly
              */
            shape: undefined,


            //
            // Built-in methods
            //

            /** Create an array for storing the result of a mathematical
             * operation.  By default this is just an UntypedNDArray, but
             * derived classes can overload this to specialize
             * the generated results based on what they know about the data
             * (for example it may be all 32 bit IEEE floating point).
             * @virtual
             * @param { Array<int> } shape The length of each of the
             *      dimensions of the new array.
             * @returns A new writable n-Dimensional array
             */
            createResult : function (shape) {
                return new UntypedNDArray(shape);
            },


            /** Checks a given list of indexes to make sure they are valid.
             * This function throws an exception if indexes is not an array of
             * integers with the same length as the shape.  If you would like
             * to allow undefined values (and shorter arrays), set
             * opts.allowUndefined to be true.
             * @param { Array<int> } indexes The indexes to check.
             * @param { object | undefined } opts A dictionary of options.
             * @throws { TypeError | RangeError }
             * @returns The n-dimensional array (chainable)
             */
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

                return this;
            },

            /** Create a new n-D array object that maps indexes to the selected
             *  portions of the array.  This effectively takes lower dimensional
             *  slices out of the array, for example supplying two of the four
             *  indexes for a four dimensional array (leaving the others as
             *  "undefined") would pick a two dimensional slice of the array
             *  with the elements that have matching values in the two indexes
             *  provided.
             *  @param { Array } indexes An array of integers or undefined,
             *      specifying which values to fix.
             *  @returns A (writable) lower dimensional view of the given slice
             *      of the original array.
             */
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
            },

            /** Perform a matrix product with another array.
             *  In particular, this function takes the dot product of the last
             *  dimension of the first array (this) and the first dimension
             *  of the second array (B).  This is equivalent to the dot product
             *  for vectors and the matrix product for matrices, with vectors
             *  being treated as rows when on the left and columns when on the
             *  right.
             *  @param B { NDArray } the other NDArray in the multiplication (on the right)
             *  @returns A new NDArray
             */
            dot : function (B) {
                var newShape = this.shape.slice(0, -1).concat(B.shape.slice(1)),
                    result = this.createResult(newShape);

                if (this.shape[this.shape.length - 1] !== B.shape[0]) {
                    throw new RangeError("Can not multiply array of shape " +
                        this.shape + " by array of shape " + this.shape);
                }

                function dotToResult(result, A, B) {
                    var i, total;

                    if (A.shape.length > 1) {
                        for (i = A.shape[0] - 1; i >= 0; i -= 1) {
                            dotToResult(result.collapse([i]), A.collapse([i]), B);
                        }
                    } else if (B.shape.length > 1) {
                        for (i = B.shape[1] - 1; i >= 0; i -= 1) {
                            dotToResult(result.collapse([i]), A, B.collapse([undefined, i]));
                        }
                    } else {
                        total = A.getElement([0]) * B.getElement([0]);
                        for (i = A.shape[0] - 1; i > 0; i -= 1) {
                            total += A.getElement([i]) * B.getElement([i]);
                        }
                        result.setElement([], total);
                    }
                }

                dotToResult(result, this, B);
                return result;
            }
        };

        /** Creates a human-readable text version of the array
         */
        AbstractNDArray.prototype.toString = function () {
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
        };



        /** An implementation of an NDArray that stores arbitrary types of elements.
         * This is likely to work for most uses, but more specialized types of
         * NDArray are likely to have better performance and memory usage.
         * @param { Array<int> } shape The length of each of the dimensions of
         *      the new array.
         * @constructor
         */
        function UntypedNDArray(shape) {
            var i,
                size = 1,
                data = [],
                that = this,
                myShape = shape.slice(0);

            AbstractNDArray.checkShape(shape);

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
                        index1D = index1D * myShape[i] + indexes[i];
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


        /** Create an ND array from the given nested Array.
         * This allows easy conversion from JavaScript arrays to n-dimensional
         * arrays.  Note that this function can not create an array containing
         * elements that are themselves arrays (the syntax would be ambiguous).
         * @param vals A single (non-array) value or nested arrays describing
         *     an n-dimensional array.
         * @returns An writable n-dimensional array containing a copy of the
         *     data in vals.
         */
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

        /** Verifies that the argument is a valid shape for an n-dimensional
         * array (i.e. a JavasScript array of non-negative integers).
         * @param { Array<int> } shape The shape array to check.
         * @throws { TypeError | RangeError }
         */
        AbstractNDArray.checkShape = function (shape) {
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
        };

        jsn.asNDArray = asNDArray;
        jsn.AbstractNDArray = AbstractNDArray;
        jsn.UntypedNDArray = UntypedNDArray;

        return jsn;
    }
);
