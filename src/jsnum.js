/*global define, UntypedNDArray */

/** @overview This file declares the main components of the JSN module
 *  @copyright (c) 2012 Kendrick Shaw
 */

define(
    [],
    /** central module for the JSN library
     *  @exports jsnum
     */
    function () {
        "use strict";
        var jsnum = {};

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


        //
        // Abstract methods
        //


        /** Reads one element of the array.  This must be overloaded in derived
         * classes.
         * @param { Array<int> } index A list of indexes for the desired element.
         * @returns The value of the array element at index
         * @abstract
         */
        AbstractNDArray.prototype.getElement = function (index) {
            throw new TypeError("abstract array class (getElement has not been defined)");
        };


        /** Sets the value of one element of the array.  This must be overloaded in derived
         * classes if the array is not read only.
         * @param { Array<int> } index A list of indexes for the desired element.
         * @param newValue The new value to assign to the array element at index.
         * @returns The array (chainable)
         * @abstract
         */
        AbstractNDArray.prototype.setElement = function (index, newValue) {
            throw new TypeError("Attempt to set an element of a read-only array (try using copy() first)");
        };


        /** The lengths of each dimension of the n-dimensional array.  This must
          * be overloaded in derived classes
          * @type Array<int>
          * @readonly
          */
        AbstractNDArray.prototype.shape = undefined;


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
        AbstractNDArray.prototype.createResult = function (shape) {
            return new UntypedNDArray(shape);
        };


        /** Create a copy of this array.
         * @returns A new n-dimensional array containing a shallow copy
         *     of the contents of this array.
         */
        AbstractNDArray.prototype.copy = function () {
            var result = this.createResult(this.shape),
                that = this;

            return result.walkIndexes(function (index) {
                result.setElement(index, that.val(index));
            });
        };


        /** Checks a given list of indexes to make sure they are valid.
         * This function throws an exception if indexes is not an array of
         * integers with the same length as the shape.  If you would like
         * to allow undefined values (and shorter arrays), set
         * opts.allowUndefined to be true.  By default negative indexes
         * are allowed; to disable this set opts.nonnegative to true.  To
         * allow ranges (specified as a JavaScript array with up to two
         * elements giving the minimum and maximum), set opts.allowRange
         * to true.
         *
         * @param { Array<int> } indexes The indexes to check.
         * @param { object | undefined } opts A dictionary of options.
         * @throws { TypeError | RangeError }
         * @returns The n-dimensional array (chainable)
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
            for (i = 0, j = 0; i < indexes.length && j < this.shape.length; i += 1) {
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
                        j + " indexes.");
                }
            }


            return this;
        };


        /** Returns true if this is a read-only array (and thus can be
         *  used but not modified).  This is the case if the setElement
         *  function of AbstractNDArray has not been overridden.
         */
        AbstractNDArray.prototype.isReadOnly = function () {
            return (this.setElement ===
                jsnum.AbstractNDArray.prototype.setElement);
        };


        /** Calls a callback with every valid index for this array.  This
         *  is useful when you want to perform an operation on every
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


        /** Convenience function for checking if this.shape equals shape
         *  (since JavaScript doesn't do deep comparison of Arrays by
         *  default).
         *  @param { Array } The shape to compare with this.shape
         *  @returns True iff this.shape matches shape
         */
        AbstractNDArray.prototype.hasShape = function (shape) {
            var i;

            if (shape === undefined || shape.length === undefined ||
                    shape.length !== this.shape.length) {
                return false;
            } else {
                for (i = shape.length - 1; i >= 0; i -= 1) {
                    if (shape[i] !== this.shape[i]) {
                        return false;
                    }
                }

                return true;
            }
        };


        /** Create a new n-D array object that provides a different view of
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
            var o, i, mapFrom = [], mapTo = [], newShape = [], newIndexes = [],
                that = this, min, max;

            this.checkIndexes(indexes, { allowUndefined : true,
                allowDummy : true, allowRange : true });

            i = 0;

            // Loop through the indexes to calculate the new array shape and
            // transforms from new array indexes to old ones..
            while (newIndexes.length < this.shape.length) {
                if (indexes[i] === undefined) { // blank index
                    mapFrom.push(newShape.length);
                    mapTo.push(newIndexes.length);
                    newShape.push(this.shape[newIndexes.length]);
                    newIndexes.push(0);
                } else if (typeof indexes[i] === 'string') { // dummy index
                    newShape.push(parseInt(indexes[i], 10));
                } else if (Array.isArray(indexes[i])) { // range
                    min = indexes[i][0] === undefined ? 0 : indexes[i][0];
                    max = indexes[i][1] === undefined ?
                            this.shape[newIndexes.length] : indexes[i][1];

                    if (min < 0) {
                        min += this.shape[newIndexes.length];
                    }

                    if (max < 0) {
                        max += this.shape[newIndexes.length];
                    }

                    mapFrom.push(newShape.length);
                    mapTo.push(newIndexes.length);
                    newShape.push(max - min);
                    newIndexes.push(min);
                } else if (indexes[i] < 0) {
                    newIndexes.push(indexes[i] + this.shape[newIndexes.length]);
                } else {
                    newIndexes.push(indexes[i]);
                }
                i += 1;
            }
            // process any trailing dummy indexes
            while (i < indexes.length) {
                newShape.push(parseInt(indexes[i], 10));
                i += 1;
            }

            // convert the list of indexes given to the new view into
            // indexes for the original array.
            function expandIndexes(reducedIndexes) {
                var expandedIndexes = newIndexes.slice(0), i;
                o.checkIndexes(reducedIndexes);

                // build an index into the old array
                for (i = 0; i < mapFrom.length; i += 1) {
                    expandedIndexes[mapTo[i]] += reducedIndexes[mapFrom[i]];
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

            if (!this.isReadOnly()) {
                o.setElement = function (reducedIndexes, value) {
                    that.setElement(expandIndexes(reducedIndexes), value);
                    return this;
                };
            }

            return o;
        };


        /** Swap the contents of this array with those in B.  Combined with
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


        /** Returns the largest number in the array.
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


        /** Returns the index of the largest number in the array.
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


        /** Returns the smallest number in the array.
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


        /** Returns the index of the smallest number in the array.
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


        /** Returns a new NDArray containing the absolute value of each
         *  element in this NDArray.
         */
        AbstractNDArray.prototype.abs = function () {
            return this.copy().walkIndexes(function (index) {
                this.setElement(index, Math.abs(this.val(index)));
            });
        };


        /** Returns a new NDArray containing the reciprocal of each
         *  element in this NDArray.
         */
        AbstractNDArray.prototype.reciprocal = function () {
            return this.copy().walkIndexes(function (index) {
                this.setElement(index, 1 / this.val(index));
            });
        };


        /** Replace this the elements of this array with a new value or value).
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
            } else if (!this.hasShape(B.shape)) {
                throw new RangeError("B must have the same shape as this");
            } else {
                return this.walkIndexes(function (index) {
                    this.setElement(index, B.val(index));
                });
            }
        };


        /** Replace this array with an element-wise sum of this array and B.
         *  @param { Number | NDArray } B the number or elements to add to this array
         *  @returns this n-dimensional array (chainable)
         */
        AbstractNDArray.prototype.addHere = function (B) {
            if (typeof B === 'number') {
                return this.walkIndexes(function (index) {
                    this.setElement(index, this.val(index) + B);
                });
            } else if (B.getElement === undefined) {
                throw new TypeError("B must be an NDArray or number");
            } else if (!this.hasShape(B.shape)) {
                throw new RangeError("B must have the same shape as this");
            } else {
                return this.walkIndexes(function (index) {
                    this.setElement(index, this.val(index) + B.val(index));
                });
            }
        };


        /** Perform an element-wise addition with another array.
         *  @param { Number | NDArray } B the number or elements to add to this array
         *  @returns a new array
         */
        AbstractNDArray.prototype.add = function (B) {
            return this.copy().addHere(B);
        };


        /** Replace this array with an element-wise subtraction of B from this array.
         *  @param { Number | NDArray } B the number or elements to subtract from this array
         *  @returns this n-dimensional array (chainable)
         */
        AbstractNDArray.prototype.subHere = function (B) {
            if (typeof B === 'number') {
                return this.walkIndexes(function (index) {
                    this.setElement(index, this.val(index) - B);
                });
            } else if (B.getElement === undefined) {
                throw new TypeError("B must be an NDArray or number");
            } else if (!this.hasShape(B.shape)) {
                throw new RangeError("B must have the same shape as this");
            } else {
                return this.walkIndexes(function (index) {
                    this.setElement(index, this.val(index) - B.val(index));
                });
            }
        };


        /** Perform an element-wise subtraction with B.
         *  @param { Number | NDArray } B the number or elements to subtract from this array
         *  @returns a new array
         */
        AbstractNDArray.prototype.sub = function (B) {
            return this.copy().subHere(B);
        };


        /** Replace this array with an element-wise multiplication with B.
         *  @param { Number | NDArray } B the number or elements to multiply by this array
         *  @returns this n-dimensional array (chainable)
         */
        AbstractNDArray.prototype.mulHere = function (B) {
            if (typeof B === 'number') {
                return this.walkIndexes(function (index) {
                    this.setElement(index, this.val(index) * B);
                });
            } else if (B.getElement === undefined) {
                throw new TypeError("B must be an NDArray or number");
            } else if (!this.hasShape(B.shape)) {
                throw new RangeError("B must have the same shape as this");
            } else {
                return this.walkIndexes(function (index) {
                    this.setElement(index, this.val(index) * B.val(index));
                });
            }
        };


        /** Perform an element-wise multiplication with another array.
         *  @param { Number | NDArray } B the number or elements to multiply by this array
         *  @returns a new array
         */
        AbstractNDArray.prototype.mul = function (B) {
            return this.copy().mulHere(B);
        };


        /** Replace this array with an element-wise division by B.
         *  @param { Number | NDArray } B the number or elements to divide this array by
         *  @returns this n-dimensional array (chainable)
         */
        AbstractNDArray.prototype.divHere = function (B) {
            if (typeof B === 'number') {
                return this.walkIndexes(function (index) {
                    this.setElement(index, this.val(index) / B);
                });
            } else if (B.getElement === undefined) {
                throw new TypeError("B must be an NDArray or number");
            } else if (!this.hasShape(B.shape)) {
                throw new RangeError("B must have the same shape as this");
            } else {
                return this.walkIndexes(function (index) {
                    this.setElement(index, this.val(index) / B.val(index));
                });
            }
        };

        /** Perform an element-wise division by another array.
         *  @param { Number | NDArray } B the number or elements to divide this array by
         *  @returns a new array
         */
        AbstractNDArray.prototype.div = function (B) {
            return this.copy().divHere(B);
        };


        /** Replace this array with its element-wise negation.
         *  @returns this n-dimensional array (chainable)
         */
        AbstractNDArray.prototype.negHere = function () {
            return this.walkIndexes(function (index) {
                this.setElement(index, -this.val(index));
            });
        };

        /** Perform an element-wise negation.
         *  @returns a new array
         */
        AbstractNDArray.prototype.neg = function () {
            return this.copy().negHere();
        };


        /** Calculate the sum of all of the elements in this array.
         */
        AbstractNDArray.prototype.sum = function () {
            var total = 0;
            this.walkIndexes(function (index) {
                total += this.val(index);
            });
            return total;
        };


        /** Calculate the square root of the sum of the squares of all of the
         *  elements in this array.  For a vector, this is the Euclidean norm,
         *  and for a matrix, this is the Frobenius norm.
         */
        AbstractNDArray.prototype.norm = function () {
            var total = 0, scale;
            this.walkIndexes(function (index) {
                var val = this.val(index);
                total += val * val;
            });

            if (total === Infinity) {
                // vector too large to square; scale it by absmax first
                scale = this.abs().max();
                return scale * this.div(scale).norm();
            }

            return Math.sqrt(total);
        };


        /** Returns true iff this is an orthogonal matrix, meaning that all of
         *  the rows (and columns) are orthogonal unit vectors, and that the
         *  transpose of the matrix is equal to its inverse.
         */
        AbstractNDArray.prototype.isOrthogonal = function () {
            if (this.shape.length !== 2 || this.shape[0] !== this.shape[1]) {
                return false;
            }
            return jsnum.areClose(this.dot(this.transpose()), jsnum.eye(this.shape[0]));
        };


        /** Perform a matrix product with another array.
         *  In particular, this function takes the dot product of the last
         *  dimension of the first array (this) and the first dimension
         *  of the second array (B).  This is equivalent to the dot product
         *  for vectors and the matrix product for matrices, with vectors
         *  being treated as rows when on the left and columns when on the
         *  right.
         *  @param { NDArray } B the other NDArray in the multiplication (on the right)
         *  @returns A new NDArray
         */
        AbstractNDArray.prototype.dot = function (B) {
            var newShape = this.shape.slice(0, -1).concat(B.shape.slice(1)),
                result = this.createResult(newShape);

            if (this.shape[this.shape.length - 1] !== B.shape[0]) {
                throw new RangeError("Can not multiply array of shape " +
                    this.shape + " by array of shape " + B.shape);
            }

            function dotToResult(result, A, B) {
                var i, total;

                if (A.shape.length > 1) {
                    for (i = A.shape[0] - 1; i >= 0; i -= 1) {
                        dotToResult(result.at([i]), A.at([i]), B);
                    }
                } else if (B.shape.length > 1) {
                    for (i = B.shape[1] - 1; i >= 0; i -= 1) {
                        dotToResult(result.at([i]), A, B.at([undefined, i]));
                    }
                } else {
                    total = A.val([0]) * B.val([0]);
                    for (i = A.shape[0] - 1; i > 0; i -= 1) {
                        total += A.val([i]) * B.val([i]);
                    }
                    result.setElement([], total);
                }
            }

            dotToResult(result, this, B);
            return result;
        };

        /** converts this NDArray to a nested Array
         */
        AbstractNDArray.prototype.toArray = function () {
            var i, result = [];

            if (this.shape.length === 0) {
                return this.val();
            } else {
                for (i = 0; i < this.shape[0]; i += 1) {
                    result[i] = this.at([i]).toArray();
                }

                return result;
            }
        };


        /** Decomposes this matrix into three matrices, P, L and U, such
         *  that P is a row permutation matrix, L (lower) has no elements
         *  above the diagonal, U (upper) has no elements below the
         *  diagonal, and P L U = A.
         *
         *  Uses Crout's algorithm with scaled partial pivoting.
         *
         *  See pp 48-54 in Press WH, Teukolsky SA, Vetterling WT, Flannery BP.
         *  Numerical Recipes 3rd Edition: The Art of Scientific Computing.
         *  3rd ed. Cambridge University Press; 2007.
         *
         *  @returns an object with the members, P (permutation),
         *      L (lower), U (upper), and the intermediate results
         *      p (the row permutations performed by P), p_epsilon (-1 iff p
         *      is composed of an odd number of swaps, otherwise 1), and
         *      decompositionType (set to "LU").
         */
        AbstractNDArray.prototype.LUDecomposition = function () {
            var P, L, U, p = [], p_epsilon = 1,
                i, j, k,
                N = this.shape[0],
                scaling = [],
                pivotRow, pivotVal, testVal, pivotScalingFactor, rowScalingFactor,
                scratch = this.copy();

            if (this.shape.length !== 2 || this.shape[0] !== this.shape[1]) {
                throw new TypeError("LUDecomposition currently only supports square matrices");
            }

            for (i = 0; i < N; i += 1) {
                scaling[i] = 1 / this.at([i]).abs().max();
            }

            // for each column...
            for (k = 0; k < N; k += 1) {

                // find the largest scaled pivot
                pivotRow = k;
                pivotVal = Math.abs(scaling[k] * scratch.val([k, k]));
                for (i = k + 1; i < N; i += 1) {
                    testVal = Math.abs(scaling[i] * scratch.val([i, k]));
                    if (testVal > pivotVal) {
                        pivotRow = i;
                        pivotVal = testVal;
                    }
                }

                // swap rows if needed to put the pivot value in the right place
                if (pivotRow !== k) {
                    scratch.at([k]).swap(scratch.at([pivotRow]));
                    p_epsilon = -p_epsilon; // track the permutation parity
                    scaling[pivotRow] = scaling[k]; // fix the scaling (for the part we'll use again)
                }
                p[k] = pivotRow;

                // Press et al say that this is a good idea for some
                // singular matrices; we'll trust them once we've seen this.
                //if (pivotVal === 0) {
                //    scratch.setElement([k, k], 1e-40); // a very small non-zero number
                //}

                // Now reduce the remaining rows
                pivotScalingFactor = 1 / scratch.val([k, k]);
                for (i = k + 1; i < N; i += 1) {
                    rowScalingFactor =  scratch.val([i, k]) * pivotScalingFactor;
                    scratch.setElement([i, k], rowScalingFactor);
                    for (j = k + 1; j < N; j += 1) {
                        scratch.setElement([i, j], scratch.val([i, j]) - scratch.val([k, j]) * rowScalingFactor);
                    }
                }
            }

            P = this.createResult(this.shape);
            P.walkIndexes(function (index) {
                var val;
                if (index[0] === index[1]) {
                    val = 1;
                } else {
                    val = 0;
                }
                this.setElement(index, val);
            });
            for (i = N - 1; i >= 0; i -= 1) {
                if (p[i] !== i) {
                    P.at([i]).swap(P.at([p[i]]));
                }
            }
            P.det = function () { return p_epsilon; };
            P.setElement = jsnum.AbstractNDArray.prototype.setElement;

            L = this.createResult(this.shape);
            L.walkIndexes(function (index) {
                var val;
                if (index[0] < index[1]) {
                    val = 0;
                } else if (index[0] === index[1]) {
                    val = 1;
                } else {
                    val = scratch.val(index);
                }
                this.setElement(index, val);
            });
            L.setElement = jsnum.AbstractNDArray.prototype.setElement;

            U = this.createResult(this.shape);
            U.walkIndexes(function (index) {
                var val;
                if (index[0] > index[1]) {
                    val = 0;
                } else {
                    val = scratch.val(index);
                }
                this.setElement(index, val);
            });
            U.setElement = jsnum.AbstractNDArray.prototype.setElement;

            return { P: P, L: L, U: U, p: p, decompositionType : "LU" };
        };

        /** Find the inverse of this matrix.  If this is an N × N square
         *  non-singular matrix this function finds the inverse of the
         *  matrix, using jsnum.linSolve (which uses LU Decomposition).
         *  @returns The inverse of this matrix.
         */
        AbstractNDArray.prototype.inverse = function () {
            return jsnum.solveLinearSystem(this, jsnum.eye(this.shape[0]));
        };

        /** Find the determinant of this matrix.  If this is an N × N
         *  square matrix this function finds the determinant of the
         *  matrix, using jsnum.linSolve (which uses LU Decomposition).
         *  @returns The determinant of this matrix.
         */
        AbstractNDArray.prototype.det = function () {
            var lu = this.LUDecomposition(), N = this.shape[0], i, result;

            // determinant of a product is the product of the determinants,
            // and the determinant of an upper or lower triangular matrix
            // is just the product of the diagonal elements.
            result = lu.P.det();
            for (i = 0; i < N; i += 1) {
                result *= lu.L.val([i, i]);
                result *= lu.U.val([i, i]);
            }

            return result;
        };


        /** Compute the Householder transformation that will zero all but the
         *  first element of this vector.  The transformation itself is a
         *  reflection across a hyperplane that passes through the origin;
         *  thus this reflection can be represented by an orthogonal
         *  matrix P which applies the transform or by a vector v that is
         *  normal to the hyperplane.  This function returns a vector v,
         *  a matrix P, and a scalar beta such that v[0] = 1,
         *  P = I - beta v v^t, and P.dot(this) has zeros everywhere except
         *  for the first element.  This transformation is usually used as a
         *  building block for other transforms and decompositions.
         *
         *  Based on algorithm 5.1.1 in
         *  Golub GH, Van Loan CF. Matrix Computations. 3rd ed. The Johns
         *  Hopkins University Press; 1996.
         *
         *  @returns an object with the members v (Householder vector),
         *      P (Householder matrix), and beta
         */
        AbstractNDArray.prototype.householderTransform = function () {
            var v = this.copy(), x0 = this.val([0]), norm2, offNorm2, beta, norm, P;

            norm2 = v.dot(v).val();  // the square of the Euclidean norm

            if (norm2 > 1e200) {
                // For large magnitude vectors, first normalize x to avoid
                // problems with overflows when squaring these values.
                return this.div(this.norm()).householderTransform();
            }
            // magnitude squared of components other than the first
            offNorm2 = norm2 - x0 * x0;

            if (offNorm2 === 0) {
                // x is already of the form [x0 0 0 ... 0]
                if (x0 < 0) {
                    // note: Golub and Van Loan have zero here, but that makes
                    // the first term of P x negative.
                    beta = 2;
                } else {
                    beta = 0;
                }
                v.setElement([0], 1);
            } else {
                norm = Math.sqrt(norm2);

                if (x0 <= 0) {
                    v.setElement([0], x0 - norm);
                } else {
                    v.setElement([0], -offNorm2 / (x0 + norm));
                }

                beta = 2 * v.val([0]) * v.val([0]) / (offNorm2 + v.val([0]) * v.val([0]));
                v.divHere(v.val([0]));
            }

            P = jsnum.eye(this.shape[0]).sub(v.at([undefined, "1"]).
                dot(v.at(["1", undefined])).mul(beta));

            return { beta : beta, v : v, P : P };
        };


        /** Compute the Givens matrix that will zero the second element of
         *  a vector.  The resulting transform is a rotation, represented
         *  by a rotation matrix G.  This transformation is usually used as a
         *  building block for other transforms and decompositions.
         *
         *  Based on algorithm 1 in:
         *  Anderson, E, Discontinuous Plane Rotations and the Symmetric
         *  Eigenvalue Problem. LAPACK Working Note 150, University of
         *  Tennessee, UT-CS-00-454, December 4, 2000.
         *
         *  @returns a rotation matrix
         */
        AbstractNDArray.prototype.givensRotation = function () {
            var f, g, t, u, c, s, result;

            if (this.shape.length !== 1 || this.shape[0] !== 2) {
                throw new TypeError("Only vectors of length 2 are supported");
            }

            f = this.val([0]);
            g = this.val([1]);
            t = f / g;
            if (g === 0 || Math.abs(t) > 1e100) {
                // rotate 0 or 180°
                c = (f >= 0) ? 1 : -1;
                s = 0;
            } else if (f === 0 || Math.abs(t) < 1e-100) {
                // rotate ±90°
                c = 0;
                s = (g >= 0) ? 1 : -1;
            } else if (Math.abs(f) > Math.abs(g)) {
                u = Math.sqrt(1 + t * t) * (g >= 0 ? 1 : -1);
                s = 1 / u;
                c = s * t;
            } else {
                u = Math.sqrt(1 + 1 / (t * t)) * (f >= 0 ? 1 : -1);
                c = 1 / u;
                s = c / t;
            }

            result = this.createResult([2, 2]);
            result.setElement([0, 0], c);
            result.setElement([0, 1], s);
            result.setElement([1, 0], -s);
            result.setElement([1, 1], c);

            return result;
        };


        /** Compute a decomposition of this matrix into the form A = U B V,
         *  where A is this matrix, U and V are orthogonal matrices, and B is
         *  an upper bidiagonal matrix (i.e. is zero everywhere except for the
         *  diagonal and the elements directly above it).  This is used as part
         *  of computing the singular value decomposition but rarely used
         *  directly.
         *
         *  Based on algorithm 5.4.2 (Householder bidiagonalization) in
         *  Golub GH, Van Loan CF. Matrix Computations. 3rd ed. The Johns
         *  Hopkins University Press; 1996.
         *
         *  @returns an object with the members U, B, and V
         */
        AbstractNDArray.prototype.bidiagonalization = function () {
            var U, V, B, i, m = this.shape[0], n = this.shape[1], house,
                min = Math.min(m, n);

            if (this.shape.length !== 2) {
                throw new TypeError("Value is not a matrix:\n" + this);
            }

            U = jsnum.eye(m).copy();
            V = jsnum.eye(n).copy();
            B = this.copy();

            for (i = 0; i < min; i += 1) {
                // cancel out a column below the diagonal
                if (i < m - 1) {
                    house = B.at([[i], i]).householderTransform();
                    U.at([undefined, [i]]).set(U.
                        at([undefined, [i]]).dot(house.P));
                    B.at([[i], [i]]).set(house.P.dot(B.at([[i], [i]])));
                    B.at([[i + 1], i]).set(0);
                }
                if (i + 1 < n - 1) {
                    // cancel out a row to the right of the diagonal
                    house = B.at([i, [i + 1]]).householderTransform();
                    V.at([[i + 1]]).set(house.P.dot(V.at([[i + 1]])));
                    B.at([undefined, [i + 1]]).set(B.
                        at([undefined, [i + 1]]).dot(house.P));
                    B.at([i, [i + 2]]).set(0);
                }
            }

            return { U : U, B : B, V : V };
        };


        /** Compute a decomposition of this matrix into the form A = U D V,
         *  where A is this matrix, U and V are orthogonal matrices, and D is
         *  a diagonal matrix (i.e. is zero everywhere except for the
         *  diagonal).
         *
         *  Based on algorithms 8.6.1 and 8.62 in
         *  Golub GH, Van Loan CF. Matrix Computations. 3rd ed. The Johns
         *  Hopkins University Press; 1996.
         *
         *  @returns an object with the members U, B, V, and decompositionType
         *  (set to "Singular Value").
         */
        AbstractNDArray.prototype.singularValueDecomposition = function () {
            var U, V, B, i, m = this.shape[0], n = this.shape[1], bidiag, svdT,
                tiny = 5 * jsnum.eps, p, q,
                d0, dm, dn, f1, fm, fn, scale,
                tmm, tmn, tnn, tdet, ttrace, mu,
                k, j, r, G, fixingDiagonal,
                result, sortedOrder;

            if (this.shape.length !== 2) {
                throw new TypeError("Value is not a matrix:\n" + this);
            } else if (m < n) {
                // rather than tweak the algorithm below to handle the more
                // columns than rows case, we can just compute the
                // svd of the transpose and then transpose the result.
                svdT = this.transpose().singularValueDecomposition();
                return { U : svdT.V.transpose(), D: svdT.D.transpose(),
                    V: svdT.U.transpose(), decompositionType: "Singular Value" };
            }
            bidiag = this.bidiagonalization();

            U = bidiag.U.copy();
            V = bidiag.V.copy();
            B = bidiag.B;
            r = this.createResult([2]);

            while (true) {
                // zero the near-zero off diagonal elements
                for (i = 0; i < n - 1; i += 1) {
                    if (Math.abs(B.val([i, i + 1])) <= tiny *
                            (Math.abs(B.val([i, i])) +
                            Math.abs(B.val([i + 1, i + 1])))) {
                        B.at([i, i + 1]).set(0);
                    }
                }

                // set q to the index of the upper left element of the
                // largest diagonal matrix in the lower right part of B
                q = n;
                while (q > 1 && 0 === B.val([q - 2, q - 1])) {
                    q -= 1;
                }
                if (q <= 1) {
                    break; // B is now diagonal, so we're done.
                }

                // set p to be the index of the upper left element of the
                // lower-right most submatrix with all non-zero supradiagonal
                // elements.
                p = q - 1;
                while (p > 0 && 0 !== B.val([p - 1, p])) {
                    p -= 1;
                }

                // if a diagonal element in B[p:q, p:q] is zero, zero the
                // corresponding supradiagonal element using a Givens
                // rotation.  (Note: Golub and Van Loan simply say
                // to zero the element but don't describe how; this seems
                // to work in my testing.)
                fixingDiagonal = false;
                for (i = p; i < q - 1; i += 1) {
                    if (B.val([i, i]) === 0) {
                        fixingDiagonal = true;
                        k = i;
                        r.setElement([0], 0);
                        r.setElement([1], 1);
                        break;
                    }
                }

                if (!fixingDiagonal) {
                    // find the eigenvalue of the lower right 2x2 matrix of
                    // B∙B^t that it closest to its lowest right value.
                    d0 = B.val([p, p]); dm = B.val([q - 2, q - 2]);
                    dn = B.val([q - 1, q - 1]);
                    f1 = B.val([p, p + 1]); fm = (q > 2 ? B.val([q - 3, q - 2]) : 0);
                    fn = B.val([q - 2, q - 1]);
                    // rescale things to avoid overflows when squaring values
                    scale = Math.max(Math.abs(d0), Math.abs(f1), Math.abs(dm),
                            Math.abs(dn), Math.abs(fm), Math.abs(fn));
                    d0 /= scale; dm /= scale; dn /= scale;
                    f1 /= scale; fm /= scale; fn /= scale;
                    tmm = dm * dm + fm * fm;
                    tmn = dm * fn;
                    tnn = dn * dn + fn * fn;
                    tdet = tmm * tnn - tmn * tmn;
                    ttrace = tmm + tnn;
                    if (ttrace / 2 > tnn) {
                        mu = (ttrace - Math.sqrt(ttrace * ttrace - 4 * tdet)) / 2;
                    } else {
                        mu = (ttrace + Math.sqrt(ttrace * ttrace - 4 * tdet)) / 2;
                    }

                    k = p;
                    r.setElement([0], d0 * d0 - mu);
                    r.setElement([1], d0 * f1);
                }

                // propagate the Givens rotations down the columns
                for (k; k < q - 1; k += 1) {

                    j = Math.max(0, k - 1);
                    G = r.givensRotation();
                    V.at([[k, k + 2]]).set(G.dot(V.at([[k, k + 2]])));
                    B.at([[j, k + 2], [k, k + 2]]).set(B.
                        at([[j, k + 2], [k, k + 2]]).dot(G.transpose()));
                    r.setElement([0], B.val([k, k]));
                    r.setElement([1], B.val([k + 1, k]));

                    j = Math.min(q, k + 3);
                    G = r.givensRotation();
                    U.at([undefined, [k, k + 2]]).set(U.
                            at([undefined, [k, k + 2]]).dot(G.transpose()));
                    B.at([[k, k + 2], [k, j]]).set(G.dot(B.
                        at([[k, k + 2], [k, j]])));
                    if (k + 2 < q) {
                        r.setElement([0], B.val([k, k + 1]));
                        r.setElement([1], B.val([k, k + 2]));
                    }
                }
            }

            // sort the singular values by size
            sortedOrder = [];
            for (i = 0; i < n; i += 1) {
                sortedOrder[i] = i;
            }
            sortedOrder.sort(function (a, b) {
                var valA = B.val([a, a]),
                    valB = B.val([b, b]);
                return (valA < valB) ? 1 : ((valA > valB) ? -1 : 0);
            });
            result = {
                U : this.createResult(U.shape),
                D : this.createResult(B.shape),
                V : this.createResult(V.shape),
                decompositionType : "Singular Value"
            };
            result.D.set(0);
            for (i = 0; i < n; i += 1) {
                result.U.at([undefined, i]).
                    set(U.at([undefined, sortedOrder[i]]));
                result.D.at([i, i]).
                    set(B.at([sortedOrder[i], sortedOrder[i]]));
                result.V.at([i]).
                    set(V.at([sortedOrder[i]]));
            }
            for (i; i < m; i += 1) {
                // copy remaining columns of U
                // (representing space outside of the range of the matrix)
                result.U.at([undefined, i]).set(U.at([undefined, i]));
            }

            return result;
        };


        /**
         * Compute the condition number of this matrix (i.e. the largest
         * singular value divided by the smallest).  This is a measure of how
         * well behaved this matrix is likely to be in numerical computations,
         * with larger condition numbers being given to matrices that are "more
         * singular" and likely to behave poorly.
         *
         *  See pp 67-69 in Press WH, Teukolsky SA, Vetterling WT, Flannery BP.
         *  Numerical Recipes 3rd Edition: The Art of Scientific Computing.
         *  3rd ed. Cambridge University Press; 2007.
         *
         * @returns the condition number
         */
        AbstractNDArray.prototype.conditionNumber = function () {
            var svd, n;

            svd = this.singularValueDecomposition();
            n = Math.min(this.shape[0], this.shape[1]);

            return svd.D.val([0, 0]) / svd.D.val([n - 1, n - 1]);
        };


        /**
         * Compute the rank of this matrix (i.e. the number of linearly
         * independent rows, which is also the dimension of the range).
         *
         *  See pp 67-69 in Press WH, Teukolsky SA, Vetterling WT, Flannery BP.
         *  Numerical Recipes 3rd Edition: The Art of Scientific Computing.
         *  3rd ed. Cambridge University Press; 2007.
         *
         * @returns the rank (a non-negative integer)
         */
        AbstractNDArray.prototype.rank = function () {
            var svd, rank, threshold, n;

            svd = this.singularValueDecomposition();
            n = Math.min(this.shape[0], this.shape[1]);
            threshold = 0.5 * Math.sqrt(this.shape[0] + this.shape[1] + 1) *
                svd.D.val([0, 0]) * jsnum.eps;
            rank = 0;
            while (rank < n && Math.abs(svd.D.val([rank, rank])) > threshold) {
                rank += 1;
            }

            return rank;
        };


        /**
         * Compute the nullity of this matrix (i.e. the number of dimensions of
         * its nullspace).
         *
         *  See pp 67-69 in Press WH, Teukolsky SA, Vetterling WT, Flannery BP.
         *  Numerical Recipes 3rd Edition: The Art of Scientific Computing.
         *  3rd ed. Cambridge University Press; 2007.
         *
         * @returns the nullity (a non-negative integer)
         */
        AbstractNDArray.prototype.nullity = function () {

            return this.shape[0] - this.rank();
        };


        /**
         * Compute the range of this matrix.  The range is the space of
         * possible results when multiplying this by a vector, that is
         * all vectors b where there exists x such that b = A x.
         *
         *  See pp 67-69 in Press WH, Teukolsky SA, Vetterling WT, Flannery BP.
         *  Numerical Recipes 3rd Edition: The Art of Scientific Computing.
         *  3rd ed. Cambridge University Press; 2007.
         *
         * @returns A matrix whose rows form an orthogonal basis set for the
         * range, or null if the matrix has no range
         */
        AbstractNDArray.prototype.range = function () {
            var svd, rank, threshold, n;

            svd = this.singularValueDecomposition();
            n = Math.min(this.shape[0], this.shape[1]);
            threshold = 0.5 * Math.sqrt(this.shape[0] + this.shape[1] + 1) *
                svd.D.val([0, 0]) * jsnum.eps;
            rank = 0;
            while (rank < n && Math.abs(svd.D.val([rank, rank])) > threshold) {
                rank += 1;
            }

            if (rank === 0) {
                return null;
            } else {
                return svd.U.transpose().at([[0, rank]]);
            }
        };


        /**
         * Compute the nullspace of this matrix.  The nullspace is the space
         * spanned by input vectors that this matrix will map to the null
         * null vector, i.e. all vectors x where A x = 0.
         *
         *  See pp 67-69 in Press WH, Teukolsky SA, Vetterling WT, Flannery BP.
         *  Numerical Recipes 3rd Edition: The Art of Scientific Computing.
         *  3rd ed. Cambridge University Press; 2007.
         *
         * @returns A matrix whose rows form an orthogonal basis set for the
         * nullspace, or null if the matrix has no nullspace
         */
        AbstractNDArray.prototype.nullspace = function () {
            var svd, rank, threshold, n;

            svd = this.singularValueDecomposition();
            n = Math.min(this.shape[0], this.shape[1]);
            threshold = 0.5 * Math.sqrt(this.shape[0] + this.shape[1] + 1) *
                svd.D.val([0, 0]) * jsnum.eps;
            rank = 0;
            while (rank < n && Math.abs(svd.D.val([rank, rank])) > threshold) {
                rank += 1;
            }

            if (rank === svd.V.shape[0]) {
                return null;
            } else {
                return svd.V.at([[rank]]);
            }
        };


        /** Get the transpose of this array.  For a 0 or 1 dimensional
         *  array, this is just the array itself.  For a 2 dimensional array
         *  or higher, the order of the indexing of the dimensions is
         *  reversed.  Note that for a matrix, this is the same as the
         *  matrix transpose.  The transpose is a new view of the original
         *  array, i.e. calling setElement will change the corresponding
         *  element in the original array.
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


        /** Gets a particular element from the array.  This is similar to
         *  getElement, but provides better error checking and support for
         *  negative indexes.
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
                            String(array.val()).length);
                } else {
                    result = minFieldWidth;

                    for (i = 0; i < array.shape[0]; i += 1) {
                        result = getMaxFieldWidth(array.at([i]), result);
                    }

                    return result;
                }
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
            if (vals.val !== undefined) {
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
                        copyVals(o.at([i]), vals[i]);
                    }
                }
            }

            o = new jsnum.UntypedNDArray(shape);
            copyVals(o, vals);

            return o;
        }


        /** Checks if two numbers or NDArrays are sufficiently "close".
         *  This is true iff the numbers (or corresponding array elements)
         *  are within abstol of each other or if the ratio of the numbers is
         *  within reltol of 1.
         *  @param {Number | NDArray} val1 the first number to compare
         *  @param {Number | NDArray} val2 the second number to compare
         *  @param {Number} abstol the absolute tolerance
         *  @param {Number} reltol the relative tolerance
         *  @result true iff the numbers are close, otherwise false
         */
        function areClose(val1, val2, abstol, reltol) {
            var close = true, i;

            if (abstol < 0 || reltol < 0) {
                throw new RangeError("Tolerances must be non-negative");
            }

            // defaults (note that we can't just use reltol || ... because 0
            // is a valid tolerance and not equal to the default)
            if (reltol === undefined) {
                reltol = 1e-9;
            }
            if (abstol === undefined) {
                abstol = 1e-9;
            }

            // if these are NDArrays, do an element-wise compare
            if (val1.walkIndexes && val2.walkIndexes) {

                if (val1.shape.length !== val2.shape.length) {
                    throw new RangeError("Array shapes must match");
                }
                for (i = val1.shape.length - 1; i >= 0; i -= 1) {
                    if (val1.shape[i] !== val2.shape[i]) {
                        throw new RangeError("Array shapes must match");
                    }
                }

                val1.walkIndexes(function (index) {
                    if (!areClose(val1.val(index),
                            val2.val(index), abstol, reltol)) {
                        close = false;
                    }
                });

                return close;
            } else if (typeof val1 === "number" && typeof val2 === "number") {
                return (Math.abs(val1 - val2) <= abstol) ||
                    (Math.abs(val1 - val2) / Math.max(Math.abs(val1), Math.abs(val2)) <= reltol);
            } else {
                throw new TypeError("arguments must both be numbers or both be NDArrays");
            }
        }


        /** Create an N × N identity matrix.
         *
         *  @param {Number} N the rank (size) of the identity matrix to create
         *  @result an N × N identity matrix.
         */
        function eye(N) {
            var I = Object.create(AbstractNDArray.prototype);
            Object.defineProperty(I, "shape",
                { value : [N, N], writable : false });
            I.getElement = function (index) {
                return index[0] === index[1] ? 1 : 0;
            };

            return I;
        }


        /** Solve a linear system of the form A x = b.  Most of the work is
         *  goes into doing the LU decomposition of A, so if you are solving
         *  the same equation with different right hand sides you may want to
         *  compute the LU decomposition once and pass it in directly.
         *
         *  See pp 48-54 in Press WH, Teukolsky SA, Vetterling WT, Flannery BP.
         *  Numerical Recipes 3rd Edition: The Art of Scientific Computing.
         *  3rd ed. Cambridge University Press; 2007.
         *
         *  @param {NDArray | LU decomposition} A the matrix on the left or
         *      its LU Decomposition.
         *  @param {NDArray} b the result vector (or matrix)
         *  @result a vector (or matrix) x such that A x = b
         */
        function solveLinearSystem(A, b) {
            var lu, N, x, y, i, j, swap, sum, selector;

            if (A.decompositionType === "LU") {
                lu = A;
            } else {
                if (A.shape === undefined) {
                    throw new TypeError(
                        "A must be an NDArray or LU Decomposition"
                    );
                }

                lu = A.LUDecomposition();
            }

            if (b.shape === undefined) {
                throw new TypeError("b must be an NDArray");
            }

            N = b.shape[0];
            x = b.createResult(b.shape);

            if (lu.L.shape[0] !== N) {
                throw new RangeError("The length of the first dimension of A (" +
                    lu.L.shape[0] + ") does not match that of b (" + N + ")");
            }

            if (b.shape.length > 1) {
                // b is a matrix, so solve for each of the columns individually
                b.at([0]).walkIndexes(function (index) {
                    var i, colX, fullIndex = index.slice(0);
                    fullIndex.unshift(undefined);

                    // solve the system and copy the result into the column
                    colX = solveLinearSystem(lu, b.at(fullIndex));
                    for (i = 0; i < N; i += 1) {
                        fullIndex[0] = i;
                        x.setElement(fullIndex, colX.val([i]));
                    }
                });

            } else { // b is a vector

                // swap the rows in the answer to match L and U
                b = b.copy();
                for (i = 0; i < N; i += 1) {
                    if (lu.p[i] !== i) {
                        swap = b.val([i]);
                        b.setElement([i], b.val([lu.p[i]]));
                        b.setElement([lu.p[i]], swap);
                    }
                }

                // use forward substitution to find y such that L y
                y = b.createResult(b.shape);
                for (i = 0; i < N; i += 1) {
                    sum = 0;
                    for (j = 0; j < i; j += 1) {
                        sum += lu.L.val([i, j]) * y.val([j]);
                    }

                    y.setElement([i], (b.val([i]) - sum) / lu.L.val([i, i]));
                }

                // use backward substitution to find x such that U x = y
                for (i = N - 1; i >= 0; i -= 1) {
                    sum = 0;
                    for (j = i + 1; j < N; j += 1) {
                        sum += lu.U.val([i, j]) * x.val([j]);
                    }

                    x.setElement([i], (y.val([i]) - sum) / lu.U.val([i, i]));
                }
            }

            return x;
        }

        /*jslint vars: true */

        /** Machine epsilon.
         *  The value 1 + eps is the smallest number greater than one that can
         *  be represented with JavaScript's floating point arithmetic.  This
         *  gives the limit of roundoff error for computations; for example
         *  1 + eps/2 will be rounded down to 1.
         */
        var eps = Math.pow(2, -52);

        /*jslint vars: false */

        jsnum.eps = eps;
        jsnum.eye = eye;
        jsnum.solveLinearSystem = solveLinearSystem;
        jsnum.asNDArray = asNDArray;
        jsnum.areClose = areClose;
        jsnum.AbstractNDArray = AbstractNDArray;
        jsnum.UntypedNDArray = UntypedNDArray;

        return jsnum;
    }
);
