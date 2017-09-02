import setup from './setup';
import { COURTBOT_ERROR_TYPES } from '../src/courtbotError';
import proxyquire from 'proxyquire';

describe(`events`, () => {
    const {sandbox, expect, chance} = setup();

    let testee;
    let emitter;

    let dummyCase;
    let dummyParty;

    let dummyPartyList;
    let dummyPartyArray;
    let reducedDummyPartyList;
    let dummyEventList;
    let reducedDummyEventList;

    let duplicatePartyList;
    let reducedDuplicatePartyList;

    let retrieveErrorStub;
    let emptyResult;

    let log4js;
    let traceStub;
    let debugStub;
    let infoStub;
    let logStub;
    let warnStub;
    let errorStub;
    let fatalStub;

    beforeEach(() => {
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

        testee = proxyquire(`../src/events.js`, {
            log4js
        });
        emitter = testee.default;

        dummyCase = -1;
        dummyParty = -1;
        dummyPartyList = [[{name: `a`}, {name: `b`}], {name: `c`}];
        reducedDummyPartyList = [{name: `a`}, {name: `b`}, {name: `c`}];
        dummyEventList = [{date: `1`}, [{date: '2'}, {date: `3`}]];
        reducedDummyEventList = [{date: `1`}, {date: '2'}, {date: `3`}];

        duplicatePartyList = [{name: `a`}, {name: `b`}, {name: `a`}];
        reducedDuplicatePartyList = [{name: `a`}, {name: `b`}];

        retrieveErrorStub = sandbox.stub();
        emptyResult = { promises: [] };
    });

    afterEach(() => {
        // So that we don't have all the listeners adding all the things
        emitter.removeAllListeners();
    });

    describe(`getCaseParties()`, () => {
        it(`the emitter should emit the retrieve-parties event`, () => {
            return expect(testee.getCaseParties).to.emitFrom(emitter, `retrieve-parties`);
        });

        it(`should pass the casenumber and the empty result object to the event listener`, () => {
            return expect(() => {testee.getCaseParties(dummyCase)}).to.emitFrom(emitter, `retrieve-parties`, dummyCase, emptyResult);
        });

        it(`if no errors in data retrieval, should return a concatenated array of all party names found`, () => {
            emitter.on(`retrieve-parties`, (casenumber, result) => {
                dummyPartyList.forEach((elem) => {
                    result.promises.push(Promise.resolve(elem));
                });
            });

            return testee.getCaseParties(dummyCase).should.eventually.deep.equal(reducedDummyPartyList);
        });

        it(`should handle a combination of strings, objects whose "name" property is a string, and arrays of such objects`, () => {
            const dummyPartyString = `a,b`;
            const dummyPartyObject = {name: `c,d`};
            dummyPartyArray = [{name: `e,f` }, {name: `g,h`}];
            let output = [{name: `a,b`}, {name: `c,d`}, {name: `e,f`}, {name: `g,h`}];

            emitter.on(`retrieve-parties`, (casenumber, result) => {
                result.promises.push(Promise.resolve(dummyPartyString));
                result.promises.push(Promise.resolve(dummyPartyObject));
                result.promises.push(Promise.resolve(dummyPartyArray));
            });

            return testee.getCaseParties(dummyCase).should.eventually.deep.equal(output);
        });

        it(`if an array of objects contains some malformed items, it should process the remainder correctly`, () => {
            dummyPartyArray = [{name: `a`}, undefined, null, {notright: `hi`}, 2, NaN, Symbol(`foo`), () => {}, [], {name: `b`}, true, {name: `c`}];

            emitter.on(`retrieve-parties`, (casenumber, result) => {
                result.promises.push(Promise.resolve(dummyPartyArray));
            });

            return testee.getCaseParties(dummyCase).should.eventually.deep.equal(reducedDummyPartyList);
        });

        it(`should only return unique parties if duplicate parties are found`, () => {
            emitter.on(`retrieve-parties`, (casenumber, result) => {
                duplicatePartyList.forEach((elem) => {
                    result.promises.push(Promise.resolve(elem));
                });
            });

            return testee.getCaseParties(dummyCase).should.eventually.deep.equal(reducedDuplicatePartyList);
        });

        it(`if there are errors in data retrieval, should return only a concatenated array of all parties found by default`, () => {
            emitter.on(`retrieve-parties`, (casenumber, result) => {
                dummyPartyList.forEach((elem) => {
                    result.promises.push(Promise.resolve(elem));
                });

                result.promises.push(Promise.reject(`failed`));
            });

            return testee.getCaseParties(dummyCase).should.eventually.deep.equal(reducedDummyPartyList);
        });

        describe(`error behavior`, () => {
            it(`if there are errors in data retrieval, should emit the retrieve-parties-error event by default`, () => {
                emitter.on(`retrieve-parties`, (casenumber, result) => {
                    dummyPartyList.forEach((elem) => {
                        result.promises.push(Promise.resolve(elem));
                    });

                    result.promises.push(Promise.reject(`1`));
                    result.promises.push(Promise.reject(`2`));
                    result.promises.push(Promise.reject(`3`));
                });

                emitter.on(`retrieve-parties-error`, retrieveErrorStub);
                
                return testee.getCaseParties(dummyCase).then(() => {
                    expect(retrieveErrorStub).to.have.been.called();
                });
            });

            it(`if there are errors in data retrieval, should emit retrieve-parties-error by default with an array of courtbotErrors with at least one error`, () => {
                emitter.on(`retrieve-parties-error`, (errors) => {
                    expect(errors).to.be.an(`Array`);
                    expect(errors).to.not.be.empty;
                    expect(errors.every((e) => { return e.isCourtbotError === true })).to.equal(true);
                });

                emitter.on(`retrieve-parties`, (casenumber, result) => {
                    dummyPartyList.forEach((elem) => {
                        result.promises.push(Promise.resolve(elem));
                    });

                    result.promises.push(Promise.reject(`1`));
                    result.promises.push(Promise.reject(`2`));
                    result.promises.push(Promise.reject(`3`));
                });

                return testee.getCaseParties(dummyCase);
            });

            it('should not emit the retrieve-parties-error event if the options.emitErrorEvent is false', () => {
                emitter.on(`retrieve-parties-error`, retrieveErrorStub);

                emitter.on(`retrieve-parties`, (casenumber, result) => {
                    dummyPartyList.forEach((elem) => {
                        result.promises.push(Promise.resolve(elem));
                    });

                    result.promises.push(Promise.reject(`1`));
                });

                return testee.getCaseParties(dummyCase, { emitErrorEvent: false })
                    .then(() => {
                        expect(retrieveErrorStub).to.not.have.been.called();
                    });
            });

            it('should return a { parties: [], errors: [] } object if the options.returnErrorsWithData property is true', () => {
                emitter.on(`retrieve-parties`, (casenumber, result) => {
                    dummyPartyList.forEach((elem) => {
                        result.promises.push(Promise.resolve(elem));
                    });

                    result.promises.push(Promise.reject(`1`));
                    result.promises.push(Promise.reject(`2`));
                    result.promises.push(Promise.reject(`3`));
                });

                return testee.getCaseParties(dummyCase, {returnErrorsWithData: true})
                    .then((result) => {
                        expect(result.errors.every((e) => { return e.isCourtbotError === true })).to.equal(true);
                        expect(result.parties).to.deep.equal(reducedDummyPartyList);
                    });
            });

            // Begin enhanced logging
            it(`should emit a courtbotError of type COURBOT_ERROR_TYPES.API.GET and the correct case number if a promise rejects with a non-courtbotError`, () => {
                emitter.on(`retrieve-parties`, (casenumber, result) => {
                    result.promises.push(Promise.reject(`fail`));
                });

                emitter.on(`retrieve-parties-error`, (errors) => {
                    expect(errors[0].type).to.equal(COURTBOT_ERROR_TYPES.API.GET);
                    expect(errors[0].casenumber).to.equal(dummyCase);
                });

                return testee.getCaseParties(dummyCase);
            });

            it(`should emit a courtbotError of type COURTBOT_ERROR_TYPES.API.GET and the correct case number if a promise resolves with an object that does not have a "name" property`, () => {
                emitter.on(`retrieve-parties`, (casenumber, result) => {
                    result.promises.push(Promise.resolve({ notname: `a,b,c` }));
                });

                emitter.on(`retrieve-parties-error`, (errors) => {
                    expect(errors[0].type).to.equal(COURTBOT_ERROR_TYPES.API.GET);
                    expect(errors[0].casenumber).to.equal(dummyCase);
              });

                return testee.getCaseParties(dummyCase);
            });

            it('should emit a courtbotError of type COURTBOT_ERROR_TYPES.API.GET and the correct case number if a promise resolves with an array of objects', () => {
                emitter.on(`retrieve-parties`, (casenumber, result) => {
                    result.promises.push(Promise.resolve([{ notname: `a,b,c` }, dummyPartyList, { a: true }, { b: false }]));
               });

                emitter.on(`retrieve-parties-error`, (errors) => {
                    expect(errors[0].type).to.equal(COURTBOT_ERROR_TYPES.API.GET);
                    expect(errors[0].casenumber).to.equal(dummyCase);
                });

                return testee.getCaseParties(dummyCase);
            });
        });

        describe(`log4js`, () => {
            it(`should send something to log4js if no handlers are attached to retrieve-parties`, () => {
                return testee.getCaseParties(dummyCase).then(() => {
                    let logged = traceStub.called || debugStub.called || infoStub.called || logStub.called || warnStub.called || errorStub.called || fatalStub.called;
                    expect(logged).to.equal(true);
                });                
            });

            it(`should send something to log4js when handling a rejected promise`, () => {
                emitter.on(`retrieve-parties`, (casenumber, result) => {
                    result.promises.push(Promise.reject(`failed`));
                });
                return testee.getCaseParties(dummyCase).then(() => {
                    let logged = traceStub.called || debugStub.called || infoStub.called || logStub.called || warnStub.called || errorStub.called || fatalStub.called;
                    expect(logged).to.equal(true);
                });
            });

            it(`should send something to log4js when handling malformed data`, () => {
                emitter.on(`retrieve-parties`, (casenumber, result) => {
                    result.promises.push(Promise.resolve({ notname: `notname`}));
                });
                return testee.getCaseParties(dummyCase).then(() => {
                    let logged = traceStub.called || debugStub.called || infoStub.called || logStub.called || warnStub.called || errorStub.called || fatalStub.called;
                    expect(logged).to.equal(true);
                });
            });
        });
    });

    describe(`getCasePartyEvents()`, () => {
        it(`the emitter should emit the retrieve-party-events event`, () => {
            return expect(testee.getCasePartyEvents).to.emitFrom(emitter, `retrieve-party-events`);
        });

        it(`should pass the casenumber, party and the empty result object to the event listener`, () => {
            return expect(() => {testee.getCasePartyEvents(dummyCase, dummyParty)}).to.emitFrom(emitter, `retrieve-party-events`, dummyCase, dummyParty, emptyResult);
        });

        it(`if no errors in data retrieval, should return an array of all events found`, () => {
            emitter.on(`retrieve-party-events`, (casenumber, party, result) => {
                dummyEventList.forEach((elem) => {
                    result.promises.push(Promise.resolve(elem));
                });
            });

            return testee.getCasePartyEvents(dummyCase, dummyParty).should.eventually.deep.equal(reducedDummyEventList);
        });

        it(`if there are errors in data retrieval, should return only a concatenated array of all parties found by default`, () => {
            emitter.on(`retrieve-party-events`, (casenumber, party, result) => {
                dummyEventList.forEach((elem) => {
                    result.promises.push(Promise.resolve(elem));
                });

                result.promises.push(Promise.reject(`failed`));
            });

            return testee.getCasePartyEvents(dummyCase).should.eventually.deep.equal(reducedDummyEventList);
        });

        it(`if there are errors in data retrieval, should emit the retrieve-party-events-error event by default`, () => {
            emitter.on(`retrieve-party-events-error`, retrieveErrorStub);

            emitter.on(`retrieve-party-events`, (casenumber, party, result) => {
                dummyEventList.forEach((elem) => {
                    result.promises.push(Promise.resolve(elem));
                });

                result.promises.push(Promise.reject(`1`));
                result.promises.push(Promise.reject(`2`));
                result.promises.push(Promise.reject(`3`));
            });

            // This test doesn't work as expected, but should be equivalent to the uncommented test. Will look into it later, but it works for now
            // No sense wasting time
            // return expect(() => { testee.getCasePartyEvents(dummyCase, dummyParty) }).to.emitFrom(emitter, `retrieve-party-events-error`);

            return testee.getCasePartyEvents(dummyCase, dummyParty)
                .then(() => {
                    expect(retrieveErrorStub).to.have.been.called();
                });
        });

        it(`if there are errors in data retrieval, should emit retrieve-party-events-error by default with an array of courtbotErrors with at least one error`, () => {
            emitter.on(`retrieve-party-events-error`, (errors) => {
                expect(errors).to.be.an(`Array`);
                expect(errors).to.not.be.empty;
                expect(errors.every((e) => { return e.isCourtbotError === true })).to.equal(true);
            });

            emitter.on(`retrieve-party-events`, (casenumber, party, result) => {
                dummyEventList.forEach((elem) => {
                    result.promises.push(Promise.resolve(elem));
                });

                result.promises.push(Promise.reject(`1`));
                result.promises.push(Promise.reject(`2`));
                result.promises.push(Promise.reject(`3`));
            });

            return testee.getCasePartyEvents(dummyCase);
        });

        it('should not emit the retrieve-parties-error event if options.emitErrorEvent is false', () => {
            emitter.on(`retrieve-party-events-error`, retrieveErrorStub);

            emitter.on(`retrieve-party-events`, (casenumber, party, result) => {
                dummyEventList.forEach((elem) => {
                    result.promises.push(Promise.resolve(elem));
                });

                result.promises.push(Promise.reject(`1`));
            });

            return testee.getCasePartyEvents(dummyCase, dummyParty, { emitErrorEvent: false })
                .then(() => {
                    expect(retrieveErrorStub).to.not.have.been.called();
                });
        });

        it('should return a { events: [], errors: [] } object if options.returnErrorsWithData is true', () => {
            emitter.on(`retrieve-party-events`, (casenumber, party, result) => {
                dummyEventList.forEach((elem) => {
                    result.promises.push(Promise.resolve(elem));
                });

                result.promises.push(Promise.reject(`1`));
                result.promises.push(Promise.reject(`2`));
                result.promises.push(Promise.reject(`3`));
            });

            return testee.getCasePartyEvents(dummyCase, dummyParty, { returnErrorsWithData: true })
                .then((result) => {
                    expect(result.errors.every((e) => { return e.isCourtbotError === true })).to.equal(true);
                    expect(result.events).to.deep.equal(reducedDummyEventList);
                });
        });

        it(`should emit a courtbotError of type COURBOT_ERROR_TYPES.API.GET and the correct case number if a promise rejects`, () => {
            emitter.on(`retrieve-party-events`, (casenumber, party, result) => {
                result.promises.push(Promise.reject(`fail`));
            });

            emitter.on(`retrieve-party-events-error`, (errors) => {
                expect(errors[0].type).to.equal(COURTBOT_ERROR_TYPES.API.GET);
                expect(errors[0].casenumber).to.equal(dummyCase);
            });

            return testee.getCasePartyEvents(dummyCase, dummyParty);
        });

        describe(`log4js`, () => {
            it(`should send something to log4js when handling a rejected promise`, () => {
                emitter.on(`retrieve-party-events`, (casenumber, party, result) => {
                    result.promises.push(Promise.reject(`failed`));
                });
                return testee.getCasePartyEvents(dummyCase, dummyParty).then(() => {
                    let logged = traceStub.called || debugStub.called || infoStub.called || logStub.called || warnStub.called || errorStub.called || fatalStub.called;
                    expect(logged).to.equal(true);
                });
            });
        });
    });

    describe(`sendNonReplyMessage`, () => {
        let dummyTo, dummyMsg, dummyCommunicationType;

        beforeEach(() => {
            dummyTo = chance.phone();
            dummyMsg = chance.word();
            dummyCommunicationType = chance.word();
        });

        it(`the emitter should emit the send-non-reply event`, () => {
            return expect(testee.sendNonReplyMessage).to.emitFrom(emitter, `send-non-reply`);
        });

        it(`should pass the an address, msg, communication type and the empty result object to the event listener`, () => {
            return expect(() => {testee.sendNonReplyMessage(dummyTo, dummyMsg, dummyCommunicationType)}).to.emitFrom(emitter, `send-non-reply`, {to: dummyTo, msg: dummyMsg, communicationType: dummyCommunicationType, result: emptyResult});
        });

        it('should return result.promise if result.promise is set', () => {
            const prom = new Promise(function() {});
            emitter.on(`send-non-reply`, (o) => {
                o.result.promise = prom;
            });

            expect(testee.sendNonReplyMessage(dummyTo, dummyMsg, dummyCommunicationType)).to.eql(prom);
        });

        it('should return result.promises wrapped in an all if result.promises is set', () => {
            const prom = new Promise(function() {});
            emitter.on(`send-non-reply`, (o) => {
                o.result.promises = [prom];
            });

            expect(testee.sendNonReplyMessage(dummyTo, dummyMsg, dummyCommunicationType)).to.eql(Promise.all([prom]));
        });
    });
});
