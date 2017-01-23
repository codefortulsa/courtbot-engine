import setup from './setup';

describe(`events`, () => {
    const {sandbox, expect} = setup();

    let testee;

    let dummyCase;
    let dummyParty;
    let dummyPartyList;
    let reducedDummyPartyList;
    let dummyEventList;
    let reducedDummyEventList;

    let testCase;

    let emitter;

    let successfulPromise;
    let failedPromise;
    let errorPromise;

    beforeEach(() => {
        dummyCase = -1;
        dummyParty = -1;
        dummyPartyList = [[{name: `a`}, {name: `b`}], {name: `c`}];
        reducedDummyPartyList = [{name: `a`}, {name: `b`}, {name: `c`}];
        dummyEventList = [{date: `1`}, [{date: '2'}, {date: `3`}]];
        reducedDummyEventList = [{date: `1`}, {date: '2'}, {date: `3`}];

        testCase = `CF-2016-644`;

        testee = require(`../src/events.js`);
        emitter = testee.default;

        successfulPromise = (value) => {           
            return new Promise ((resolve, reject) => {
                resolve(value);
            })
        }

        failedPromise = (err) => {
            return new Promise ((resolve, reject) => {
                reject(err);
            })
        }

        errorPromise = (err) => {
            return new Promise ((resolve, reject) => {
                throw new Error(err);
            })
        }
    });

    it(`the emitter should emit the retrieve-parties event when getCaseParties() is called`, () => {
        let value = false;
        emitter.on(`retrieve-parties`, () => {
            value = true; 
        });

        return testee.getCaseParties(dummyCase)
            .then(() => expect(value).to.equal(true));
    });

    it(`getCaseParties() should pass the casenumber and the empty result object to the event listener`, () => {
        emitter.on(`retrieve-parties`, (casenumber, result) => {
            expect(casenumber).to.equal(dummyCase);

            expect(Array.isArray(result.promises)).to.equal(true);
            expect(result.promises.length).to.equal(0);
            expect(Array.isArray(result.parties)).to.equal(true);
            expect(result.parties.length).to.equal(0);
        });

        testee.getCaseParties(dummyCase);
    });

    it (`getCaseParties() should return a concatenated array of all party names found`, () => {
        emitter.on(`retrieve-parties`, (casenumber, result) => {
            dummyPartyList.forEach((elem) => {
                result.promises.push(successfulPromise(elem));
            });
        });

        return testee.getCaseParties(dummyCase).should.eventually.deep.equal(reducedDummyPartyList);
    });

    it(`getCaseParties() should let rejected Promises fall through the chain`, () => {       
        emitter.on(`retrieve-parties`, (casenumber, result) => {
            dummyPartyList.forEach((elem) => {
                result.promises.push(failedPromise(elem));
            });
        });

        // getCaseParties returns a Promise.all(), which should reject when one promise is rejected
        return testee.getCaseParties(dummyCase).should.eventually.be.rejected();
    });

    it(`getCaseParties() should let errors thrown in Promises fall through the chain`, () => {
        emitter.on(`retrieve-parties`, (casenumber, result) => {
            dummyPartyList.forEach((elem) => {
                result.promises.push(errorPromise(elem));
            });
        });

        // getCaseParties returns a Promise.all(), which should reject when one promise is rejected
        return testee.getCaseParties(dummyCase).should.eventually.be.rejected();
    });

    it(`the emitter should emit the retrieve-party-events event when getCasePartyEvents() is called`, () => {
        let value = false;
        emitter.on(`retrieve-party-events`, () => {
            value = true; 
        });

        return testee.getCasePartyEvents(dummyCase)
            .then(() => expect(value).to.equal(true));
    });

    it(`getCasePartyEvents() should pass the casenumber, party and the empty result object to the event listener`, () => {
        emitter.on(`retrieve-party-events`, (casenumber, party, result) => {
            expect(casenumber).to.equal(dummyCase);
            expect(party).to.equal(dummyParty);

            expect(Array.isArray(result.promises)).to.equal(true);
            expect(result.promises.length).to.equal(0);
            expect(Array.isArray(result.events)).to.equal(true);
            expect(result.events.length).to.equal(0);
        });

        testee.getCasePartyEvents(dummyCase, dummyParty);
    });

    it (`getCasePartyEvents() should return a concatenated array of all events found`, () => {
        emitter.on(`retrieve-party-events`, (casenumber, party, result) => {
            dummyEventList.forEach((elem) => {
                result.promises.push(successfulPromise(elem));
            });
        });

        return testee.getCasePartyEvents(dummyCase, dummyParty).should.eventually.deep.equal(reducedDummyEventList);
    });

    it(`getCasePartyEvents() should let rejected Promises fall through the chain`, () => {       
        emitter.on(`retrieve-party-events`, (casenumber, party, result) => {
            dummyPartyList.forEach((elem) => {
                result.promises.push(failedPromise(elem));
            });
        });

        // getCasePartyEvents returns a Promise.all(), which should reject when one promise is rejected
        return testee.getCasePartyEvents(dummyCase, dummyParty).should.eventually.be.rejected();
    });

    it(`getCasePartyEvents() should let errors thrown in Promises fall through the chain`, () => {
        emitter.on(`retrieve-party-events`, (casenumber, party, result) => {
            dummyPartyList.forEach((elem) => {
                result.promises.push(errorPromise(elem));
            });
        });

        // getCaseParties returns a Promise.all(), which should reject when one promise is rejected
        return testee.getCaseParties(dummyCase, dummyParty).should.eventually.be.rejected();
    });
});