import setup from './setup';

describe(`courtbotError`, () => {
    const {sandbox, expect} = setup();

    let testee;

    beforeEach(() => {
        testee = require(`../src/courtbotError`);
    });

    it (`a courtbotError should extend Error`, () => {
        let testError = new testee.default();

        expect(testError instanceof Error).to.equal(true);
    });

    it (`a courtbotError should have the correct default settings`, () => {
        let testSettings = {
            type: `general`,
            message: `No message listed`,
            case: `No case listed`,
            api: `No api listed`,
            timestamp: `No timestamp listed`,
            initialError: null
        };

        let testError = new testee.default();

        expect(testError.type).to.equal(testSettings.type);
        expect(testError.message).to.equal(testSettings.message);
        expect(testError.case).to.equal(testSettings.case);
        expect(testError.api).to.equal(testSettings.api);
        expect(testError.timestamp).to.equal(testSettings.timestamp);
        expect(testError.initialError).to.deep.equal(testSettings.initialError);
    });

    it (`a courtbotError settings should be set correctly`, () => {
        let testSettings = {
            type: `test`,
            message: `message`,
            case: `case`,
            api: `api`,
            timestamp: Date(),
            initialError: null
        }

        let testError = new testee.default(testSettings);

        expect(testError.type).to.equal(testSettings.type);
        expect(testError.message).to.equal(testSettings.message);
        expect(testError.case).to.equal(testSettings.case);
        expect(testError.api).to.equal(testSettings.api);
        expect(testError.timestamp).to.equal(testSettings.timestamp);
        expect(testError.initialError).to.deep.equal(testSettings.initialError);          
    });

    it (`a courtbotError should be throwable and identify itself as a courtbotError`, () => {           
        try {
            throw(new testee.default());
        }
        catch (err) {
            expect(err.isCourtbotError).to.equal(true);
        }
    });

    it (`a courtbotError should not include itself in a stack trace by default`, function stackTraceTest() {
            try {
            throw(new testee.default());
        }
        catch (err) {
            expect(err.stack).to.not.contain(`new courtbotError`);
        }
    });

    it (`a courtbotError should allow frames farther up the trace to be hidden`, function stackTraceTest() {
        try {
            throw(new testee.default({}, stackTraceTest));
        }
        catch (err) {
            expect(err.stack).to.not.contain(`stackTraceTest`);
        }
    });
});