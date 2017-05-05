const EventEmitter = require(`events`);
import CourtbotError from './courtbotError';
import log4js from 'log4js';
import {COURTBOT_ERROR_TYPES} from './courtbotError';
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

      const wrappedErrors = _.map(errors, err => CourtbotError.wrap(err, { type: COURTBOT_ERROR_TYPES.API.GET, casenumber: casenumber }));

      if(errors.length) {
        logger.error(wrappedErrors);
        if(emitErrorEvent)  emitter.emit("retrieve-parties-error", wrappedErrors);
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
 * party: string hold the party to look up
 * options:
 *     emitErrorEvent - whether the retrieve-parties-error event is emitted with error information
 *     returnErrorsWithData - whether the error information is also returned along with the parties found { parties: [], errors: [] }
 */
export function getCasePartyEvents(casenumber, party, options) {
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
  emitter.emit("retrieve-party-events", casenumber, party, result);

  return wrapPromises(result.promises).then(results => {
      const errors = results.errors;
      const flattenedResults = _.flattenDeep(results.results);
      const wrappedErrors = _.map(errors, err => CourtbotError.wrap(err, { type: COURTBOT_ERROR_TYPES.API.GET, casenumber: casenumber }));
      
      if(errors.length) {
          logger.error(wrappedErrors);
          if (emitErrorEvent) emitter.emit(`retrieve-party-events-error`, wrappedErrors);
      }
      
      if(returnErrorsWithData) {
          return {
              errors: wrappedErrors,
              events: _.map([...flattenedResults], r => r)
          }
      } else {
          return _.map([...flattenedResults], r => r);
      }
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

export function verifyContact(contact, communicationType) {
  const result = {promises: []};
  logger.debug("Attempting to verify contact", {contact, communicationType});

  emitter.emit("verify-contact", {contact, communicationType, result});

  if(result.promise) {
    return result.promise;
  }

  if(result.promises.length) {
    return Promise.all(result.promises).then(x => x[0]);
  }

  return Promise.resolve(result);
}
