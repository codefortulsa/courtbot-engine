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

    let stub;
    let emptyGetCasePartiesResult;
    let emptyGetCasePartyEventsResult;

    beforeEach(() => {
        dummyCase = -1;
        dummyParty = -1;
        dummyPartyList = [[{name: `a`}, {name: `b`}], {name: `c`}];
        reducedDummyPartyList = [{name: `a`}, {name: `b`}, {name: `c`}];
        dummyEventList = [{date: `1`}, [{date: '2'}, {date: `3`}]];
        reducedDummyEventList = [{date: `1`}, {date: '2'}, {date: `3`}];

        stub = sandbox.stub();

        testCase = `CF-2016-644`;

        testee = require(`../src/events.js`);
        emptyGetCasePartiesResult = { parties: [], promises: [] };
        emptyGetCasePartyEventsResult = { events: [], promises: [] };
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
        emitter.on(`retrieve-parties`, stub);

        return testee.getCaseParties(dummyCase)
            .then(() => {
                expect(stub).to.have.been.called();
            });
    });

    it(`getCaseParties() should pass the casenumber and the empty result object to the event listener`, () => {
        emitter.on(`retrieve-parties`, stub);

        return testee.getCaseParties(dummyCase)
            .then(() => {
                expect(stub).to.have.been.calledWith(dummyCase, emptyGetCasePartiesResult);
            });
    });

    it (`getCaseParties() should return a concatenated array of all party names found`, () => {
        emitter.on(`retrieve-parties`, (casenumber, result) => {
            dummyPartyList.forEach((elem) => {
                result.promises.push(successfulPromise(elem));
            });
        });

        return testee.getCaseParties(dummyCase).should.eventually.deep.equal(reducedDummyPartyList);
    });

    it(`the emitter should emit the retrieve-party-events event when getCasePartyEvents() is called`, () => {
        emitter.on(`retrieve-party-events`, stub);

        return testee.getCasePartyEvents(dummyCase)
            .then(() => {
                expect(stub).to.have.been.called()
            });
    });

    it(`getCasePartyEvents() should pass the casenumber, party and the empty result object to the event listener`, () => {
        emitter.on(`retrieve-party-events`, stub);

        return testee.getCasePartyEvents(dummyCase, dummyParty)
            .then(() => {
                expect(stub).to.have.been.calledWith(dummyCase, dummyParty, emptyGetCasePartyEventsResult);
            });
    });

    it (`getCasePartyEvents() should return a concatenated array of all events found`, () => {
        emitter.on(`retrieve-party-events`, (casenumber, party, result) => {
            dummyEventList.forEach((elem) => {
                result.promises.push(successfulPromise(elem));
            });
        });

        return testee.getCasePartyEvents(dummyCase, dummyParty).should.eventually.deep.equal(reducedDummyEventList);
    });
});