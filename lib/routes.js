"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (opt) {
  var router = _express2.default.Router();
  var options = (0, _defaultOptions2.default)(opt);

  var registrationSource = (0, _sources.registrationSourceFn)(options.dbUrl);
  var messageSource = (0, _sources.messageSourceFn)(options);

  registrationSource.migrate().then(function () {
    return router.post("/", function (req, res, next) {
      var text = req.body.Body.toUpperCase().trim();
      var phone = req.body.From;

      registrationSource.getRegistrationsByPhone(phone).then(function (registrations) {
        console.dir(registrations);
        var pendingRegistrations = registrations.filter(function (r) {
          return r.state != _registrationState.registrationState.REMINDING && r.state != _registrationState.registrationState.UNBOUND && r.state != _registrationState.registrationState.UNSUBSCRIBED;
        });

        if (pendingRegistrations.length > 0) {
          var pending = pendingRegistrations[0];

          if (pending.state == _registrationState.registrationState.ASKED_PARTY) {
            options.caseData.getCaseParties(pending.case_number).then(function (parties) {
              var matching;
              if (messageSource.isOrdinal(text)) {
                var ord = messageSource.getOrdinal(text);
                if (ord > 0 && ord <= parties.length) {
                  matching = parties[ord - 1];
                }
              }

              var candidates = parties.filter(function (p) {
                return p.name.toUpperCase().indexOf(text) >= 0;
              });
              if (candidates.length > 0) {
                matching = candidates[0];
              }

              if (matching) {
                registrationSource.updateRegistrationName(pending.registration_id, matching.name).then(function () {
                  return (0, _twilio.sendMessage)(messageSource.askReminder(phone, pending, matching), res);
                }).then(function () {
                  return registrationSource.updateRegistrationState(pending.registration_id, _registrationState.registrationState.ASKED_REMINDER);
                });
                return;
              }
            });
          } else if (pending.state == _registrationState.registrationState.ASKED_REMINDER && messageSource.isYes(text)) {
            (0, _twilio.sendMessage)(messageSource.confirmRegistration(phone, pending), res).then(function () {
              return registrationSource.updateRegistrationState(pending.registration_id, _registrationState.registrationState.REMINDING);
            });
            return;
          } else if (pending.state == _registrationState.registrationState.ASKED_REMINDER && messageSource.isNo(text)) {
            (0, _twilio.sendMessage)(messageSource.cancelRegistration(phone, pending), res).then(function () {
              return registrationSource.updateRegistrationState(pending.registration_id, _registrationState.registrationState.UNSUBSCRIBED);
            });
            return;
          }
        } else {
          registrationSource.createRegistration({
            phone: phone,
            name: null,
            case_number: text,
            state: _registrationState.registrationState.UNBOUND
          }).then(function (id) {
            return registrationSource.getRegistrationById(id);
          }).then(function (registration) {
            return options.caseData.getCaseParties(text).then(function (parties) {
              if (parties.length > 1) {
                return (0, _twilio.sendMessage)(messageSource.askParty(phone, registration, parties), res).then(function () {
                  return registrationSource.updateRegistrationState(registration.registration_id, _registrationState.registrationState.ASKED_PARTY);
                });
              } else if (parties.length == 1) {
                return registrationSource.updateRegistrationName(registration.registration_id, parties[0].name).then(function () {
                  return (0, _twilio.sendMessage)(messageSource.askReminder(phone, registration, parties[0]), res);
                }).then(function () {
                  return registrationSource.updateRegistrationState(registration.registration_id, _registrationState.registrationState.ASKED_REMINDER);
                });
              } else {
                return (0, _twilio.sendMessage)(messageSource.noCaseMessage(text), res);
              }
            });
          }).catch(function (err) {
            return console.log("Error:", err);
          });
        }
      });
    });
  });
};

var _express = require("express");

var _express2 = _interopRequireDefault(_express);

var _twilio = require("./twilio");

var _defaultOptions = require("./defaultOptions");

var _defaultOptions2 = _interopRequireDefault(_defaultOptions);

var _sources = require("./sources");

var _registrationState = require("./registrationState");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }