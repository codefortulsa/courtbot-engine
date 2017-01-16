const EventEmitter = require('events');

class CourtbotEmitter extends EventEmitter {};

const emitter = new CourtbotEmitter();

export default emitter;

export function getCaseParties(casenumber) {
  const result = {
    promises: [],
    parties: []
  }
  emitter.emit("retrieve-parties", casenumber, result);

  return Promise.all(result.promises)
    .then(results => results.reduce((a,b) => a.concat(b), result.parties));
}

export function getCasePartyEvents(casenumber, party) {
  const result = {
    promises: [],
    events: []
  }
  emitter.emit("retrieve-party-events", casenumber, party, result);

  return Promise.all(result.promises)
    .then(results => results.reduce((a,b) => a.concat(b), result.events));
}
