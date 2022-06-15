
// utility function used in minDiff
let mod = function (a, n) {
    return (a % n + n) % n
}

/**
 * Minimum difference between angles
 * @param {number} a1 
 * @param {number} a2 
 * @returns 
 */
export function minAngleDiff (a1, a2) {
    var diff = a2 - a1
    return Math.abs(mod((diff + 180), 360) - 180)
}