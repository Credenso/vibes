// Generic Svelte-based helper functions

export const preload = async (src) => {
    const resp = await fetch(src);
    const blob = await resp.blob();

    return new Promise(function (resolve) {
        let reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject('Error: ', error);
    });
};

export function clickOutside(element, callbackFunction) {
    function onClick(event) {
        if (!element.contains(event.target)) {
            callbackFunction();
        }
    }

    document.body.addEventListener('click', onClick);

    return {
        update(newCallbackFunction) {
            callbackFunction = newCallbackFunction;
        },
        destroy() {
            document.body.removeEventListener('click', onClick);
        }
    }
}

export const prettyDate = (date) => {
    return `${date.toDateString().split(' ').slice(0,3).join(' ')} - ${date.toLocaleString().split(' ')[1].split(':').slice(0,2).join(":")}`
}


export const secondsToTime = (seconds) => {
    if (!seconds) return "00:00"
    let minutes = String(Math.floor(seconds / 60)).padStart(2, '0')
    return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

// Implementation of Smith-Waterman algorithm for gene similarity
// sourced from https://github.com/anthonyvittoria/smith-waterman-js/tree/master
export const alignment = (s1, s2) => {
    const match = 2;
    const mismatch = -1;
    const gap = -1;

    const rows = s1.length + 1;
    const cols = s2.length + 1;


    function calculate_score(matrix, x, y) {
        /* Calculates score for given coordinate in matrix. */

        // compute similarity score
        let similarity = (s1[x-1] == s2[y-1]) ? match : mismatch;

        // compute diagonal, above, and left scores
        let score_diag = matrix[x-1][y-1] + similarity;
        let score_above = matrix[x-1][y] + gap;
        let score_left = matrix[x][y-1] + gap;

        return Math.max(score_diag, score_above, score_left);
    }

    function create_matrix(rows, cols) {
        /* Create scoring matrix */

        // initialize matrix with 0s
        let score_matrix = [];
        for (let i = 0; i < rows; i++) {
            score_matrix[i] = [];
            for (let j = 0; j < cols; j++) {
                score_matrix[i].push(0);
            }
        }

        // compute scores and fill matrix
        let max_score = 0;
        let max_coords = [0,0];

        for (let i = 1; i < rows; i++) {
            for (let j = 1; j < cols; j++) {
                let score = calculate_score(score_matrix, i, j);
                if (score > max_score) {
                    max_score = score;
                    max_coords = [i,j];
                }
                score_matrix[i][j] = score;
            }
        }

        let [ x, y ] = max_coords

        // Return highest score
        return score_matrix[x][y];
    }

    return create_matrix(rows, cols)
}
