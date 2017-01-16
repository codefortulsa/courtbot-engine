"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (opt) {
  var options = (0, _defaultOptions2.default)(opt);
  var registrationSource = (0, _sources.registrationSourceFn)(options.dbUrl);
  var messageSource = (0, _sources.messageSourceFn)(options);

  return registrationSource.getRegistrationsByState(_registrationState2.default.REMINDING).then(function (registrations) {
    if (registrations.length == 0) {
      console.log("No records to process.");
      return;
    }
    return Promise.all(registrations.map(function (r) {
      return (0, _events.getCasePartyEvents)(r.casenumber, r.name).then(function (events) {
        return events.filter(function (x) {
          var theDate = (0, _moment2.default)(x.date.replace(" at ", " "), "dddd, MMMM D, YYYY h:mm A");
          var theDiff = theDate.diff((0, _moment2.default)(), 'days');
          return theDiff < options.reminderDaysOut && theDiff > 0;
        });
      }).then(function (events) {
        return Promise.all(events.map(function (e) {
          return registrationSource.getSentMessage(r.phone, r.name, e.date, e.description).then(function (d) {
            if (d.length == 0) {
              var message = messages.reminder(r, e);
              return (0, _twilio.sendNonReplyMessage)(r.phone, message, options).then(function () {
                return registrationSource.createSentMessage(r.phone, r, name, e.date, e.description);
              });
            } else {
              console.log("already sent ", messages.reminder(r, e), "to", r.phone);
            }
          });
        }));
      }).catch(function (err) {
        return console.log("Error sending reminders for " + r.casenumber + ": " + err.toString());
      });
    }));
  });
};

var _moment = require("moment");

var _moment2 = _interopRequireDefault(_moment);

var _twilio = require("./twilio");

var _defaultOptions = require("./defaultOptions");

var _defaultOptions2 = _interopRequireDefault(_defaultOptions);

var _sources = require("./sources");

var _registrationState = require("./registrationState");

var _registrationState2 = _interopRequireDefault(_registrationState);

var _events = require("./events");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }