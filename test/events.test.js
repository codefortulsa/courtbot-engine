import setup from './setup';
import courtbotError from '../src/courtbotError';

describe(`events`, () => {
    const {sandbox, expect} = setup();

    let testee;
    let testCase;
    let emitter;

    let dummyCase;
    let dummyParty;
    let dummyPartyList;
    let reducedDummyPartyList;
    let dummyEventList;
    let reducedDummyEventList;

    let successfulPromise;
    let failedPromise;

    let retrieveStub;
    let retrieveErrorStub;
    let emptyResult;

    beforeEach(() => {
        testee = require(`../src/events.js`);
        testCase = `CF-2016-644`;
        emitter = testee.default;

        dummyCase = -1;
        dummyParty = -1;
        dummyPartyList = [[{name: `a`}, {name: `b`}], {name: `c`}];
        reducedDummyPartyList = [{name: `a`}, {name: `b`}, {name: `c`}];
        dummyEventList = [{date: `1`}, [{date: '2'}, {date: `3`}]];
        reducedDummyEventList = [{date: `1`}, {date: '2'}, {date: `3`}];

        retrieveStub = sandbox.stub();
        retrieveErrorStub = sandbox.stub();
        emptyResult = { promises: [] };

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
    });

    afterEach(() => {
        // So that we don't have all the listeners adding all the things
        emitter.removeAllListeners();
    });
    
    describe(`getCaseParties()`, () => {
        it(`the emitter should emit the retrieve-parties event`, () => {
            emitter.on(`retrieve-parties`, retrieveStub);

            return testee.getCaseParties(dummyCase)
                .then(() => {
                    expect(retrieveStub).to.have.been.called();
                });
        });

        it(`should pass the casenumber and the empty result object to the event listener`, () => {
            emitter.on(`retrieve-parties`, retrieveStub);

            return testee.getCaseParties(dummyCase)
                .then(() => {
                    expect(retrieveStub).to.have.been.calledWith(dummyCase, emptyResult);
                });
        });

        it (`if no errors in data retrieval, should return a concatenated array of all party names found`, () => {
            emitter.on(`retrieve-parties`, (casenumber, result) => {
                dummyPartyList.forEach((elem) => {
                    result.promises.push(successfulPromise(elem));
                });
            });

            return testee.getCaseParties(dummyCase).should.eventually.deep.equal(reducedDummyPartyList);
        });

        it (`if there are errors in data retrieval, should return only a concatenated array of all parties found by default`, () => {
            emitter.on(`retrieve-parties`, (casenumber, result) => {
                dummyPartyList.forEach((elem) => {
                    result.promises.push(successfulPromise(elem));
                });

                result.promises.push(failedPromise(`failed`));
            });

            return testee.getCaseParties(dummyCase).should.eventually.deep.equal(reducedDummyPartyList);
        });

        it (`if there are errors in data retrieval, should emit the retrieve-parties-error event by default`, () => {
            emitter.on(`retrieve-parties-error`, retrieveErrorStub);

            emitter.on(`retrieve-parties`, (casenumber, result) => {
                dummyPartyList.forEach((elem) => {
                    result.promises.push(successfulPromise(elem));
                });

                result.promises.push(failedPromise(`1`));
                result.promises.push(failedPromise(`2`));
                result.promises.push(failedPromise(`3`));
            });

            return testee.getCaseParties(dummyCase)
                .then(() => {
                    expect(retrieveErrorStub).to.have.been.called();
                });
        });

        it (`if there are errors in data retrieval, should emit retrieve-parties-error by default with an array of courtbotErrors with at least one error`, () => {
            emitter.on(`retrieve-parties-error`, (errors) => {
                expect(Array.isArray(errors)).to.equal(true);
                expect(errors.length).to.not.equal(0);
                expect(errors.every((e) => { return e.isCourtbotError === true })).to.equal(true);
            });

            emitter.on(`retrieve-parties`, (casenumber, result) => {
                dummyPartyList.forEach((elem) => {
                    result.promises.push(successfulPromise(elem));
                });

                result.promises.push(failedPromise(`1`));
                result.promises.push(failedPromise(`2`));
                result.promises.push(failedPromise(`3`));                              
            });

            return testee.getCaseParties(dummyCase);
        });

        it (`should place the data from non-courtbotError non-objects into courtbotError.initialError.data`, () => {
            let testData = `testing`;

            emitter.on(`retrieve-parties-error`, (errors) => {
                expect(errors[0].initialError.data).to.equal(testData);
            });

            emitter.on(`retrieve-parties`, (casenumber, result) => {
                dummyPartyList.forEach((elem) => {
                    result.promises.push(successfulPromise(elem));
                });

                result.promises.push(failedPromise(testData));
            });

            return testee.getCaseParties(dummyCase);
        });

        it (`should place the data from non-courtbotError objects into courtbotError.initialError`, () => {
            let testData = new Error(`testing`);

            emitter.on(`retrieve-parties-error`, (errors) => {
                expect(errors[0].initialError).to.deep.equal(testData);
            });

            emitter.on(`retrieve-parties`, (casenumber, result) => {
                dummyPartyList.forEach((elem) => {
                    result.promises.push(successfulPromise(elem));
                });

                result.promises.push(failedPromise(testData));
            });

            return testee.getCaseParties(dummyCase);
        });

        it ('should not place anything in intial error if the data error is a courtbotError', () => {
            let testData = new courtbotError(``);
            console.log(testee);

            emitter.on(`retrieve-parties-error`, (errors) => {
                expect(errors[0].initialError).to.deep.equal(null);
            });

            emitter.on(`retrieve-parties`, (casenumber, result) => {
                dummyPartyList.forEach((elem) => {
                    result.promises.push(successfulPromise(elem));
                });

                result.promises.push(failedPromise(testData));
            });

            return testee.getCaseParties(dummyCase);            
        });

        it ('should not emit the retrieve-parties-error event if the 1s bit of errorMode is off', () => {
            emitter.on(`retrieve-parties-error`, retrieveErrorStub);

            emitter.on(`retrieve-parties`, (casenumber, result) => {
                dummyPartyList.forEach((elem) => {
                    result.promises.push(successfulPromise(elem));
                });

                result.promises.push(failedPromise(`1`));
            });

            return testee.getCaseParties(dummyCase, 2)
                .then(() => {
                    expect(retrieveErrorStub).to.not.have.been.called();
                });
        });

        it ('should return a { parties: [], errors: [] } object if the 2s bit of errorMode is on', () => {
            emitter.on(`retrieve-parties`, (casenumber, result) => {
                dummyPartyList.forEach((elem) => {
                    result.promises.push(successfulPromise(elem));
                });

                result.promises.push(failedPromise(`1`));
                result.promises.push(failedPromise(`2`));
                result.promises.push(failedPromise(`3`));
            });

            return testee.getCaseParties(dummyCase, 2)
                .then((result) => {
                    expect(result.errors.every((e) => { return e.isCourtbotError === true })).to.equal(true);
                    expect(result.parties).to.deep.equal(reducedDummyPartyList);
                });
        });
    });

    describe(`getCasePartyEvents()`, () => {

        
        it(`the emitter should emit the retrieve-party-events event`, () => {
            emitter.on(`retrieve-party-events`, retrieveStub);

            return testee.getCasePartyEvents(dummyCase, dummyParty)
                .then(() => {
                    expect(retrieveStub).to.have.been.called();
                });
        });

        it(`should pass the casenumber, party and the empty result object to the event listener`, () => {
            emitter.on(`retrieve-party-events`, retrieveStub);

            return testee.getCasePartyEvents(dummyCase, dummyParty)
                .then(() => {
                    expect(retrieveStub).to.have.been.calledWith(dummyCase,dummyParty, emptyResult);
                });
        });

        it (`if no errors in data retrieval, should return a concatenated array of all party names found`, () => {
            emitter.on(`retrieve-party-events`, (casenumber, party, result) => {
                dummyEventList.forEach((elem) => {
                    result.promises.push(successfulPromise(elem));
                });
            });

            return testee.getCasePartyEvents(dummyCase, dummyParty).should.eventually.deep.equal(reducedDummyEventList);
        });

        it (`if there are errors in data retrieval, should return only a concatenated array of all parties found by default`, () => {
            emitter.on(`retrieve-party-events`, (casenumber, party, result) => {
                dummyEventList.forEach((elem) => {
                    result.promises.push(successfulPromise(elem));
                });

                result.promises.push(failedPromise(`failed`));
            });

            return testee.getCasePartyEvents(dummyCase).should.eventually.deep.equal(reducedDummyEventList);
        });

        it (`if there are errors in data retrieval, should emit the retrieve-party-events-error event by default`, () => {
            emitter.on(`retrieve-party-events-error`, retrieveErrorStub);

            emitter.on(`retrieve-party-events`, (casenumber, party, result) => {
                dummyEventList.forEach((elem) => {
                    result.promises.push(successfulPromise(elem));
                });

                result.promises.push(failedPromise(`1`));
                result.promises.push(failedPromise(`2`));
                result.promises.push(failedPromise(`3`));
            });

            return testee.getCasePartyEvents(dummyCase, dummyParty)
                .then(() => {
                    expect(retrieveErrorStub).to.have.been.called();
                });
        });

        it (`if there are errors in data retrieval, should emit retrieve-party-events-error by default with an array of courtbotErrors with at least one error`, () => {
            emitter.on(`retrieve-party-events-error`, (errors) => {
                expect(Array.isArray(errors)).to.equal(true);
                expect(errors.length).to.not.equal(0);
                expect(errors.every((e) => { return e.isCourtbotError === true })).to.equal(true);
            });

            emitter.on(`retrieve-party-events`, (casenumber, party, result) => {
                dummyEventList.forEach((elem) => {
                    result.promises.push(successfulPromise(elem));
                });

                result.promises.push(failedPromise(`1`));
                result.promises.push(failedPromise(`2`));
                result.promises.push(failedPromise(`3`));                              
            });

            return testee.getCasePartyEvents(dummyCase);
        });

        it (`should place the data from non-courtbotError non-objects into courtbotError.initialError.data`, () => {
            let testData = `testing`;

            emitter.on(`retrieve-party-events-error`, (errors) => {
                expect(errors[0].initialError.data).to.equal(testData);
            });

            emitter.on(`retrieve-party-events`, (casenumber, party, result) => {
                dummyEventList.forEach((elem) => {
                    result.promises.push(successfulPromise(elem));
                });

                result.promises.push(failedPromise(testData));
            });

            return testee.getCasePartyEvents(dummyCase, dummyParty);
        });

        it (`should place the data from non-courtbotError objects into courtbotError.initialError`, () => {
            let testData = new Error(`testing`);

            emitter.on(`retrieve-party-events-error`, (errors) => {
                expect(errors[0].initialError).to.deep.equal(testData);
            });

            emitter.on(`retrieve-party-events`, (casenumber, party, result) => {
                dummyEventList.forEach((elem) => {
                    result.promises.push(successfulPromise(elem));
                });

                result.promises.push(failedPromise(testData));
            });

            return testee.getCaseParties(dummyCase, dummyParty);
        });

        it ('should not place anything in intial error if the data error is a courtbotError', () => {
            let testData = new courtbotError(``);

            emitter.on(`retrieve-party-events-error`, (errors) => {
                expect(errors[0].initialError).to.deep.equal(null);
            });

            emitter.on(`retrieve-party-events`, (casenumber, party, result) => {
                dummyEventList.forEach((elem) => {
                    result.promises.push(successfulPromise(elem));
                });

                result.promises.push(failedPromise(testData));
            });

            return testee.getCasePartyEvents(dummyCase, dummyParty);            
        });

        it ('should not emit the retrieve-parties-error event if the 1s bit of errorMode is off', () => {
            emitter.on(`retrieve-party-events-error`, retrieveErrorStub);

            emitter.on(`retrieve-party-events`, (casenumber, party, result) => {
                dummyEventList.forEach((elem) => {
                    result.promises.push(successfulPromise(elem));
                });

                result.promises.push(failedPromise(`1`));
            });

            return testee.getCasePartyEvents(dummyCase, dummyParty, 2)
                .then(() => {
                    expect(retrieveErrorStub).to.not.have.been.called();
                });
        });

        it ('should return a { events: [], errors: [] } object if the 2s bit of errorMode is on', () => {
            emitter.on(`retrieve-party-events`, (casenumber, party, result) => {
                dummyEventList.forEach((elem) => {
                    result.promises.push(successfulPromise(elem));
                });

                result.promises.push(failedPromise(`1`));
                result.promises.push(failedPromise(`2`));
                result.promises.push(failedPromise(`3`));
            });

            return testee.getCasePartyEvents(dummyCase, dummyParty, 2)
                .then((result) => {
                    expect(result.errors.every((e) => { return e.isCourtbotError === true })).to.equal(true);
                    expect(result.events).to.deep.equal(reducedDummyEventList);
                });
        });
    });

});