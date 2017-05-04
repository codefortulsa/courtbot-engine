import setup from './setup';

describe(`courtbotError`, () => {
    const {expect} = setup();

    let testee;

    beforeEach(() => {
        testee = require(`../src/courtbotError`);
    });

    it(`a courtbotError should extend Error`, () => {
        let testError = new testee.default();

        expect(testError instanceof Error).to.equal(true);
    });

    it(`a courtbotError should have the correct default settings`, () => {
        let testSettings = {
            type: testee.COURTBOT_ERROR_TYPES.GENERAL.GENERAL,
            message: `No message listed`,
            casenumber: `No casenumber listed`,
            api: `No api listed`,
            timestamp: `No timestamp listed`,
            initialError: null
        };

        let testError = new testee.default();

        expect(testError.type).to.equal(testSettings.type);
        expect(testError.message).to.equal(testSettings.message);
        expect(testError.casenumber).to.equal(testSettings.casenumber);
        expect(testError.api).to.equal(testSettings.api);
        expect(testError.timestamp).to.equal(testSettings.timestamp);
        expect(testError.initialError).to.deep.equal(testSettings.initialError);
    });

    it(`courtbotError settings should be set correctly`, () => {
        let testSettings = {
            type: `test`,
            message: `message`,
            casenumber: `casenumber`,
            api: `api`,
            timestamp: Date(),
            initialError: `a`
        }

        let testError = new testee.default(testSettings);

        expect(testError.type).to.equal(testSettings.type);
        expect(testError.message).to.equal(testSettings.message);
        expect(testError.casenumber).to.equal(testSettings.casenumber);
        expect(testError.api).to.equal(testSettings.api);
        expect(testError.timestamp).to.equal(testSettings.timestamp);
        expect(testError.initialError).to.deep.equal(testSettings.initialError);
    });

    it(`a courtbotError should be throwable and identify itself as a courtbotError`, () => {           
        try {
            throw(new testee.default());
        }
        catch (err) {
            expect(err.isCourtbotError).to.equal(true);
        }
    });

    it(`a courtbotError should not include itself in a stack trace by default`, function stackTraceTest() {
        try {
            throw(new testee.default());
        }
        catch (err) {
            expect(err.stack).to.not.contain(`new courtbotError`);
        }
    });

    it(`a courtbotError should allow frames farther up the trace to be hidden`, function stackTraceTest() {
        try {
            throw(new testee.default({}, stackTraceTest));
        }
        catch (err) {
            expect(err.stack).to.not.contain(`stackTraceTest`);
        }
    });

    describe(`wrap()`, () => {
        it(`should return a courtbot error unchanged`, () => {
            let testError = new testee.default();
            expect (testee.default.wrap(testError)).to.deep.equal(testError);
        });

        it (`should wrap a non-courtbot Error object with the correct default values`, () => {
            let initialError = new Error(`test`);

            let testSettings = {
                type: testee.COURTBOT_ERROR_TYPES.GENERAL.GENERAL,
                message: `No message listed`,
                casenumber: `No casenumber listed`,
                api: `No api listed`,
                initialError: initialError
            };

            let testError = testee.default.wrap(initialError);

            expect(testError.type).to.equal(testSettings.type);
            expect(testError.message).to.equal(testSettings.message);
            expect(testError.casenumber).to.equal(testSettings.casenumber);
            expect(testError.api).to.equal(testSettings.api);
            expect(testError.initialError).to.deep.equal(testSettings.initialError);
        });

        it (`should wrap a non-courtbot object with the correct default values`, () => {
            let initialError = {foo: `bar`};

            let testSettings = {
                type: testee.COURTBOT_ERROR_TYPES.GENERAL.GENERAL,
                message: `No message listed`,
                casenumber: `No casenumber listed`,
                api: `No api listed`,
                initialError: initialError
            };

            let testError = testee.default.wrap(initialError);

            expect(testError.type).to.equal(testSettings.type);
            expect(testError.message).to.equal(testSettings.message);
            expect(testError.casenumber).to.equal(testSettings.casenumber);
            expect(testError.api).to.equal(testSettings.api);
            expect(testError.initialError).to.deep.equal(testSettings.initialError);
        });

        it (`should wrap a non-courtbot primitive with the form { data: value } and the correct default values`, () => {
            let initialError = false;

            let testSettings = {
                type: testee.COURTBOT_ERROR_TYPES.GENERAL.GENERAL,
                message: `No message listed`,
                casenumber: `No casenumber listed`,
                api: `No api listed`,
                initialError: initialError
            };

            let testError = testee.default.wrap(initialError);

            expect(testError.type).to.equal(testSettings.type);
            expect(testError.message).to.equal(testSettings.message);
            expect(testError.casenumber).to.equal(testSettings.casenumber);
            expect(testError.api).to.equal(testSettings.api);
            expect(testError.initialError).to.deep.equal({ data: testSettings.initialError });
        });

        it (`should wrap with the correct options, if set`, () => {
            let initialError = new Error(`test`);

            let testSettings = {
                type: testee.COURTBOT_ERROR_TYPES.API.GENERAL,
                message: `test message`,
                casenumber: `test casenumber`,
                api: `test api`,
                timestamp: `test timestamp`,
                initialError: initialError
            };

            let testError = testee.default.wrap(initialError, testSettings);
            expect(testError.type).to.equal(testSettings.type);
            expect(testError.message).to.equal(testSettings.message);
            expect(testError.casenumber).to.equal(testSettings.casenumber);
            expect(testError.api).to.equal(testSettings.api);
            expect(testError.timestamp).to.equal(testSettings.timestamp);
            expect(testError.initialError).to.deep.equal(testSettings.initialError);            
        });
    });

    describe(`backwards support for .case`, ()=> {
        it (`should set CourtbotError.casenumber when passed case`, () => {
            let testSettings = {
                type: `test`,
                message: `message`,
                case: `casenumber`,
                api: `api`,
                timestamp: Date(),
                initialError: `a`
            }

            let testError = new testee.default(testSettings);

            expect(testError.type).to.equal(testSettings.type);
            expect(testError.message).to.equal(testSettings.message);
            expect(testError.casenumber).to.equal(testSettings.case);
            expect(testError.api).to.equal(testSettings.api);
            expect(testError.timestamp).to.equal(testSettings.timestamp);
            expect(testError.initialError).to.deep.equal(testSettings.initialError);
        });

        it (`should preferentially use casenumber when passed both case and casenumber in settings object`, () => {
            let testSettings = {
                type: `test`,
                message: `message`,
                case: `casenumber`,
                casenumber: `preferred casenumber`,
                api: `api`,
                timestamp: Date(),
                initialError: `a`
            }
            
            let testError = new testee.default(testSettings);

            expect(testError.type).to.equal(testSettings.type);
            expect(testError.message).to.equal(testSettings.message);
            expect(testError.casenumber).to.equal(testSettings.casenumber);
            expect(testError.api).to.equal(testSettings.api);
            expect(testError.timestamp).to.equal(testSettings.timestamp);
            expect(testError.initialError).to.deep.equal(testSettings.initialError);
        });

        it ('should return CourtbotError.casenumber when accessing CourtbotError.case', () => {
            let testSettings = {
                type: `test`,
                message: `message`,
                casenumber: `casenumber`,
                api: `api`,
                timestamp: Date(),
                initialError: `a`
            }

            let testError = new testee.default(testSettings);
            expect(testError.case).to.equal(testError.casenumber);
        });

        it ('should set CourtbotError.casenumber when writing to CourtbotError.case', () => {
            let testError = new testee.default();
            testError.case = `testing`;
            expect(testError.casenumber).to.equal(`testing`);
        });

        it ('should wrap with .case mapping to .casenumber, if set', () => {
            let initialError = new Error(`test`);

            let testSettings = {
                case: `test casenumber`,
            };

            let testError = testee.default.wrap(initialError, testSettings);
            expect(testError.casenumber).to.equal(testSettings.case);
        });

        it ('should wrap .casenumber preferentially, if both .case and .casenumber are set', () => {
            let initialError = new Error(`test`);

            let testSettings = {
                case: `case`,
                casenumber: `casenumber`
            };

            let testError = testee.default.wrap(initialError, testSettings);
            expect(testError.casenumber).to.equal(testSettings.casenumber);
        })
    });
});