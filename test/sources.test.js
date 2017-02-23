import setup from './setup';
import proxyquire from 'proxyquire';

describe(`sources`, () => {
    const {expect, sandbox} = setup();

    let testee;
    let noop;

    let log4js;
    let traceStub;
    let debugStub;
    let infoStub;
    let logStub;
    let warnStub;
    let errorStub;
    let fatalStub;


    beforeEach(() => {
        noop = () => {};

        traceStub = sandbox.stub();
        debugStub = sandbox.stub();
        infoStub = sandbox.stub();
        logStub = sandbox.stub();
        warnStub = sandbox.stub();
        errorStub = sandbox.stub();
        fatalStub = sandbox.stub();

        log4js = {
            getLogger: sandbox.stub().returns({
                trace: traceStub,
                debug: debugStub,
                info: infoStub,
                log: logStub,
                warn: warnStub,
                error: errorStub,
                fatal: fatalStub
            })
        }

        testee = proxyquire(`../src/sources.js`, {
            log4js
        });
    });

    it (`registrationSourceFn should have a default function`, () => {
        expect(typeof testee.registrationSourceFn).to.equal(`function`);
    });

    it(`the default registrationSourceFn should log something to log4js when called`, () => {
        testee.registrationSourceFn();

        let logged = traceStub.called || debugStub.called || infoStub.called || logStub.called || warnStub.called || errorStub.called || fatalStub.called;
        expect(logged).to.equal(true);
    });

    it(`function setRegistrationSource should set registrationSouceFn correctly`, () => {
        testee.setRegistrationSource(noop);
        expect(testee.registrationSourceFn).to.equal(noop);
    });

    it(`function setRegistrationSource should return true when set registrationSouceFn correctly`, () => {
        expect(testee.setRegistrationSource(noop)).to.equal(true);
    });

    it(`function setRegistrationSource should return false when called with a non-function argument`, () => {
        expect(testee.setRegistrationSource(undefined)).to.equal(false);
        expect(testee.setRegistrationSource(null)).to.equal(false);
        expect(testee.setRegistrationSource(true)).to.equal(false);
        expect(testee.setRegistrationSource(2)).to.equal(false);
        expect(testee.setRegistrationSource(NaN)).to.equal(false);
        expect(testee.setRegistrationSource(`not a function`)).to.equal(false);
        expect(testee.setRegistrationSource(Symbol(`foo`))).to.equal(false);
        expect(testee.setRegistrationSource({key: `value`})).to.equal(false);
        expect(testee.setRegistrationSource([])).to.equal(false);
    });

    it(`function setRegistrationSource should not override current registrationSourceFn when called with a non-function argument`, () => {
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

        testee.setRegistrationSource([]);
        expect(testee.registrationSourceFn).to.equal(noop);
    });
});
