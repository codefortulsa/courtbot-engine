import setup from './setup';

describe("sources", () => {
    const {sandbox, expect} = setup();

    let testee;
    let noop;

    beforeEach(() => {
        noop = () => {};

        testee = require(`../src/sources.js`);
    });

    it("function setRegistrationSource should set registrationSouceFn correctly", () => {
        testee.setRegistrationSource(noop);
        expect(testee.registrationSourceFn).to.equal(noop);
    });

    it("function setRegistrationSource should return an error value when called with a non-function argument", () => {
        let returnValue;

        returnValue = testee.setRegistrationSource(undefined);
        expect(returnValue).to.not.equal(undefined);

        returnValue = testee.setRegistrationSource(null);
        expect(returnValue).to.not.equal(undefined);

        returnValue = testee.setRegistrationSource(true);
        expect(returnValue).to.not.equal(undefined);

        returnValue = testee.setRegistrationSource(2);
        expect(returnValue).to.not.equal(undefined);

        returnValue = testee.setRegistrationSource(`not a function`);
        expect(returnValue).to.not.equal(undefined);

        returnValue = testee.setRegistrationSource(Symbol(`foo`));
        expect(returnValue).to.not.equal(undefined);

        returnValue = testee.setRegistrationSource({key: `value`});
        expect(returnValue).to.not.equal(undefined);
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

        testee.setRegistrationSource(`not a function`);
        expect(testee.registrationSourceFn).to.equal(noop);

        testee.setRegistrationSource(Symbol(`foo`));
        expect(testee.registrationSourceFn).to.equal(noop);

        testee.setRegistrationSource({key: `value`});
        expect(testee.registrationSourceFn).to.equal(noop);
    });

    it ("registrationSourceFn should have a default function", () => {
        expect(typeof testee.registrationSourceFn).to.equal(`function`);
    });

    it("function setMessageSource should set messageSourceFn correctly", () => {
        testee.setMessageSource(noop);
        expect(testee.messageSourceFn).to.equal(noop);
    });

    it("function setMessageSource should return an error value when called with a non-function argument", () => {
        let returnValue;

        returnValue = testee.setMessageSource(undefined);
        expect(returnValue).to.not.equal(undefined);

        returnValue = testee.setMessageSource(null);
        expect(returnValue).to.not.equal(undefined);

        returnValue = testee.setMessageSource(true);
        expect(returnValue).to.not.equal(undefined);

        returnValue = testee.setMessageSource(2);
        expect(returnValue).to.not.equal(undefined);

        returnValue = testee.setMessageSource(`not a function`);
        expect(returnValue).to.not.equal(undefined);

        returnValue = testee.setMessageSource(Symbol(`foo`));
        expect(returnValue).to.not.equal(undefined);

        returnValue = testee.setMessageSource({key: `value`});
        expect(returnValue).to.not.equal(undefined);
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

        testee.setMessageSource(`not a function`);
        expect(testee.messageSourceFn).to.equal(noop);

        testee.setMessageSource(Symbol(`foo`));
        expect(testee.messageSourceFn).to.equal(noop);

        testee.setMessageSource({key: `value`});
        expect(testee.messageSourceFn).to.equal(noop);
    });

    it ("registrationSourceFn should have a default function", () => {
        expect(typeof testee.messageSourceFn).to.equal(`function`);
    });
});