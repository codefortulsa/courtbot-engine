const EventEmitter = require(`events`);
import courtbotError from './courtbotError';
import log4js from 'log4js';
import {COURTBOT_ERROR_NAME, COURTBOT_ERROR_TYPES} from './courtbotError';
import {default as _} from 'lodash/array';

class CourtbotEmitter extends EventEmitter {}

const emitter = new CourtbotEmitter();

const logger = log4js.getLogger();

export default emitter;

/* casenumber: string holding the casenumber to look up
 * errorMode: 2-bit integer that determines how errors are handled:
 *     1s bit - whether the retrieve-parties-error event is emitted with error information
 *     2s bit - whether the error information is also returned along with the parties found { parties: [], errors: [] }
 */
export function getCaseParties(casenumber, errorMode = 1) {
  const result = {
    promises: []
  }

  // emit runs synchronously because I/O is not involved, so result will always be populated
  // before further functions are called.
  emitter.emit(`retrieve-parties`, casenumber, result);

  // Use a set to screen out exact duplicates
  let resultSet = new Set();
  let results = [];
  let errors = [];

  // instead of Promise.all(), use reduce() to catch all errors, but still return valid values
  return result.promises.reduce((chain, dataPromise) => {
    // First glue all the promises together with error handling...
    return chain.then(() => {
      return dataPromise;
    })
    .then((foundParties) => {
      // Soft Assert: foundParties is one of:
      //    * a string containing a CSV list of names
      //    * an object whose `name` property contains a CSV list of names
      //    * an array of objects whose `name` properties contains a CSV list of names
      if (typeof foundParties === `string`) {
        foundParties.split(`,`).forEach((elem) => {
          resultSet.add(elem.trim());
        });
      }
      else if (Object.prototype.toString.call(foundParties) === `[object Object]`) {
        if (foundParties.hasOwnProperty(`name`)) {
          foundParties.name.split(`,`).forEach((elem) => {
            resultSet.add(elem.trim());
          });
        }
        else {
          return Promise.reject(new courtbotError({ type: COURTBOT_ERROR_TYPES.API.GET, case: casenumber, timestamp: Date(), message: `Data object returned from API did not contain the "name" property` }));
        }
      }
      else if (Array.isArray(foundParties)) {
        foundParties = _.flattenDeep(foundParties);
        let faults = 0;

        // Attempt to add each element in the passed array before returning a rejected promise
        foundParties.forEach((elem) => {
          if (Object.prototype.toString.call(elem) === `[object Object]`) {
            if (elem.hasOwnProperty(`name`)) {
              elem.name.split(`,`).forEach((e) => {
                resultSet.add(e.trim());
              });
            }
            else {
              faults++;
            }
          }
          else {
            faults++;
          }
        });

        if (faults) return Promise.reject(new courtbotError({ type: COURTBOT_ERROR_TYPES.API.GET, case: casenumber, timestamp: Date(), message: `${faults} data items in array returned from API did not contain the "name" property` }));
      }
      else {
        return Promise.reject(new courtbotError({ type: COURTBOT_ERROR_TYPES.API.GET, case: casenumber, timestamp: Date(), message: `Data returned from API did not match allowed formats [CSV-string, { name: CSV-string }]` }));
      }
    })
    .catch((err) => {
      logger.warn(`events.js getCaseParties() data retrieval raw error on ` + Date() + `:`);
      logger.warn(err);

      // Wrap the errors if necessary
      if (err.name !== COURTBOT_ERROR_NAME) {
        let wrappedError = new courtbotError({ type: COURTBOT_ERROR_TYPES.API.GENERAL, case: casenumber, timestamp: Date(), initialError: typeof err === 'object' ? err : {data: err} });
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

    // Split the set back out into an array of { name: `party-name` }
    for (let i of resultSet) results.push({ name: i });

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
 *     1s bit - whether the retrieve-parties-error event is emitted with error information
 *     2s bit - whether the error information is also returned along with the parties found { parties: [], errors: [] }
 * ========================================
 * results: an array of {name: `partyname`}
 * errors: an array of courtbotErrors
 */
export function getCasePartyEvents(casenumber, party, errorMode = 1) {
  const result = {
    promises: []
  }

  // emit runs synchronously because I/O is not involved, so result will always be populated
  // before further functions are called.
  emitter.emit("retrieve-party-events", casenumber, party, result);

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
      logger.warn(`events.js getCasePartyEvents() data retrieval raw error on ` + Date() + `:`);
      logger.warn(err);

      // Wrap the errors if necessary
      if (err.name !== COURTBOT_ERROR_NAME) {
        let wrappedError = new courtbotError({ type: COURTBOT_ERROR_TYPES.API.GENERAL, case: casenumber, timestamp: Date(), initialError: typeof err === 'object' ? err : {data: err} });

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
  const result = {promises: []};
  logger.debug("Attempting to send message", {to, msg, communicationType});

  emitter.emit("send-non-reply", {to, msg, communicationType, result});

  if(result.promise) {
    return result.promise;
  }

  if(result.promises.length) {
    return Promise.all(result.promises);
  }

  return Promise.resolve(result);
}
