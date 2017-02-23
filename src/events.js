const EventEmitter = require(`events`);
import courtbotError from './courtbotError';
import log4js from 'log4js';
import {COURTBOT_ERROR_NAME, COURTBOT_ERROR_TYPES} from './courtbotError';
import _ from "lodash";

class CourtbotEmitter extends EventEmitter {}

const emitter = new CourtbotEmitter();

const logger = log4js.getLogger();

export default emitter;

function wrapPromises(promises) {
    const wrappedPromises = promises
        .map(p => p.then(r => ({result: r})).catch(e => ({error: e})));

    //Now Promise.all will return all success/errors
    return Promise.all(wrappedPromises).then(resultObjects => {
        return resultObjects.reduce((aggregate, item) => {
            item.error
                ? aggregate.errors.push(item.error)
                : aggregate.results.push(item.result);

            return aggregate;
        }, {errors: [], results: []});
    });
}

/* casenumber: string holding the casenumber to look up
 * options:
 *     emitErrorEvent - whether the retrieve-parties-error event is emitted with error information
 *     returnErrorsWithData - whether the error information is also returned along with the parties found { parties: [], errors: [] }
 */
export function getCaseParties(casenumber, options) {
  const result = {
    promises: []
  }

  const {emitErrorEvent, returnErrorsWithData} =
      Object.assign(
        {emitErrorEvent: true, returnErrorsWithData: false},
        options
      );

  // emit runs synchronously because I/O is not involved, so result will always be populated
  // before further functions are called.
  emitter.emit(`retrieve-parties`, casenumber, result);

  return wrapPromises(result.promises).then(results => {
      // Use a set to screen out exact duplicates
      const resultSet = new Set();

      const errors = results.errors;

      //flatten the result sets (change [[a, b], c, d] to [a, b, c, d])
      var flattenedData = _.flattenDeep(results.results);

      flattenedData.forEach(party => {
          //each item can be a string or an object with a name
          //property
          if(!party || party === "") {
              errors.push({ message: "Party cannot be empty" })
          } else if(party.hasOwnProperty("name") && (typeof party) !== "function") {
              resultSet.add(party.name.trim());
          } else if ((typeof party) === "string") {
              resultSet.add(party.trim());
          } else {
              errors.push({ message: "Error parsing party", object: party});
          }
      });

      const wrappedErrors = _.map(errors, err => new courtbotError({ type: COURTBOT_ERROR_TYPES.API.GET, case: casenumber, timestamp: Date(), initialError: typeof err === 'object' ? err : {data: err} }));

      if(errors.length) {
        logger.error(wrappedErrors);
        if(emitErrorEvent) emitter.emit("retrieve-parties-error", wrappedErrors);
      }

      if(returnErrorsWithData) {
        return {
          errors: wrappedErrors,
          parties: _.map([...resultSet], r => ({name: r}))
        };
      } else {
        return _.map([...resultSet], r => ({name: r}));
      }
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
