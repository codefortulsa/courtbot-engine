import setup from './setup';

describe(`utils`, () => {
    const {sandbox, expect} = setup();

    let testee;
    let noop;
    let sym = Symbol(`foo`);
    let sym2 = Symbol(`bar`);

    beforeEach(() => {
        noop = () => {}

        testee = require(`../src/utils.js`);
    });

    describe(`deepFlattenArray`, () => {
        it(`should return false when passed a non-array`, () => {
            expect(testee.deepFlattenArray(undefined)).to.equal(false);
            expect(testee.deepFlattenArray(null)).to.equal(false);
            expect(testee.deepFlattenArray(true)).to.equal(false);
            expect(testee.deepFlattenArray(2)).to.equal(false);
            expect(testee.deepFlattenArray(NaN)).to.equal(false);
            expect(testee.deepFlattenArray(`not a function`)).to.equal(false);
            expect(testee.deepFlattenArray(Symbol(`foo`))).to.equal(false);
            expect(testee.deepFlattenArray({key: `value`})).to.equal(false);
        });

        it(`should return an empty array when passed an empty array`, () => {
            expect(testee.deepFlattenArray([])).to.deep.equal([]);
        })

        it(`should place all values in a nested array at the top level of an array`, () => {
            let input = [1, [2, 3]];
            let output = [1, 2, 3];

            expect(testee.deepFlattenArray(input)).to.deep.equal(output);

            input = [[1, 2], 3, [[4, 5], 6, [7, 8, [9]]], 10];
            output = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

            expect(testee.deepFlattenArray(input)).to.deep.equal(output);
        });
    });

    describe(`scrubbers`, () => {
        it(`scrubArray() should return false when passed a non-array`, () => {
            expect(testee.scrubArray(undefined)).to.equal(false);
            expect(testee.scrubArray(null)).to.equal(false);
            expect(testee.scrubArray(true)).to.equal(false);
            expect(testee.scrubArray(2)).to.equal(false);
            expect(testee.scrubArray(NaN)).to.equal(false);
            expect(testee.scrubArray(`not a function`)).to.equal(false);
            expect(testee.scrubArray(sym)).to.equal(false);
            expect(testee.scrubArray({key: `value`})).to.equal(false);
            expect(testee.scrubArray(noop)).to.equal(false);
        });

        it(`scrubArray() should return an empty array when passed an empty-array`, () => {
            expect(testee.scrubArray([])).to.deep.equal([]);
        });

        it(`scrubArray() should remove everything but strings, booleans, numbers, and non-function objects from a passed array`, () => {
            let input = [noop, 5, sym, true, {}, null, undefined, `string`];
            let output = [5, sym, true, {}, `string`];

            expect(testee.scrubArray(input)).to.deep.equal(output);
        });

        it(`scrubArray() should scrub nested arrays`, () => {
            let input = [5, [noop, 5, sym, true, {}, null, undefined, `string`], `string`, [1, [undefined, `string`, noop]]];
            let output = [5, [5, sym, true, {}, `string`], `string`, [1, [`string`]]];

            expect(testee.scrubArray(input)).to.deep.equal(output);
        });

        it(`scrubObject should return false when passed a non-object, Array or function`, () => {
            expect(testee.scrubObject(undefined)).to.equal(false);
            expect(testee.scrubObject(null)).to.equal(false);
            expect(testee.scrubObject(true)).to.equal(false);
            expect(testee.scrubObject(2)).to.equal(false);
            expect(testee.scrubObject(NaN)).to.equal(false);
            expect(testee.scrubObject(`not a function`)).to.equal(false);
            expect(testee.scrubObject(sym)).to.equal(false);
            expect(testee.scrubObject([])).to.equal(false);
            expect(testee.scrubObject(noop)).to.equal(false);
        });

        it(`scrubObject should return an empty object when passed an empty object`, () => {
            expect(testee.scrubObject({})).to.deep.equal({});
        });

        it(`scrubObject should return an object scrubbed of everything but string, booleans, numbers and non-function objects`, () => {
            let input = {
                a: noop,
                b: 5,
                c: sym,
                d: true,
                e: {},
                f: null,
                g: undefined,
            }

            Object.defineProperty(input, `h`, {
                enumerable: true,
                configurable: true,
                get: function() {
                    return `string`;
                }
            });

            Object.defineProperty(input, `noenum`, {
                enumerable: false,
                configurable: true,
                writable: true,
                value: `not enum`
            });

            Object.defineProperty(input, `test1`, {
                enumerable: true,
                configurable: false,
                writable: false,
                value: () => {}
            });

            let output = {
                b: 5,
                c: sym,
                d: true,
                e: {},
                h: `string`
            }

            expect(testee.scrubObject(input)).to.deep.equal(output);
        });

        it(`scrubObject should scrub nested objects`, () => {
            let input = {
                a: noop,
                b: 5,
                c: sym,
                d: true,
                e: {},
                f: null,
                g: undefined,
                h: `string`,
                o1: {
                    a: noop,
                    b: 5
                },
                o2: {
                    a: sym2,
                    b: undefined,
                    hello: `world`
                }
            }

            let output = {
                b: 5,
                c: sym,
                d: true,
                e: {},
                h: `string`,
                o1: {
                    b: 5
                },
                o2: {
                    a: sym2,
                    hello: `world`
                }                
            }

            expect(testee.scrubObject(input)).to.deep.equal(output);
        });

        // Now combine the two
        it('scrubArray() should scrub objects nested in arrays', () => {
            let input = [{a: noop }];
            let output = [{}];
            expect(testee.scrubArray(input)).to.deep.equal(output);
        });

        it (`scrubObject() should scrub arrays nested in objects`, () => {
            let input = {
                a: [noop, 5]
            }
            let output = {
                a: [5]
            }
            expect(testee.scrubObject(input)).to.deep.equal(output);
        });
    });
});