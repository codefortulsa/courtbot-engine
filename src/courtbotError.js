/* Module containing an extension of the Error class for courtbot-specific purposes
 * Extended from https://www.bennadel.com/blog/2828-creating-custom-error-objects-in-node-js-with-error-capturestacktrace.htm */

export const COURTBOT_ERROR_NAME = `Courtbot Error`;

const API = Object.freeze({ 'GENERAL': `api-error--general`, 'GET': `api-error--get`, 'UNKNOWN': `api-error--unknown`});
const GENERAL = Object.freeze({ 'GENERAL': `general--general` });

export const COURTBOT_ERROR_TYPES = Object.freeze({ 'API': API, 'GENERAL': GENERAL });

export default class CourtbotError extends Error {
  constructor(settings = {}, context) {
    super();

    settings = settings || {};

    this.name = COURTBOT_ERROR_NAME;
    this.type = settings.type || COURTBOT_ERROR_TYPES.GENERAL.GENERAL;
    this.message = settings.message || `No message listed`;
    // Backwards support for CourtbotError.case
    if (settings.casenumber !== undefined) {
      this.casenumber = settings.casenumber;
    } else {
      this.casenumber = settings.case || `No casenumber listed`;
    }
    this.api = settings.api || `No api listed`;
    this.timestamp = settings.timestamp || `No timestamp listed`;
    this.initialError = settings.initialError || null;
    this.isCourtbotError = true; // undefined values are falsy

    // Backwards support for CourtbotError.case
    Object.defineProperty(this, `case`, {get: () => this.casenumber, set: (val) => { this.casenumber = val; }});

    Error.captureStackTrace(this, (context || CourtbotError));
  }

  // If I'm passed a non-courtbot error, I return a new courtbot error with the initial data in this.initialError
  // Otherwise I just return the error.
  static wrap(err, options = {}) {
    // Backwards support for CourtbotError.case
    if (options.case !== undefined && options.casenumber === undefined) options.casenumber = options.case;

    // Add a timestamp of now if one is not present. Otherwise, allow missing options to be set to undefined. The constructor will handle them
    const {type, api, message, casenumber, timestamp} = 
      Object.assign(
        { timestamp: Date() }, options
      );
    
    if(err.name !== COURTBOT_ERROR_NAME) {
      return new CourtbotError({ type: type, casenumber: casenumber, api: api, message: message, timestamp: timestamp, initialError: typeof err === 'object' ? err : {data: err} });
    }
    return err;
  }
}