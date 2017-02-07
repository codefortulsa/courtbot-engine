import setup from './setup';

describe("sources", () => {
    const {expect} = setup();

    let testee;
    let noop;

    beforeEach(() => {
        noop = () => {};

        testee = require(`../src/sources.js`);
    });

    it ("registrationSourceFn should have a default function", () => {
        expect(typeof testee.registrationSourceFn).to.equal(`function`);
    });

    it("function setRegistrationSource should set registrationSouceFn correctly", () => {
        testee.setRegistrationSource(noop);
        expect(testee.registrationSourceFn).to.equal(noop);
    });

    it("function setRegistrationSource should return true when set registrationSouceFn correctly", () => {
        expect(testee.setRegistrationSource(noop)).to.equal(true);
    });

    it("function setRegistrationSource should return false when called with a non-function argument", () => {
        expect(testee.setRegistrationSource(undefined)).to.be.not.ok;
        expect(testee.setRegistrationSource(null)).to.equal(false);
        expect(testee.setRegistrationSource(true)).to.equal(false);
        expect(testee.setRegistrationSource(2)).to.equal(false);
        expect(testee.setRegistrationSource(NaN)).to.equal(false);
        expect(testee.setRegistrationSource(`not a function`)).to.equal(false);
        expect(testee.setRegistrationSource(Symbol(`foo`))).to.equal(false);
        expect(testee.setRegistrationSource({key: `value`})).to.equal(false);
    });

    it ("function setRegistrationSource should not override current registrationSourceFn when called with a non-function argument", () => {
        testee.registrationSourceFn = noop;

        testee.setRegistrationSource(undefined);
        expect(testee.registrationSourceFn).to.equal(noop);

        testee.setRegistrationSource(null);
        expect(testee.registrationSourceFn).to.equal(noop);

        testee.setRegistrationSource(true);
        expect(testee.registrationSourceFn).to.equal(noop);

        testee.setRegistrationSource(2);
        expect(testee.registrationSourceFn).to.equal(noop);

        testee.setRegistrationSource(NaN);
        expect(testee.registrationSourceFn).to.equal(noop);

        testee.setRegistrationSource(`not a function`);
        expect(testee.registrationSourceFn).to.equal(noop);

        testee.setRegistrationSource(Symbol(`foo`));
        expect(testee.registrationSourceFn).to.equal(noop);

        testee.setRegistrationSource({key: `value`});
        expect(testee.registrationSourceFn).to.equal(noop);
    });

    it ("registrationSourceFn should have a default function", () => {
        expect(typeof testee.messageSourceFn).to.equal(`function`);
    });

    it("function setMessageSource should set messageSourceFn correctly", () => {
        testee.setMessageSource(noop);
        expect(testee.messageSourceFn).to.equal(noop);
    });

    it("function setMessageSource should return a truthy value when setting messageSourceFn correctly", () => {
        expect(testee.setMessageSource(noop)).to.equal(true);
    });

    it("function setMessageSource should return a falsy value when called with a non-function argument", () => {
        expect(testee.setMessageSource(undefined)).to.equal(false);
        expect(testee.setMessageSource(null)).to.equal(false);
        expect(testee.setMessageSource(true)).to.equal(false);
        expect(testee.setMessageSource(2)).to.equal(false);
        expect(testee.setMessageSource(NaN)).to.equal(false);
        expect(testee.setMessageSource(`not a function`)).to.equal(false);
        expect(testee.setMessageSource(Symbol(`foo`))).to.equal(false);
        expect(testee.setMessageSource({key: `value`})).to.equal(false);
    });

    it ("function setMessageSource should not override current messageSourceFn when called with a non-function argument", () => {
        testee.messageSourceFn = noop;

        testee.setMessageSource(undefined);
        expect(testee.messageSourceFn).to.equal(noop);

        testee.setMessageSource(null);
        expect(testee.messageSourceFn).to.equal(noop);

        testee.setMessageSource(true);
        expect(testee.messageSourceFn).to.equal(noop);

        testee.setMessageSource(2);
        expect(testee.messageSourceFn).to.equal(noop);

        testee.setMessageSource(NaN);
        expect(testee.messageSourceFn).to.equal(noop);

        testee.setMessageSource(`not a function`);
        expect(testee.messageSourceFn).to.equal(noop);

        testee.setMessageSource(Symbol(`foo`));
        expect(testee.messageSourceFn).to.equal(noop);

        testee.setMessageSource({key: `value`});
        expect(testee.messageSourceFn).to.equal(noop);
    });
});
