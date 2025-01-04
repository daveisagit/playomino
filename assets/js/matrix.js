export function are_parallel(u, v) {
    var cu = Array.from(u);
    var cv = Array.from(v);
    return matrix_rank([cu, cv]) <= 1;
}

function matrix_rank(matrix) {

    // Get the number of rows and columns in the matrix
    const num_rows = matrix.length;
    const num_cols = matrix.length > 0 ? matrix[0].length : 0;
    let rank = 0;

    for (let i = 0; i < num_rows; i++) {
        let pivot_found = false;

        // Iterate over each column of the matrix
        for (let j = 0; j < num_cols; j++) {
            if (matrix[i][j] !== 0) {
                pivot_found = true;
                rank++; // Increment rank
                for (let k = 0; k < num_rows; k++) {
                    if (k !== i) {
                        const ratio =
                            matrix[k][j] / matrix[i][j];
                        for (let l = 0; l < num_cols; l++) {
                            matrix[k][l] -= ratio * matrix[i][l];
                        }
                    }
                }
                break;
            }
        }
        if (!pivot_found) {
            break;
        }
    }

    return rank;
}
