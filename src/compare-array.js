module.exports = function compareArray(a, b) {
    if (a === b) {
        return true;
    }
    if (!a || !b) {
        return false;
    }

    const alen = a.length;
    const blen = b.length;

    if (alen !== blen) {
        return false;
    }

    let i = alen;
    while (--i >= 0) {
        if (a[i] !== b[i]) {
            return false;
        }
    }

    return true;
};