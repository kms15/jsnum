/*global define */

/*  This file declares the main components of the AbstractNDArray
 *  class
 *  @copyright (c) 2012 Kendrick Shaw
 */

define(
    ["src/jsnum-base"],
    function (jsnum) {
        "use strict";

        /** jsnum.AbstractNDArray
         *  A base class for n-dimensional arrays.
         *  This class provides a rich set of functionality building on a small
         *  set of functions required in derived classes.  To create a new n-D
         *  array class, you can simply create a new class inheriting from this
         *  one that implements getElement, shape, and (for writable arrays)
         *  setElement.
         */
        function AbstractNDArray() {
            throw new TypeError("AbstractNDArray is an abstract class and " +
                "should not be directly instantiated - please use a child " +
                "class.");
        }


        //
        // Abstract methods
        //


        /** jsnum.AbstractNDArray.getElement(index)
         *  Reads one element of the array.
         *  This must be overloaded in derived classes.
         *
         *  @param { Array<int> } index A list of indexes for the desired
         *     element.
         *
         *  @returns The value of the array element at index
         */
        AbstractNDArray.prototype.getElement = function () {
            throw new TypeError(
                "abstract array class (getElement has not been defined)"
            );
        };


        /** jsnum.AbstractNDArray.setElement(index, newValue)
         *  Sets the value of one element of the array.
         *  This must be overloaded in derived classes if the array is not
         *  read only.
         *
         *  @param { Array<int> } index A list of indexes for the desired
         *     element.
         *  @param newValue The new value to assign to the array element at
         *     index.
         *  @returns The array (chainable)
         *  @abstract
         */
        AbstractNDArray.prototype.setElement = function () {
            throw new TypeError("Attempt to set an element of a read-only " +
                "array (try using copy() first)");
        };


        /** jsnum.AbstractNDArray.shape
         *  The lengths of each dimension of the n-dimensional array.
         *  This must be overloaded in derived classe
         *  @type Array<int>
         *  @readonly
         */
        AbstractNDArray.prototype.shape = undefined;


        //
        // Built-in methods
        //

        /** jsnum.AbstractNDArray.createResult(shape)
         *  Create an array for storing a mathematical result.
         *  By default this is just an jsnum.UntypedNDArray, but
         *  derived classes can overload this to specialize
         *  the generated results based on what they know about the data
         *  (for example it may be all 32 bit IEEE floating point).
         *
         *  @param { Array<int> } shape The length of each of the
         *      dimensions of the new array.
         *  @returns A new writable n-Dimensional array
         */
        AbstractNDArray.prototype.createResult = function (shape) {
            return new jsnum.UntypedNDArray(shape);
        };


        /** jsnum.AbstractNDArray.copy()
         *  Create a copy of this array.
         *
         *  @returns A new n-dimensional array containing a shallow copy
         *     of the contents of this array.
         */
        AbstractNDArray.prototype.copy = function () {
            var result = this.createResult(this.shape),
                that = this;

            return result.walkIndexes(function (index) {
                result.setElement(index, that.val(index));
            });
        };


        /** jsnum.AbstractNDArray.checkIndexes(indexes, opts)
         *  Checks a given list of indexes to make sure they are valid.
         *  This function throws an exception if indexes is not an array of
         *  integers with the same length as the shape.  If you would like
         *  to allow undefined values (and shorter arrays), set
         *  opts.allowUndefined to be true.  By default negative indexes
         *  are allowed; to disable this set opts.nonnegative to true.  To
         *  allow ranges (specified as a JavaScript array with up to two
         *  elements giving the minimum and maximum), set opts.allowRange
         *  to true.
         *
         *  @param { Array<int> } indexes The indexes to check.
         *  @param { object | undefined } opts A dictionary of options.
         *  @throws { TypeError | RangeError }
         *  @returns The n-dimensional array (chainable)
         */
        AbstractNDArray.prototype.checkIndexes = function (indexes, opts) {
            var i, j, min, max, rePositiveInt = /^[0-9]+$/;
            opts = opts || {};

            // must be an array
            if (!Array.isArray(indexes)) {
                throw new TypeError(
                    "Non-array given as an index."
                );
            }

            // Loop over the incoming indexes (i), keeping track of the index
            // that this maps to (j)
            for (i = 0, j = 0; i < indexes.length && j < this.shape.length;
                    i += 1) {
                if (typeof indexes[i] === 'number') {
                    // Standard numeric index
                    if (!(indexes[i] >=
                            ((opts && opts.nonnegative) ? 0 : -this.shape[j]) &&
                            indexes[i] < this.shape[j])) {
                        throw new RangeError(
                            "Index out of range, " +
                                indexes[i] + " is not within (0, " +
                                this.shape[j] + ")."
                        );
                    }

                    if (indexes[i] && indexes[i] !== Math.floor(indexes[i])) {
                        throw new TypeError("Non-integer index " + indexes[i]);
                    }

                    j += 1;
                } else if (opts.allowUndefined && indexes[i] === undefined) {
                    // undefined/blank index
                    j += 1;
                } else if (opts.allowRange && Array.isArray(indexes[i])) {
                    // Range provided as [min, max]
                    min = indexes[i][0] === undefined ? 0 : indexes[i][0];
                    max = indexes[i][1] === undefined ? this.shape[j] : indexes[i][1];

                    if (typeof min !== "number" || typeof max !== "number") {
                        throw new TypeError("Non-numeric value encountered " +
                            "in range [" + indexes[i] + "]");
                    }

                    if (min < 0) {
                        min += this.shape[j];
                    }

                    if (max < 0) {
                        max += this.shape[j];
                    }

                    if (min >= max) {
                        throw new RangeError("Upper end of range was not " +
                            "greater than lower end of range: [" +
                            indexes[i] + "]");
                    }

                    if (max > this.shape[j] || min < 0) {
                        throw new RangeError("Range [" + indexes[i] +
                            "] extends beyond actual dimension [0, " +
                            this.shape[0] + "].");
                    }

                    if (indexes[i].length > 2) {
                        throw new RangeError("Too many elements in range [" +
                            indexes[i] + "]");
                    }

                    j += 1;
                } else if (!opts.allowDummy || !rePositiveInt.test(indexes[i])) {
                    // something else, and not a dummy index
                    throw new TypeError(
                        "Encountered non-numeric index \"" +
                            indexes[i] + "\"."
                    );
                }
            }
            if (opts.allowDummy) {
                // trailing dummy indexes are OK
                while (i < indexes.length && typeof indexes[i] === 'string' &&
                        rePositiveInt.test(indexes[i])) {
                    i += 1;
                }
            }

            if (j !== this.shape.length || i !== indexes.length) {
                if (!opts || !opts.allowUndefined ||
                        j >= this.shape.length) {
                    throw new RangeError("Expected " +
                        this.shape.length + " indexes but given " +
                        (j + 1) + " indexes.");
                }
            }


            return this;
        };


        /** jsnum.AbstractNDArray.isReadOnly()
         *  Returns true if this is a read-only array.
         *  An array is read-only if the contents can not be modified. This is
         *  the case if the setElement function of AbstractNDArray has not
         *  been overridden.  If you need a non-read-only version of the array,
         *  you can use jsnum.AbstractNDArray.copy() to create it.
         */
        AbstractNDArray.prototype.isReadOnly = function () {
            return (this.setElement ===
                jsnum.AbstractNDArray.prototype.setElement);
        };


        /** jsnum.AbstractNDArray.walkIndexes(callback)
         *  Calls a callback with every valid index for this array.
         *  This is useful when you want to perform an operation on every
         *  element element of the array.  The callback passed a single
         *  parameter which is the index to process.  The this
         *  variable for the callback is set to the original array.
         *  @param { function } callback A function to be called with each
         *      index
         *  @returns The n-dimensional array (chainable)
         */
        AbstractNDArray.prototype.walkIndexes = function (callback) {
            var shape = this.shape, that = this;

            function walk(index, pos) {
                var i;

                if (pos >= shape.length) {
                    callback.call(that, index);
                } else {
                    for (i = shape[pos] - 1; i >= 0; i -= 1) {
                        index[pos] = i;
                        walk(index, pos + 1);
                    }
                }
            }

            walk([], 0);
            return this;
        };


        /** jsnum.AbstractNDArray.hasShape(shape)
         *  Convenience function for checking if this.shape equals shape.
         *  (since JavaScript doesn't do deep comparison of Arrays by
         *  default)
         *  @param { Array } The shape to compare with this.shape
         *  @returns True iff this.shape matches shape
         */
        AbstractNDArray.prototype.hasShape = function (shape) {
            var i;

            if (shape === undefined || shape.length === undefined ||
                    shape.length !== this.shape.length) {
                return false;
            }

            for (i = shape.length - 1; i >= 0; i -= 1) {
                if (shape[i] !== this.shape[i]) {
                    return false;
                }
            }

            return true;
        };


        /** jsnum.AbstractNDArray.at(indexes)
         *  Create a different view of elements in the array.
         *  Create a new n-D array object that provides a different view of
         *  the data in this array based on the indexes provided.  Specifying
         *  an integer for the index for a given dimension will bind that
         *  index to that dimension in the new view, for example picking out
         *  a particular row or column of the matrix (thus lowering the
         *  number of dimensions by 1).  Giving a string containing a number
         *  will create a new "dummy" dimension of the specified size.
         *  Giving an Array with two elements will select a subrange of
         *  the array along that dimension.
         *
         *  @param { Array } indexes An array of integers or undefined,
         *      specifying which values to fix.
         *  @returns A (writable) lower dimensional view of the given slice
         *      of the original array.
         */
        AbstractNDArray.prototype.at = function (indexes) {
            var that = this, mapTo = [], stride = [], offsets = [];

            that.checkIndexes(indexes, { allowUndefined : true,
                allowDummy : true, allowRange : true });

            function updatedView(indexes, oldMapTo, oldStride, oldOffsets, oldShape) {
                var o, i, j, min, max,
                    stride = [], mapTo = [], newShape = [],
                    newOffsets = oldOffsets.slice(0);

                i = 0;
                j = 0;

                // Loop through the indexes to calculate the new array shape and
                // transforms from new array indexes to old ones..
                while (j < oldShape.length) {
                    if (indexes[i] === undefined) { // blank index
                        stride.push(oldStride[j]);
                        mapTo.push(oldMapTo[j]);
                        newShape.push(oldShape[j]);
                        j += 1;
                    } else if (typeof indexes[i] === 'string') { // dummy index
                        stride.push(0);
                        mapTo.push(0);
                        newShape.push(parseInt(indexes[i], 10));
                    } else if (Array.isArray(indexes[i])) { // range
                        min = indexes[i][0] === undefined ? 0 : indexes[i][0];
                        max = indexes[i][1] === undefined ?
                                oldShape[j] : indexes[i][1];

                        if (min < 0) {
                            min += oldShape[j];
                        }

                        if (max < 0) {
                            max += oldShape[j];
                        }

                        stride.push(oldStride[j]);
                        mapTo.push(oldMapTo[j]);
                        newShape.push(max - min);
                        if (oldStride[j] !== 0) {
                            newOffsets[oldMapTo[j]] += min;
                        }
                        j += 1;
                    } else if (indexes[i] < 0) {
                        if (oldStride[j] !== 0) {
                            newOffsets[oldMapTo[j]] += indexes[i] + oldShape[j];
                        }
                        j += 1;
                    } else {
                        if (oldStride[j] !== 0) {
                            newOffsets[oldMapTo[j]] += indexes[i];
                        }
                        j += 1;
                    }
                    i += 1;
                }
                // process any trailing dummy indexes
                while (i < indexes.length) {
                    stride.push(0);
                    mapTo.push(0);
                    newShape.push(parseInt(indexes[i], 10));
                    i += 1;
                }
                // convert the list of indexes given to the new view into
                // indexes for the original array.
                function expandIndexes(reducedIndexes) {
                    var expandedIndexes = newOffsets.slice(0), i;
                    o.checkIndexes(reducedIndexes);

                    // build an index into the old array
                    for (i = 0; i < mapTo.length; i += 1) {
                        if (stride[i]) {
                            expandedIndexes[mapTo[i]] += reducedIndexes[i];
                        }
                    }

                    return expandedIndexes;
                }

                // create the new view object o
                o = Object.create(AbstractNDArray.prototype);
                Object.defineProperty(o, "shape",
                    { value : newShape, writable : false });
                o.getElement = function (reducedIndexes) {
                    return that.getElement(expandIndexes(reducedIndexes));
                };
                o.at = function (indexes) {
                    o.checkIndexes(indexes, { allowUndefined : true,
                        allowDummy : true, allowRange : true });
                    return updatedView(indexes, mapTo, stride, newOffsets, newShape);
                };

                if (!that.isReadOnly()) {
                    o.setElement = function (reducedIndexes, value) {
                        that.setElement(expandIndexes(reducedIndexes), value);
                        return this;
                    };
                }

                return o;
            }

            // build an identity map from the incoming indexes
            while (mapTo.length < this.shape.length) {
                mapTo.push(mapTo.length);
                stride.push(1);
                offsets.push(0);
            }

            return updatedView(indexes, mapTo, stride, offsets, this.shape);
        };


        /** jsnum.AbstractNDArray.set(B)
         *  Replace this the elements of this array with a new value or values.
         *  If B is not an NDArray, all of the elements of this array will be
         *  set to B.  If B is an NDArray, it should be the same shape as this
         *  and specify the new elements of the array for every position in the
         *  array.
         *  @param { ... | NDArray } B The new value or or NDArray of new values
         *  @returns this n-dimensional array (chainable)
         */
        AbstractNDArray.prototype.set = function (B) {
            if (B.getElement === undefined) {
                return this.walkIndexes(function (index) {
                    this.setElement(index, B);
                });
            }

            if (!this.hasShape(B.shape)) {
                throw new RangeError("B must have the same shape as this");
            }

            return this.walkIndexes(function (index) {
                this.setElement(index, B.val(index));
            });
        };


        /** jsnum.AbstractNDArray.swap(B)
         *  Swap the contents of this array with those in B.
         *  Combined with
         *  at, this allows you to do things like swap rows or columns.
         *  @param { NDArray } B the array with which to swap elements
         *  @returns this n-dimensional array (chainable)
         */
        AbstractNDArray.prototype.swap = function (B) {
            return this.walkIndexes(function (index) {
                var temp = this.val(index);
                this.setElement(index, B.val(index));
                B.setElement(index, temp);
            });
        };


        /** jsnum.AbstractNDArray.max()
         *  Returns the largest number in the array.
         */
        AbstractNDArray.prototype.max = function () {
            var max = -Infinity;

            this.copy().walkIndexes(function (index) {
                var e = this.val(index);
                if (e > max) {
                    max = e;
                }
            });

            return max;
        };


        /** jsnum.AbstractNDArray.argMax()
         *  Returns the index of the largest number in the array.
         */
        AbstractNDArray.prototype.argMax = function () {
            var max = -Infinity, maxIndex;

            this.copy().walkIndexes(function (index) {
                var e = this.val(index);
                if (e > max) {
                    max = e;
                    maxIndex = index.slice(0);
                }
            });

            return maxIndex;
        };


        /** jsnum.AbstractNDArray.min()
         *  Returns the smallest number in the array.
         */
        AbstractNDArray.prototype.min = function () {
            var min = Infinity;

            this.copy().walkIndexes(function (index) {
                var e = this.val(index);
                if (e < min) {
                    min = e;
                }
            });

            return min;
        };


        /** jsnum.AbstractNDArray.argMin()
         *  Returns the index of the smallest number in the array.
         */
        AbstractNDArray.prototype.argMin = function () {
            var min = Infinity, minIndex;

            this.copy().walkIndexes(function (index) {
                var e = this.val(index);
                if (e < min) {
                    min = e;
                    minIndex = index.slice(0);
                }
            });

            return minIndex;
        };


        /** jsnum.AbstractNDArray.abs()
         *  Take the absolute value of each element in the array.
         *  Returns a new array containing the result.
         */
        AbstractNDArray.prototype.abs = function () {
            return this.copy().walkIndexes(function (index) {
                this.setElement(index, Math.abs(this.val(index)));
            });
        };


        /** jsnum.AbstractNDArray.reciprocal()
         *  Take the reciprocal of each element in the array.
         *  Returns a new array containing the result.
         */
        AbstractNDArray.prototype.reciprocal = function () {
            return this.copy().walkIndexes(function (index) {
                this.setElement(index, 1 / this.val(index));
            });
        };


        /** jsnum.AbstractNDArray.addHere(B)
         *  Replace this array with an element-wise sum of this array and B.
         *  @param { Number | NDArray } B the number or elements to add to
         *      this array
         *  @returns this n-dimensional array (chainable)
         */
        AbstractNDArray.prototype.addHere = function (B) {
            if (typeof B === 'number') {
                return this.walkIndexes(function (index) {
                    this.setElement(index, this.val(index) + B);
                });
            }

            if (B.getElement === undefined) {
                throw new TypeError("B must be an NDArray or number");
            }

            if (!this.hasShape(B.shape)) {
                throw new RangeError("B must have the same shape as this");
            }

            return this.walkIndexes(function (index) {
                this.setElement(index, this.val(index) + B.val(index));
            });
        };


        /** jsnum.AbstractNDArray.add(B)
         *  Perform an element-wise addition with another array.
         *  @param { Number | NDArray } B the number or elements to add to
         *      this array
         *  @returns a new array
         */
        AbstractNDArray.prototype.add = function (B) {
            return this.copy().addHere(B);
        };


        /** jsnum.AbstractNDArray.subHere(B)
         *  Replace this array with an element-wise subtraction with B.
         *  @param { Number | NDArray } B the number or elements to subtract
         *      from this array
         *  @returns this n-dimensional array (chainable)
         */
        AbstractNDArray.prototype.subHere = function (B) {
            if (typeof B === 'number') {
                return this.walkIndexes(function (index) {
                    this.setElement(index, this.val(index) - B);
                });
            }

            if (B.getElement === undefined) {
                throw new TypeError("B must be an NDArray or number");
            }

            if (!this.hasShape(B.shape)) {
                throw new RangeError("B must have the same shape as this");
            }

            return this.walkIndexes(function (index) {
                this.setElement(index, this.val(index) - B.val(index));
            });
        };


        /** jsnum.AbstractNDArray.sub(B)
         *  Perform an element-wise subtraction with B.
         *  @param { Number | NDArray } B the number or elements to subtract
         *      from this array
         *  @returns a new array
         */
        AbstractNDArray.prototype.sub = function (B) {
            return this.copy().subHere(B);
        };


        /** jsnum.AbstractNDArray.mulHere(B)
         *  Replace this array with an element-wise product with B.
         *  @param { Number | NDArray } B the number or elements to multiply
         *      by this array
         *  @returns this n-dimensional array (chainable)
         */
        AbstractNDArray.prototype.mulHere = function (B) {
            if (typeof B === 'number') {
                return this.walkIndexes(function (index) {
                    this.setElement(index, this.val(index) * B);
                });
            }

            if (B.getElement === undefined) {
                throw new TypeError("B must be an NDArray or number");
            }

            if (!this.hasShape(B.shape)) {
                throw new RangeError("B must have the same shape as this");
            }

            return this.walkIndexes(function (index) {
                this.setElement(index, this.val(index) * B.val(index));
            });
        };


        /** jsnum.AbstractNDArray.mul(B)
         *  Perform an element-wise multiplication with another array.
         *  @param { Number | NDArray } B the number or elements to multiply
         *      by this array
         *  @returns a new array
         */
        AbstractNDArray.prototype.mul = function (B) {
            return this.copy().mulHere(B);
        };


        /** jsnum.AbstractNDArray.divHere(B)
         *  Replace this array with an element-wise division by B.
         *  @param { Number | NDArray } B the number or elements by which to
         *      divide this array
         *  @returns this n-dimensional array (chainable)
         */
        AbstractNDArray.prototype.divHere = function (B) {
            if (typeof B === 'number') {
                return this.walkIndexes(function (index) {
                    this.setElement(index, this.val(index) / B);
                });
            }

            if (B.getElement === undefined) {
                throw new TypeError("B must be an NDArray or number");
            }

            if (!this.hasShape(B.shape)) {
                throw new RangeError("B must have the same shape as this");
            }

            return this.walkIndexes(function (index) {
                this.setElement(index, this.val(index) / B.val(index));
            });
        };

        /** jsnum.AbstractNDArray.div(B)
         *  Perform an element-wise division by another array.
         *  @param { Number | NDArray } B the number or elements by which to
         *      divide this array
         *  @returns a new array
         */
        AbstractNDArray.prototype.div = function (B) {
            return this.copy().divHere(B);
        };


        /** jsnum.AbstractNDArray.negHere()
         *  Replace this array with its element-wise negation.
         *  @returns this n-dimensional array (chainable)
         */
        AbstractNDArray.prototype.negHere = function () {
            return this.walkIndexes(function (index) {
                this.setElement(index, -this.val(index));
            });
        };

        /** jsnum.AbstractNDArray.neg()
         *  Perform an element-wise negation.
         *  @returns a new array
         */
        AbstractNDArray.prototype.neg = function () {
            return this.copy().negHere();
        };


        /** jsnum.AbstractNDArray.sum()
         *  Calculate the sum of all of the elements in this array.
         */
        AbstractNDArray.prototype.sum = function () {
            var total = 0;
            this.walkIndexes(function (index) {
                total += this.val(index);
            });
            return total;
        };


        /** jsnum.AbstractNDArray.toArray()
         *  Convert this NDArray to a nested Array.
         */
        AbstractNDArray.prototype.toArray = function () {
            var i, result = [];

            if (this.shape.length === 0) {
                return this.val();
            }

            for (i = 0; i < this.shape[0]; i += 1) {
                result[i] = this.at([i]).toArray();
            }

            return result;
        };


        /** jsnum.AbstractNDArray.transpose()
         *  Get the transpose of this array.
         *  For a 0 or 1 dimensional array, this is just the array itself.  For
         *  a 2 dimensional array or higher, the order of the indexing of the
         *  dimensions is reversed.  Note that for a matrix, this is the same
         *  as the matrix transpose.  The transpose is a new view of the
         *  original array, i.e. calling setElement will change the
         *  corresponding element in the original array.
         *
         *  @returns The transpose of this array.
         */
        AbstractNDArray.prototype.transpose = function () {
            var that = this, newShape, i, permutation = [], result;

            for (i = this.shape.length - 1; i >= 0; i -= 1) {
                permutation[i] = this.shape.length - 1 - i;
            }

            function permute(index) {
                var newIndex = [];

                for (i = that.shape.length - 1; i >= 0; i -= 1) {
                    newIndex[i] = index[permutation[i]];
                }

                return newIndex;
            }

            newShape = permute(this.shape);

            result = Object.create(AbstractNDArray.prototype);

            Object.defineProperty(result, "shape",
                { value : newShape, writable : false });

            result.getElement = function (index) {
                return that.val(permute(index));
            };

            if (!this.isReadOnly()) {
                result.setElement = function (index, value) {
                    that.setElement(permute(index), value);
                    return this;
                };
            }

            return result;
        };


        /** jsnum.AbstractNDArray.val(index)
         *  Gets a particular element from the array.
         *  This is similar to  getElement, but provides better error checking
         *  and support for negative indexes.
         *
         *  @param {Array<int>} index The index of the element to retrieve
         *      (optional for a 0-D array).
         */
        AbstractNDArray.prototype.val = function (index) {
            var i;

            if (index === undefined) {
                index = [];
            } else {
                this.checkIndexes(index);
                index = index.slice(0);
            }

            // handle negative indexes
            for (i = index.length - 1; i >= 0; i -= 1) {
                if (index[i] < 0) {
                    index[i] += this.shape[i];
                }
            }

            return this.getElement(index);
        };


        /** jsnum.AbstractNDArray.toString()
         * Create a human-readable text version of the array.
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
                            String(array.val()).length);
                }

                result = minFieldWidth;

                for (i = 0; i < array.shape[0]; i += 1) {
                    result = getMaxFieldWidth(array.at([i]), result);
                }

                return result;
            }
            fieldWidth = getMaxFieldWidth(this, 0);

            function format1D(array, fieldWidth) {
                var result, i;

                result = '[ ';
                for (i = 0; i < array.shape[0]; i += 1) {
                    result += padLeft(array.val([i]), fieldWidth);
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
                    result += format1D(array.at([i]), fieldWidth);
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
                    result = '( ' + array.val() + ' )';
                } else if (array.shape.length === 1) {
                    result = format1D(array, fieldWidth);
                } else if (array.shape.length === 2) {
                    result = format2D(array, fieldWidth, indent);
                } else {
                    result = padLeft('', indent) + '[\n';
                    for (i = 0; i < array.shape[0]; i += 1) {
                        result += formatND(array.at([i]), fieldWidth,
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


        /** jsnum.AbstractNDArray.checkShape(shape)
         *  Verify that the argument is a valid shape for an n-D array.
         *  A valid shape must be a JavasScript array of non-negative integers.
         *  @param { Array<int> } shape The shape array to check.
         *  @throws { TypeError | RangeError }
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

        jsnum.AbstractNDArray = AbstractNDArray;

        return AbstractNDArray;
    }
);
