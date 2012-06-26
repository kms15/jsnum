/*global define */

/*  This file adds several methods to AbstractNDArray to support
 *  numerical linear algebraic computations.
 *  @copyright (c) 2012 Kendrick Shaw
 */

define(
    ["src/jsnum-base", "src/AbstractNDArray"],
    function (jsnum, AbstractNDArray) {
        "use strict";

        /** jsnum.AbstractNDArray.norm()
         *  Calculate the `L_2` norm of the array.
         *  This is the square root of the sum of the squares of all of the
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


        /** jsnum.AbstractNDArray.isOrthogonal()
         *  Returns true iff this is an orthogonal matrix.
         *  This is true iff the rows (and columns) are orthogonal unit
         *  vectors, and implies that the transpose of the matrix is equal to
         *  its inverse.
         */
        AbstractNDArray.prototype.isOrthogonal = function () {
            if (this.shape.length !== 2 || this.shape[0] !== this.shape[1]) {
                return false;
            }
            return jsnum.areClose(this.dot(this.transpose()), jsnum.eye(this.shape[0]));
        };


        /** jsnum.AbstractNDArray.dot(B)
         *  Perform a matrix product with another array.
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


        /** jsnum.AbstractNDArray.LUDecomposition()
         *  Decomposes this matrix into three matrices, `P`, `L` and `U`.
         *  Here is a row permutation matrix, `L` (lower) has no elements
         *  above the diagonal, `U` (upper) has no elements below the
         *  diagonal, and `P` `L` `U` = `A` where `A` is this matrix.
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

                if (pivotVal === 0) {
                    // Press et al say that this is a good idea for some
                    // singular matrices; we'll trust them once we've seen this.
                    // scratch.setElement([k, k], 1e-40); // a very small non-zero number
                    throw new jsnum.NumericalError("Singular or near-singular " +
                            "matrix encountered; consider using singular " +
                            "value decomposition");
                }

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


        /** jsnum.AbstractNDArray.inverse()
         *  Find the inverse of this matrix.
         *  If this is an `N xx N` square non-singular matrix this function finds
         *  the inverse of the matrix, using jsnum.linSolve (which uses
         *  `LU`-decomposition).  For non-square or singular matrices, see
         *  pseudoinverse.
         *  @returns The inverse of this matrix.
         */
        AbstractNDArray.prototype.inverse = function () {
            if (this.shape.length !== 2) {
                throw new TypeError("Only matrices support inverse");
            }

            if (this.shape[0] !== this.shape[1]) {
                throw new TypeError("Only square matricies have an inverse; " +
                    "consider using pseudoinverse instead.");
            }

            try {
                return jsnum.solveLinearSystem(this, jsnum.eye(this.shape[0]));
            } catch (e) {
                if (e instanceof jsnum.NumericalError) {
                    throw new jsnum.NumericalError("Singular matrix encountered; "
                        + "consider using pseudoinverse function");
                } else {
                    throw e;
                }
            }
        };


        /** jsnum.AbstractNDArray.pseudoinverse(options)
         *  Find the pseudoinverse of this matrix.
         *  This is identical to the inverse if it exists
         *  (in which case the inverse function is likely to be faster).
         *  It can be also used in cases where the inverse does not exist,
         *  however, such as singular matrices and rectangular matrices.
         *  In these cases this will be a matrix that is in some sense as
         *  "close" as possible to being an inverse (e.g. minimizing the
         *  error when solving a linear system).  The pseudoinverse is
         *  found using singular value decomposition.
         *  @returns The pseudoinverse of this matrix.
         */
        AbstractNDArray.prototype.pseudoinverse = function (options) {
            var svd, small, Dinv, val, i;

            svd = this.singularValueDecomposition();

            // estimate of threshold for small singular values from Press et al.
            small = 0.5 * Math.sqrt(this.shape[0] + this.shape[1] + 1) *
                svd.D.val([0, 0]) * jsnum.eps;

            Dinv = svd.D.transpose().copy();

            for (i = Math.min(this.shape[0], this.shape[1]) - 1; i >= 0;
                    i -= 1) {
                val = svd.D.val([i, i]);
                if (val < small) {
                    Dinv.at([i, i]).set(0); // part of the nullspace
                } else {
                    Dinv.at([i, i]).set(1 / val);
                }
            }

            return svd.V.transpose().dot(Dinv.dot(svd.U.transpose()));
        };


        /** jsnum.AbstractNDArray.det()
         *  Find the determinant of this matrix.
         *  If this is an `N xx N` square matrix this function finds the
         *  determinant of the matrix, using jsnum.linSolve (which uses
         *  `LU`-decomposition).  @returns The determinant of this matrix.
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


        /** jsnum.AbstractNDArray.householderTransform()
         *  Compute the Householder transformation of this vector.
         *  This is a reflection across a hyperplane that will zero all but the
         *  first element of this vector.  The transformation itself is a
         *  reflection across a hyperplane that passes through the origin; thus
         *  this reflection can be represented by an orthogonal matrix `P` which
         *  applies the transform or by a vector `v` that is normal to the
         *  hyperplane.  This function returns a vector v, a matrix P, and a
         *  scalar beta such that `v_0 = 1`, `P = I - beta v v^t`, and `P * this`
         *  has zeros everywhere except for the first element.  This
         *  transformation is usually used as a building block for other
         *  transforms and decompositions.
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


        /** jsnum.AbstractNDArray.givensRotation()
         *  Compute the Givens matrix of this vector.
         *  This is a rotation matrix `G` that will zero the second element of
         *  a vector.  This transformation is usually used as a
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


        /** jsnum.AbstractNDArray.bidiagonalization()
         *  Compute a decomposition of this matrix into the form `A = U B V`.
         *  Here `A` is this matrix, `U` and `V` are orthogonal matrices, and `B` is
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


        /** jsnum.AbstractNDArray.singularValueDecomposition()
         *  Compute a decomposition of this matrix into the form `A = U D V`.
         *  Here `A` is this matrix, `U` and `V` are orthogonal matrices, and `D` is
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
                    d0 = B.val([p, p]);
                    dm = B.val([q - 2, q - 2]);
                    dn = B.val([q - 1, q - 1]);
                    f1 = B.val([p, p + 1]);
                    fm = (q > 2 ? B.val([q - 3, q - 2]) : 0);
                    fn = B.val([q - 2, q - 1]);
                    // rescale things to avoid overflows when squaring values
                    scale = Math.max(Math.abs(d0), Math.abs(f1), Math.abs(dm),
                            Math.abs(dn), Math.abs(fm), Math.abs(fn));
                    d0 /= scale;
                    dm /= scale;
                    dn /= scale;
                    f1 /= scale;
                    fm /= scale;
                    fn /= scale;
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


        /** jsnum.AbstractNDArray.conditionNumber()
         * Compute the condition number of this matrix.
         * The condition number is equal to the largest
         * singular value divided by the smallest.  This is a measure of how
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


        /** jsnum.AbstractNDArray.rank()
         * Compute the rank of this matrix.
         * The rank is the number of linearly independent rows, which is also
         * the dimension of the range.
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


        /** jsnum.AbstractNDArray.nullity()
         * Compute the nullity of this matrix.
         * The nullity is the number of dimensions in the matrix's nullspace.
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


        /** jsnum.AbstractNDArray.range()
         *  Compute the range of this matrix.
         *  The range is the space of
         *  possible results when multiplying this by a vector, that is
         *  all vectors `b` where there exists `x` such that `b = A x`.
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
            }

            return svd.U.transpose().at([[0, rank]]);
        };


        /**  jsnum.AbstractNDArray.nullspace()
         *  Compute the nullspace of this matrix.
         *
         *  The nullspace is the space spanned by input vectors that this matrix
         *  will map to the null null vector, i.e. all vectors `x` where `A x = 0`.
         *
         *  See pp 67-69 in Press WH, Teukolsky SA, Vetterling WT, Flannery BP.
         *  Numerical Recipes 3rd Edition: The Art of Scientific Computing.
         *  3rd ed. Cambridge University Press; 2007.
         *
         *  @returns A matrix whose rows form an orthogonal basis set for the
         *  nullspace, or null if the matrix has no nullspace
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
            }

            return svd.V.at([[rank]]);
        };
    }
);


