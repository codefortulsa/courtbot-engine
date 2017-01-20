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
        expect(typeof testee.registrationSourceFn).to.equal(`function`);

        testee.setRegistrationSource(null);
        expect(typeof testee.registrationSourceFn).to.equal(`function`);

        testee.setRegistrationSource(true);
        expect(typeof testee.registrationSourceFn).to.equal(`function`);        

        testee.setRegistrationSource(2);
        expect(typeof testee.registrationSourceFn).to.equal(`function`);

        testee.setRegistrationSource(`not a function`);
        expect(typeof testee.registrationSourceFn).to.equal(`function`);

        testee.setRegistrationSource(Symbol(`foo`));
        expect(typeof testee.registrationSourceFn).to.equal(`function`);

        testee.setRegistrationSource({key: `value`});
        expect(typeof testee.registrationSourceFn).to.equal(`function`);
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
        expect(typeof testee.messageSourceFn).to.equal(`function`);

        testee.setMessageSource(null);
        expect(typeof testee.messageSourceFn).to.equal(`function`);

        testee.setMessageSource(true);
        expect(typeof testee.messageSourceFn).to.equal(`function`);        

        testee.setMessageSource(2);
        expect(typeof testee.messageSourceFn).to.equal(`function`);

        testee.setMessageSource(`not a function`);
        expect(typeof testee.messageSourceFn).to.equal(`function`);

        testee.setMessageSource(Symbol(`foo`));
        expect(typeof testee.messageSourceFn).to.equal(`function`);

        testee.setMessageSource({key: `value`});
        expect(typeof testee.messageSourceFn).to.equal(`function`);
    });

    it ("registrationSourceFn should have a default function", () => {
        expect(typeof testee.messageSourceFn).to.equal(`function`);
    });
});