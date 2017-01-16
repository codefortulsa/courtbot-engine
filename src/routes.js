import express from "express";
import log4js from "log4js";
import { sendMessage } from "./twilio";
import completeOptions from "./defaultOptions";
import { registrationSourceFn, messageSourceFn } from "./sources";
import registrationState from "./registrationState";
import cbEvents from "./events";

export default function(opt) {
  var router = express.Router();
  var options = completeOptions(opt);

  var registrationSource = registrationSourceFn(options.dbUrl);
  var messageSource = messageSourceFn(options);

  registrationSource.migrate().then(() =>
    router.post("/", function(req,res,next) {
      var text = req.body.Body.toUpperCase().trim();
      var phone = req.body.From;

      registrationSource.getRegistrationsByPhone(phone)
        .then(registrations => {
          console.dir(registrations);
          var pendingRegistrations = registrations.filter(r => r.state != registrationState.REMINDING && r.state != registrationState.UNBOUND && r.state != registrationState.UNSUBSCRIBED);

          if(pendingRegistrations.length > 0) {
            var pending = pendingRegistrations[0];

            if(pending.state == registrationState.ASKED_PARTY) {
              cbEvents.getCaseParties(pending.case_number)
                .then(parties => {
                  var matching;
                  if(messageSource.isOrdinal(text)) {
                    var ord = messageSource.getOrdinal(text);
                    log4js.getLogger("sms-choose-party").info(`trying to choose party number: ${ord} (number of parties: ${parties.length})`);
                    if(ord > 0 && ord <= parties.length) {
                      matching = parties[ord - 1];
                    }else {
                      log4js.getLogger("sms-choose-party").info(`${ord} is out of range.`);
                    }
                  }

                  var candidates = parties.filter(p => p.name.toUpperCase().indexOf(text) >= 0);
                  if(candidates.length > 0) {
                    matching = candidates[0];
                  }

                  if(matching) {
                    registrationSource.updateRegistrationName(pending.registration_id, matching.name)
                      .then(() => sendMessage(messageSource.askReminder(phone, pending, matching), res))
                      .then(() => registrationSource.updateRegistrationState(pending.registration_id, registrationState.ASKED_REMINDER));
                    return;
                  } else {
                    log4js.getLogger("sms-choose-party").info(`did not find any parties for text: ${text}.`);
                  }

                });
            }
            else if(pending.state == registrationState.ASKED_REMINDER && messageSource.isYes(text)) {
              sendMessage(messageSource.confirmRegistration(phone, pending), res)
              .then(() => registrationSource.updateRegistrationState(pending.registration_id, registrationState.REMINDING));
              return;
            }
            else if(pending.state == registrationState.ASKED_REMINDER && messageSource.isNo(text)) {
              sendMessage(messageSource.cancelRegistration(phone, pending), res)
              .then(() => registrationSource.updateRegistrationState(pending.registration_id, registrationState.UNSUBSCRIBED));
              return;
            }
          }
          else {
            log4js.getLogger("sms-new-registration").info("Creating new registration...");
            registrationSource.createRegistration({
              phone,
              name: null,
              case_number: text,
              state: registrationState.UNBOUND
            })
            .then(id => registrationSource.getRegistrationById(id))
            .then(registration => cbEvents.getCaseParties(text).then(parties => {
              log4js.getLogger("sms-new-registration").info("parties found for new registration", parties);
              if(parties.length > 1) {
                log4js.getLogger("sms-new-registration").info("more than 1 party found!");
                return sendMessage(messageSource.askParty(phone, registration, parties), res)
                  .then(() => registrationSource.updateRegistrationState(registration.registration_id, registrationState.ASKED_PARTY));
              }
              else if(parties.length == 1) {
                log4js.getLogger("sms-new-registration").info("exactly one party found!")
                return registrationSource.updateRegistrationName(registration.registration_id, parties[0].name)
                  .then(() => sendMessage(messageSource.askReminder(phone, registration, parties[0]), res))
                  .then(() => registrationSource.updateRegistrationState(registration.registration_id, registrationState.ASKED_REMINDER));
              }
              else {
                return sendMessage(messageSource.noCaseMessage(text), res);
              }
            }))
            .catch(err => log4js.getLogger("sms-new-registration").info("Error occured during registration", err));
          }
        })
    })
  );

  return router;
}
