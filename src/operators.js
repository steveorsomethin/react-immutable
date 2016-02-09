const {isArray} = Array;
const {freeze} = Object;

function set(obj, name, value) {
    if (obj[name] === value) {
        return obj;
    }

    const result = {};

    for (const key in obj) {
        result[key] = obj[key];
    }

    result[name] = value;

    return freeze(result);
}

function setIn(obj, path, value) {
    if (getIn(obj, path) === value) {
        return obj;
    }

    const result = {};
    const pathLen = path.length;
    let sourceNode = obj;
    let targetNode = result;

    for (const key in sourceNode) {
        targetNode[key] = sourceNode[key];
    }

    for (let i = 0; i < pathLen - 1; i++) {
        const pathPart = path[i];
        const prevTargetNode = targetNode;

        sourceNode = sourceNode === undefined ? undefined : sourceNode[pathPart];
        targetNode = targetNode[pathPart] = isArray(sourceNode) ? [] : {};

        freeze(prevTargetNode);

        for (const key in sourceNode) {
            targetNode[key] = sourceNode[key];
        }
    }

    const lastPathPart = path[pathLen - 1];
    targetNode[lastPathPart] = value;

    freeze(targetNode);

    return result;
}

function merge(obj, value) {
    if (obj === value) {
        return obj;
    }

    const result = {};
    let somethingChanged = false;

    for (const key in obj) {
        result[key] = obj[key];
    }

    for (const key in value) {
        const output = value[key];
        if (!somethingChanged && output !== obj[key]) {
            somethingChanged = true;
        }

        result[key] = output;
    }

    return somethingChanged ? freeze(result) : obj;
}

function mergeIn(obj, path, value) {
    const currentValue = getIn(obj, path, value);
    const merged = merge(currentValue, value);

    return setIn(obj, path, merged);
}

function get(obj, name, notSet) {
    const result = obj[name];

    return result === undefined ? notSet : result;
}

function getIn(obj, path, notSet) {
    const pathLen = path.length;
    let node = obj;

    for (let i = 0; i < pathLen; i++) {
        const pathPart = path[i];
        node = node[pathPart];
        if (!node) {
            break;
        }
    }

    return node === undefined ? notSet : node;
}

function is(a, b) {
    if (a === b) {
        return true;
    }

    const aType = typeof a;
    const bType = typeof b;

    if (aType !== bType || aType !== 'object') {
        return false;
    }

    const checkedKeys = {};

    for (const key in a) {
        if (!is(a[key], b[key])) {
            return false;
        }

        checkedKeys[key] = true;
    }

    for (const key in b) {
        if (!checkedKeys[key]) {
            return false;
        }
    }

    return true;
}

module.exports = {set, merge, get, setIn, mergeIn, getIn, is};