import setup from './setup';

describe(`defaultOptions`, () => {
    const {expect} = setup();

    let testee;
    let noop;
    let sym = Symbol(`foo`);
    let sym2 = Symbol(`bar`);

    beforeEach(() => {
        noop = () => {}

        // Note: The module exports a default, anonymous function that returns an object - main focus of test
        testee = require(`../src/defaultOptions`);
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

    describe(`default`, () => {
        it(`should return an object by default`, () => {
            expect(testee.default()).to.be.an(`object`);
        });

        it(`should return an object with at least the dbUrl property`, () => {
            expect(testee.default()).to.contain.keys(`dbUrl`);
        });

        it('should return an object that contains the same key/value pairs as a passed object', () => {
            let o = { key: `value`, foo: `bar` }

            let keys = Object.keys(o);
            let options = testee.default(o);

            expect(options).to.include.keys(keys);
            keys.forEach((key) => {
                expect(options[key]).to.equal(o[key]);
            });
        });

        it('should assign each element of a passed array to the object to the string key corresponding to array index', () => {
            let o = [`option`, `option2`, `option3`, `kablam!`];
            let options = testee.default(o);

            for (let i in o) {
                expect(options[i]).to.equal(o[i]);
            }
        });

        it (`should not include null, undefined and function elements from a passed array`, () => {
            let o1 = [`option`, null, `option2`, undefined, `option3`, sym, noop,`kablam!`];
            let o2 = [`option`, `option2`, `option3`, sym, `kablam!`];
            let options = testee.default(o1);

            for (let i in o2) {
                expect(options[i]).to.equal(o2[i]);           
            }
        });

        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign,
        // Object.assign() should wrap numbers, booleans, strings and symbols into the target object, starting with key "0"
        it('should wrap primitives into the object with key "0"', () => {
            expect(testee.default(5)[`0`]).to.equal(5);
            expect(testee.default(true)[`0`]).to.equal(true);
            expect(Number.isNaN(testee.default(NaN)[`0`])).to.equal(true);
            expect(testee.default(`not a function`)[0]).to.equal(`not a function`);
            expect(testee.default(sym)[0]).to.equal(sym);
        });

        it('should ignore functions, null and undefined being passed', () => {
            expect(testee.default(noop)).to.not.include.keys(`0`);
            expect(testee.default(null)).to.not.include.keys(`0`);
            expect(testee.default(undefined)).to.not.include.keys(`0`);
        });

        it(`should not treat a passed string like an array where each element is a single character`, () => {
            let test = `not an object`;

            expect(testee.default(test)).to.not.include.keys((test.length - 1) + ``);
        });

        it(`should wrap multiple objects being passed into the returned object`, () => {
            let o1 = { key: `value`}
            let o2 = { foo: `bar` }

            let o1keys = Object.keys(o1);
            let o2keys = Object.keys(o2);
            let options = testee.default(o1, o2);

            o1keys.forEach((key) => {
                expect(options[key]).to.equal(o1[key]);
            });

            o2keys.forEach((key) => {
                expect(options[key]).to.equal(o2[key]);
            });
        });

        it(`should overwrite the values for existing keys when passed multiple objects`, () => {
            let o1 = { key: `value`, foo: `bar` }
            let o2 = { key: `foo` }

            let options = testee.default(o1, o2);
            expect(options.key).to.equal(o2.key);
            expect(options.foo).to.equal(o1.foo);

            options = testee.default(o2, o1);
            expect(options.key).to.equal(o1.key);
            expect(options.foo).to.equal(o1.foo);
        });

        it(`should have all values when passed both an object and an array`, () => {
            let o1 = { key: `value`, foo: `bar` }
            let o2 = [`option`, `option2`, `option3`, `kablam!`];

            let options = testee.default(o1, o2);

            Object.keys(o1).forEach((key) => {
                expect(options[key]).to.equal(o1[key]);
            });
            Object.keys(o2).forEach((key) => {
                expect(options[key]).to.equal(o2[key]);
            });
        });

        it(`should have all values when passed an object and primitives`, () => {
            let o = { key: `value`, foo: `bar` }

            let options = testee.default(true, 5, o);

            Object.keys(o).forEach((key) => {
                expect(options[key]).to.equal(o[key]);
            });
            expect(options[`0`]).to.equal(true);
            expect(options[`1`]).to.equal(5);
        })

        it('should have all values when passed multiple acceptable primitives', () => {
            let o = [1, `not a function`, true, NaN];
            let options = testee.default(...o);

            Object.keys(o).forEach((key) => {
                if (Number.isNaN(o[key])) {
                    expect(Number.isNaN(options[key])).to.equal(true);
                }
                else {
                    expect(options[key]).to.equal(o[key]);
                }
            });
        });

        it(`should ignore functions, symbols, null and undefined when passed multiple primitives`, () => {
            let o1 = [1, null, `not a function`, undefined, true, noop, NaN, sym];
            let o2 = [1, `not a function`, true, NaN, sym];
            let options = testee.default(...o1);

            Object.keys(o2).forEach((key) => {
                if (Number.isNaN(o2[key])) {
                    expect(Number.isNaN(options[key])).to.equal(true);
                }
                else {
                    expect(options[key]).to.equal(o2[key]);
                }
            });
        });

        it(`should concatenate accordingly when passed multiple arrays`, () => {
            let input1 = [5];
            let input2 = [4];
            let output = [5, 4];

            let options = testee.default(input1, input2);
            Object.keys(output).forEach((key) => {
                expect(options[key]).to.equal(output[key]);
            });

            options = testee.default(input2, input1);
            output.reverse();
            Object.keys(output).forEach((key) => {
                expect(options[key]).to.equal(output[key]);
            });
        });

        it (`should concatenate accordingly when passed an array and primitives`, () => {
            let input1 = [5, 3, 2];
            let input2 = [true, true, false];
            let output = [5, 3, 2, true, true, false];

            let options = testee.default(input1, ...input2);
            Object.keys(output).forEach((key) => {
                expect(options[key]).to.equal(output[key]);
            });

            options = testee.default(...input1, input2);
            Object.keys(output).forEach((key) => {
                expect(options[key]).to.equal(output[key]);
            });
        });

        it (`should have all values and concatenate accordingly when passed an object, array and primitives`, () => {
            let input1 = { key: `value`, foo: `bar` }
            let input2 = [5, 3, 2];
            let input3 = [true, true, false];
            let output = [5, 3, 2, true, true, false];

            let options = testee.default(input1, input2, ...input3);
            Object.keys(input1).forEach((key) => {
                expect(options[key]).to.equal(input1[key]);
            });
            Object.keys(output).forEach((key) => {
                expect(options[key]).to.equal(output[key]);
            });

            options = testee.default(...input2, input1, input3);
            Object.keys(input1).forEach((key) => {
                expect(options[key]).to.equal(input1[key]);
            });
            Object.keys(output).forEach((key) => {
                expect(options[key]).to.equal(output[key]);
            });
        });
    });
});
