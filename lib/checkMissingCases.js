"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkMissingCases = checkMissingCases;

var _moment = require("moment");

var _moment2 = _interopRequireDefault(_moment);

var _twilio = require("./twilio");

var _defaultOptions = require("./defaultOptions");

var _defaultOptions2 = _interopRequireDefault(_defaultOptions);

var _sources = require("./sources");

var _registrationState = require("./registrationState");

var _registrationState2 = _interopRequireDefault(_registrationState);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function checkMissingCases(opt) {
  var options = (0, _defaultOptions2.default)(opt);
  var registrationSource = (0, _sources.registrationSourceFn)(options.dbUrl);
  var messageSource = (0, _sources.messageSourceFn)(options);

  return registrationSource.getRegistrationsByState(_registrationState2.default.UNBOUND).then(function (registrations) {
    return Promise.all(registrations.map(function (r) {
      return options.getCaseParties(r.case_number).then(function (parties) {
        if (parties.length != 0) {
          if ((0, _moment2.default)(parties.create_date).diff((0, _moment2.default)(), 'days') > options.UnboundTTL) {
            return (0, _twilio.sendNonReplyMessage)(r.phone, messageSource.expiredRegistration(r), options).then(function () {
              return registrationSource.updateRegistrationState(r.registration_id, _registrationState2.default.UNSUBSCRIBED);
            });
          } else if (parties.length > 1) {
            (0, _twilio.sendNonReplyMessage)(r.phone, messageSource.askParty(r.phone, registration, parties), options).then(function () {
              return registrationSource.updateRegistrationState(registration.registration_id, _registrationState2.default.ASKED_PARTY);
            });
          } else if (parties.length == 1) {
            registrationSource.updateRegistrationName(registration.registration_id, parties[0].name).then(function () {
              return (0, _twilio.sendNonReplyMessage)(r.phone, messageSource.askReminder(r.phone, registration, parties[0]), options);
            }).then(function () {
              return registrationSource.updateRegistrationState(registration.registration_id, _registrationState2.default.ASKED_REMINDER);
            });
          }
        }
      });
    }));
  });
}