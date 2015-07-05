const {isArray} = Array;
const {freeze, keys} = Object;

function is(a, b) {
    if (a === b) return true;

    const aType = typeof a;
    const bType = typeof b;

    if (aType !== bType || aType !== 'object') return false;
    
    const checkedKeys = {};

    for (let key in a) {
        if (!is(a[key], b[key])) {
            return false;
        }

        checkedKeys[key] = true;
    }

    for (let key in b) {
        if (!checkedKeys[key]) return false;
    }

    return true;
}

function set(obj, name, value) {
    if (obj[name] === value) return obj;

    const result = {};

    for (let key in obj) {
        result[key] = obj[key];
    }

    result[name] = value;

    return freeze(result);
}

function merge(obj, value) {
    const result = {};
    let somethingChanged = false;

    for (let key in obj) {
        const output = obj[key];
        if (!somethingChanged && output !== value[key]) {
            somethingChanged = true;
        }

        result[key] = output;
    }

    for (let key in value) {
        const output = value[key];
        if (!somethingChanged && output !== obj[key]) {
            somethingChanged = true;
        }

        result[key] = value[key]; 
    }

    return somethingChanged ? freeze(result) : obj;
}

function setIn(obj, path, value) {
    if (getIn(obj, path) === value) return obj;

    const result = {};
    const pathLen = path.length;
    let sourceNode = obj;
    let targetNode = result;
    
    for (let key in sourceNode) {
        targetNode[key] = sourceNode[key];
    }

    for (let i = 0; i < pathLen - 1; i++) {
        const pathPart = path[i];
        sourceNode = sourceNode === undefined ? undefined : sourceNode[pathPart];
        targetNode = targetNode[pathPart] = isArray(sourceNode) ? [] : {};

        for (let key in sourceNode) {
            targetNode[key] = sourceNode[key];
        }

        // if (i !== pathLen - 2) freeze(targetNode);
    }

    const lastPathPart = path[pathLen - 1];
    targetNode[lastPathPart] = value;

    // freeze(targetNode);
    // freeze(result);

    return result;
}

function getIn(obj, path, notSet) {
    const pathLen = path.length;
    let node = obj;

    for (let i = 0; i < pathLen; i++) {
        const pathPart = path[i];
        node = node[pathPart];
        if (!node) break;
    }
    
    return node === undefined ? notSet : node;
}

function get(obj, name, notSet) {
    return obj[name] || notSet;
}

nrdp.stuff = {set, merge, get, setIn, getIn, is};

module.exports = {set, merge, get, setIn, getIn, is};