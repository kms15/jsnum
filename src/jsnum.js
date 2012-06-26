/*global define */

/* @overview This file declares the main components of the JSN module
 *  @copyright (c) 2012 Kendrick Shaw
 */

define(
    ["src/jsnum-base", "src/AbstractNDArray", "src/linalg"],
    /* central module for the JSN library
     *  @exports jsnum
     */
    function (jsnum) {
        "use strict";


        /** jsnum.NumericalError(message)
         * An exception for numerical errors.
         *  This exception is thrown when a numerical problem occurs, such as a
         *  singular matrix or an algorithm that fails to converge.
         *  @constructor
         *  @param message information about the cause of the error
         */
        jsnum.NumericalError = function (message) {
            this.name = "NumericalError";
            this.message = message || "A numerical error occured";
        };
        jsnum.NumericalError.prototype = new Error();


        /** jsnum.UntypedNDArray(shape)
         * An implementation of an NDArray that stores data with any type.
         * This is likely to work for most uses, but more specialized types of
         * NDArray are likely to have better performance and memory usage.
         * @param { Array<int> } shape The length of each of the dimensions of
         *      the new array.
         * @constructor
         */
        jsnum.UntypedNDArray = function (shape) {
            var i,
                size = 1,
                data = [],
                that = this,
                myShape = shape.slice(0);

            jsnum.AbstractNDArray.checkShape(shape);

            // if called without new, create a new object
            if (!(this instanceof jsnum.UntypedNDArray)) {
                return new jsnum.UntypedNDArray(myShape);
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
                }

                index1D = indexes[0];

                for (i = 1; i < myShape.length; i += 1) {
                    index1D = index1D * myShape[i] + indexes[i];
                }

                return index1D;
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
        };
        jsnum.UntypedNDArray.prototype = Object.create(jsnum.AbstractNDArray.prototype);


        /** jsnum.asNDArray(vals)
         * Create an ND array from the given nested Array.
         * This allows easy conversion from JavaScript arrays to n-dimensional
         * arrays.  Note that this function can not create an array containing
         * elements that are themselves arrays (the syntax would be ambiguous).
         * @param vals A single (non-array) value or nested arrays describing
         *     an n-dimensional array.
         * @returns An writable n-dimensional array containing a copy of the
         *     data in vals.
         */
        jsnum.asNDArray = function (vals) {
            var o = Object.create(jsnum.AbstractNDArray.prototype), val, shape;

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
        };


        /** jsnum.areClose(val1, val2, abstol, reltol)
         *  Checks if two numbers or NDArrays are sufficiently "close".
         *  This is true iff the numbers (or corresponding array elements)
         *  are within abstol of each other or if the ratio of the numbers is
         *  within reltol of 1.
         *  @param {Number | NDArray} val1 the first number to compare
         *  @param {Number | NDArray} val2 the second number to compare
         *  @param {Number} abstol the absolute tolerance
         *  @param {Number} reltol the relative tolerance
         *  @result true iff the numbers are close, otherwise false
         */
        jsnum.areClose = function (val1, val2, abstol, reltol) {
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
                    if (!jsnum.areClose(val1.val(index),
                            val2.val(index), abstol, reltol)) {
                        close = false;
                    }
                });

                return close;
            }

            if (typeof val1 === "number" && typeof val2 === "number") {
                return (Math.abs(val1 - val2) <= abstol) ||
                    (Math.abs(val1 - val2) / Math.max(Math.abs(val1), Math.abs(val2)) <= reltol);
            }

            throw new TypeError("arguments must both be numbers or both be NDArrays");
        };


        /** jsnum.eye(N)
         *  Create an `N xx N` identity matrix.
         *
         *  @param {Number} N the rank (size) of the identity matrix to create
         *  @result an `N xx N` identity matrix.
         */
        jsnum.eye = function (N) {
            var I = Object.create(jsnum.AbstractNDArray.prototype);
            Object.defineProperty(I, "shape",
                { value : [N, N], writable : false });
            I.getElement = function (index) {
                return index[0] === index[1] ? 1 : 0;
            };

            return I;
        };


        /** jsnum.solveLinearSystem(A, b, options)
         *  Solve a linear system of the form `A x = b`.
         *  By default this tries to find the exact solution for x using
         *  `LU`-decomposition and will throw an error if an exact solution can not
         *  be found (for example if A is singular or non-square).  If the
         *  "returnClosest" option is set to true, this routine instead finds
         *  the solution x which minimizes the error `||A x - b||_2` by using
         *  singular value decomposition (which works for singular or
         *  non-square matrices).
         *
         *  See pp 48-54, 69-73 in Press WH, Teukolsky SA, Vetterling WT,
         *  Flannery BP.  Numerical Recipes 3rd Edition: The Art of Scientific
         *  Computing.  3rd ed. Cambridge University Press; 2007.
         *
         *  @param {NDArray} A the matrix that is multiplied by the
         *      unknown vector or matrix.
         *  @param {NDArray} b the result vector (or matrix)
         *  @param {Object} options additional options, such as returnClosest
         *  @result a vector (or matrix) x such that `A x = b`
         */
        jsnum.solveLinearSystem = function (A, b, options) {
            var lu;

            // argument checking
            if (A.shape === undefined || A.shape.length !== 2) {
                console.log(A.toString());
                throw new TypeError(
                    "A must be a matrix (i.e. a 2D NDArray)"
                );
            }

            if (b.shape === undefined) {
                throw new TypeError("b must be an NDArray");
            }

            if (A.shape[0] !== b.shape[0]) {
                throw new RangeError("The number of rows of A (" +
                    A.shape[0] + ") does not match the number of rows of b (" +
                    b.shape[0] + ")");
            }

            if (options && options.returnClosest) {
                return A.pseudoinverse().dot(b);
            }

            if (A.shape[0] > A.shape[1]) {
                throw new TypeError("The system is overdetermined " +
                    "(the matrix has more rows than columns); consider " +
                    "adding the option \"returnClosest : true\".");
            }

            if (A.shape[0] < A.shape[1]) {
                throw new TypeError("The system is underdetermined " +
                    "(the matrix has fewer rows than columns); consider " +
                    "adding the option \"returnClosest : true\".");
            }

            try {
                lu = A.LUDecomposition();
            } catch (e) {
                if (e instanceof jsnum.NumericalError) {
                    throw new jsnum.NumericalError("Singular matrix " +
                        "encountered; consider adding the option " +
                        "\"returnClosest : true\".");
                } else {
                    throw e;
                }
            }

            function luSolve(lu, b) {
                var N, x, y, i, j, swap, sum;
                N = b.shape[0];
                x = b.createResult(b.shape);

                if (b.shape.length > 1) {
                    // b is a matrix, so solve for each of the columns individually
                    b.at([0]).walkIndexes(function (index) {
                        var i, colX, fullIndex = index.slice(0);
                        fullIndex.unshift(undefined);

                        // solve the system and copy the result into the column
                        colX = luSolve(lu, b.at(fullIndex));
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

            return luSolve(lu, b);
        };


        /*jslint vars: true */

        /** jsnum.eps
         *  Machine epsilon.
         *  The value 1 + eps is the smallest number greater than one that can
         *  be represented with JavaScript's floating point arithmetic.  This
         *  gives the limit of roundoff error for computations; for example
         *  1 + eps/2 will be rounded down to 1.
         */
        jsnum.eps = Math.pow(2, -52);

        /*jslint vars: false */

        return jsnum;
    }
);
