const {set, merge, get, setIn, mergeIn, getIn, is} = require('../src/operators');
const {expect} = require('chai');
const {spy} = require('sinon');
const {freeze} = Object;
const {parse, stringify} = JSON;

const startingObj = freeze({
    a: 0,
    b: 1,
    c: freeze({
        d: freeze([
            1,
            freeze({
                e: freeze([5])
            }),
            3
        ]),
        f: {
            g: 'foo'
        }
    })
});

describe('operators', function() {
    describe('set', () => {
        it('should return a new object with new value', () => {
            const newValue = 1;
            const newObj = set(startingObj, 'a', newValue);

            expect(newObj).to.not.deep.equal(startingObj);
            expect(newObj.a).to.equal(newValue);
        });

        it('should return the original object when setting a value to its existing value', () => {
            const currentValue = startingObj.a;
            const newObj = set(startingObj, 'a', currentValue);

            expect(newObj).to.equal(startingObj);
        });

        it('should freeze result', () => {
            const newValue = 1;
            const newObj = set(startingObj, 'a', newValue);

            expect(() => {
                newObj.a = 10;
            }).to.throw('Cannot assign to read only property \'a\' of [object Object]');
        });
    });

    describe('setIn', () => {
        it('should return a new object with new value', () => {
            const newValue = 1;
            const newObj = setIn(startingObj, ['c', 'd', 1, 'e', 1], newValue);
            const newDeepValue = newObj.c.d[1].e[1];

            expect(newObj).to.not.deep.equal(startingObj);
            expect(newDeepValue).to.equal(newValue);
        });

        it('should create missing intermediate values', () => {
            const newValue = 1;
            const newObj = setIn(startingObj, ['f', 'd', 1, 'e', 1], newValue);
            const newDeepValue = newObj.f.d[1].e[1];

            expect(newDeepValue).to.equal(newValue);
        });

        it('should return the original object when setting a value to its existing value', () => {
            const currentValue = startingObj.c.d[1].e[0];
            const newObj = setIn(startingObj, ['c', 'd', 1, 'e', 0], currentValue);

            expect(newObj).to.equal(startingObj);
        });

        it('should freeze result', () => {
            const newValue = 1;
            const newObj = setIn(startingObj, ['c', 'd', 1, 'e', 1], newValue);
            const newDeepValue = newObj.c.d[1].e[1];

            expect(() => {
                newObj.c.d[1].e[1] = 10;
            }).to.throw('Cannot assign to read only property \'1\' of [object Array]');
        });
    });

    describe('merge', () => {
        it('should return a new object with new value', () => {
            const newValue = 1;
            const mergeObj = {a: newValue};
            const newObj = merge(startingObj, mergeObj);

            expect(newObj).to.not.deep.equal(startingObj);
            expect(newObj.a).to.equal(newValue);
        });

        it('should return the original object when setting a value to its existing value', () => {
            const currentValue = startingObj.a;
            const mergeObj = {a: currentValue};
            const newObj = merge(startingObj, mergeObj);

            expect(newObj).to.equal(startingObj);
        });

        it('should freeze result', () => {
            const newValue = 1;
            const mergeObj = {a: newValue};
            const newObj = merge(startingObj, mergeObj);

            expect(() => {
                newObj.a = 10;
            }).to.throw('Cannot assign to read only property \'a\' of [object Object]');
        });
    });

    describe('mergeIn', () => {
        it('should return a new object with new value', () => {
            const newValue = {h: 'someValue'};
            const newObj = mergeIn(startingObj, ['c', 'f'], newValue);
            const newDeepValue = newObj.c.f.h;

            expect(newObj).to.not.deep.equal(startingObj);
            expect(newDeepValue).to.equal(newValue.h);
        });

        it('should return the original object when setting a value to its existing value', () => {
            const currentValue = parse(stringify(startingObj.c.f));
            const newObj = mergeIn(startingObj, ['c', 'f'], currentValue);

            expect(newObj).to.equal(startingObj);
        });
    });

    describe('get', () => {
        it('should return value at specified key', () => {
            const normalValue = startingObj.a;
            const getValue = get(startingObj, 'a');

            expect(normalValue).to.equal(getValue);
        });

        it('should return sentinel when value is not defined', () => {
            const sentinel = {};
            const getValue = get(startingObj, 'foo', sentinel);

            expect(getValue).to.equal(sentinel);
        });
    });

    describe('getIn', () => {
        it('should return value at specified path', () => {
            const normalValue = startingObj.c.d[1].e[0];
            const getValue = getIn(startingObj, ['c', 'd', 1, 'e', 0]);

            expect(normalValue).to.equal(getValue);
        });

        it('should return sentinel when value is not defined', () => {
            const sentinel = {};
            const getValue = getIn(startingObj, ['c', 'd', 1, 'e', 1], sentinel);

            expect(getValue).to.equal(sentinel);
        });
    });

    describe('is', () => {
        it('should return true for deeply-equal trees', () => {
            const fullCopy = parse(stringify(startingObj));
            const isEqual = is(fullCopy, startingObj);

            expect(isEqual).to.be.true;
        });

        it('should return false for deeply-unequal trees', () => {
            const fullCopy = parse(stringify(startingObj));
            fullCopy.c.d[1].e[0] = 10;

            const isEqual = is(fullCopy, startingObj);

            expect(isEqual).to.be.false;
        });
    });
});