/* Module containing an extension of the Error class for courtbot Specific purposes */
// See https://www.bennadel.com/blog/2828-creating-custom-error-objects-in-node-js-with-error-capturestacktrace.htm

export const COURTBOT_ERROR_NAME = `Courtbot Error`;

export default class courtbotError extends Error {
  constructor(settings = {}, context) {
    super();

    settings = settings || {};

    this.name = COURTBOT_ERROR_NAME;
    this.type = settings.type || `general`;
    this.message = settings.message || `No message listed`;
    this.case = settings.case || `No case listed`;
    this.api = settings.api || `No api listed`;
    this.timestamp = settings.timestamp || `No timestamp listed`;
    this.initialError = settings.initialError || null;
    this.isCourtbotError = true; // undefined values are falsy

    Error.captureStackTrace(this, (context || courtbotError));
  }
}