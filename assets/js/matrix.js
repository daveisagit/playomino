function matrix_rank(mat) {
    const rows = mat.length;
    const cols = mat[0].length;
    let rank = cols;

    // Iterate over each row
    for (let row = 0; row < rank; row++) {
        if (mat[row][row] !== 0) {
            for (let i = 0; i < rows; i++) {
                if (i !== row) {
                    const multiplier = mat[i][row] / mat[row][row];
                    for (let j = row; j < cols; j++) {
                        mat[i][j] -= multiplier * mat[row][j];
                    }
                }
            }
        } else {
            let reduce = true;
            for (let i = row + 1; i < rows; i++) {
                if (mat[i][row] !== 0) {
                    [mat[row], mat[i]] = [mat[i], mat[row]];
                    reduce = false;
                    break;
                }
            }

            if (reduce) {
                rank--;
                for (let i = 0; i < rows; i++) {
                    mat[i][row] = mat[i][rank];
                }
            }
            row--;
        }
    }

    return rank;
}
