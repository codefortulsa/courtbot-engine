
import log4js from "log4js";
const EventEmitter = require(`events`);
import courtbotError from '../src/courtbotError'
import {COURTBOT_ERROR_NAME} from '../src/courtbotError';

const logger = log4js.getLogger("events");

class CourtbotEmitter extends EventEmitter {}

const emitter = new CourtbotEmitter();

export default emitter;

/* casenumber: string holding the casenumber to look up
 * errorMode: 2-bit integer that determines how errors are handled:
 * 1s bit - whether the retrieve-parties-error event is emitted with error information
 * 2s bit - whether the error information is also returned along with the parties found { parties: [], errors: [] }
 */
export function getCaseParties(casenumber, errorMode = 1) {
  const result = {
    promises: []
  }

  // emit runs synchronously because I/O is not involved, so result will always be populated
  // before Promise.all() is called.
  emitter.emit(`retrieve-parties`, casenumber, result);

  let results = [];
  let errors = [];

  // instead of Promise.all(), use reduce() to catch all errors, but still return valid values
  return result.promises.reduce((chain, dataPromise) => {
    // First with glue all the promises together with error handling...
    return chain.then(() => {
      return dataPromise;
    })
    .then((foundParties) => {
      results = results.concat(foundParties);
    })
    .catch((err) => {
      // Raw logging - just to console, not log4js to keep dependencies low
      console.warn(`events.js getCaseParties() data retrieval raw error on ` + Date() + `:`);
      console.warn(err);

      // Wrap the errors if necessary
      if (err.name !== COURTBOT_ERROR_NAME) {
        let wrappedError = new courtbotError({ type: `api-retrieval-error`, initialError: typeof err === 'object' ? err : {data: err} });
        errors = errors.concat(wrappedError);
      }
      else {
        errors = errors.concat(err);
      }
      
      return true;
    });
  }, Promise.resolve())
  // ... then we return the results
  .then(() => {
    // Emit the retrieve-parties-error first. Like retrieve-parties, it runs synchronously because there's no I/O
    if (errorMode % 2) emitter.emit(`retrieve-parties-error`, errors);
    // Add the errors to the return value if dictated by errorMode
    if ((errorMode >> 1) % 2) {
      results = {
        parties: results,
        errors: errors
      }
    }
    return results;
  });
}

/* casenumber: string holding the casenumber to look up
 * party: string holding the party name to look up
 * errorMode: 2-bit integer that determines how errors are handled:
 * 1s bit - whether the retrieve-parties-error event is emitted with error information
 * 2s bit - whether the error information is also returned along with the parties found { parties: [], errors: [] }
 */
export function getCasePartyEvents(casenumber, party, errorMode = 1) {
  const result = {
    promises: []
  }

  // emit runs synchronously because I/O is not involved, so result will always be populated
  // before Promise.all() is called.
  emitter.emit("retrieve-party-events", casenumber, party, result);

  let results = [];
  let errors = [];

/*  return Promise.all(result.promises)
    .then(results => results.reduce((a,b) => a.concat(b), [])); */

  // instead of Promise.all(), use reduce() to catch all errors, but still return valid values
  return result.promises.reduce((chain, dataPromise) => {
    // First with glue all the promises together with error handling...
    return chain.then(() => {
      return dataPromise;
    })
    .then((foundParties) => {
      results = results.concat(foundParties);
    })
    .catch((err) => {
      // Raw logging - just to console, not log4js to keep dependencies low
      console.warn(`events.js getCasePartyEvents() data retrieval raw error on ` + Date() + `:`);
      console.warn(err);

      // Wrap the errors if necessary
      if (err.name !== COURTBOT_ERROR_NAME) {
        let wrappedError = new courtbotError({ type: `api-retrieval-error`, initialError: typeof err === 'object' ? err : {data: err} });

        errors = errors.concat(wrappedError);
      }
      else {
        errors = errors.concat(err);
      }
      
      return true;
    });
  }, Promise.resolve())
  // ... then we return the results
  .then(() => {
    // Emit the retrieve-parties-error first. Like retrieve-parties, it runs synchronously because there's no I/O
    if (errorMode % 2) emitter.emit(`retrieve-party-events-error`, errors);
    // Add the errors to the return value if dictated by errorMode
    if ((errorMode >> 1) % 2) {
      results = {
        events: results,
        errors: errors
      }
    }
    return results;
  });
}

export function sendNonReplyMessage(to, msg, communicationType) {
  const result = {};
  logger.debug("Attempting to send message", {to, msg, communicationType});
  
  emitter.emit("send-non-reply", {to, msg, communicationType, result});

  if(result.promise) {
    return result.promise;
  }

  if(result.promises) {
    return Promise.all(result.promises);
  }

  return Promise.resolve(result);
}
