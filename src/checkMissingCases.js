import moment from "moment";
import { sendNonReplyMessage } from "./twilio";
import completeOptions from "./defaultOptions";
import { registrationSourceFn, messageSourceFn } from "./sources";
import registrationState from "./registrationState";
import { getCaseParties } from "./events";

export function checkMissingCases(opt) {
  var options = completeOptions(opt);
  var registrationSource = registrationSourceFn(options.dbUrl);
  var messageSource = messageSourceFn(options);

  return registrationSource.getRegistrationsByState(registrationState.UNBOUND)
    .then(registrations => {
      return Promise.all(
        registrations.map(r =>
          getCaseParties(r.case_number)
            .then(parties => {
              if(parties.length != 0) {
                if(moment(parties.create_date).diff(moment(), 'days') > options.UnboundTTL) {
                  return sendNonReplyMessage(r.phone, messageSource.expiredRegistration(r), options)
                    .then(() => registrationSource.updateRegistrationState(r.registration_id, registrationState.UNSUBSCRIBED));
                }
                else if(parties.length > 1) {
                  sendNonReplyMessage(r.phone, messageSource.askParty(r.phone, r, parties), options)
                    .then(() => registrationSource.updateRegistrationState(r.registration_id, registrationState.ASKED_PARTY));
                }
                else if(parties.length == 1) {
                  registrationSource.updateRegistrationName(r.registration_id, parties[0].name)
                    .then(() => sendNonReplyMessage(r.phone, messageSource.askReminder(r.phone, r, parties[0]), options))
                    .then(() => registrationSource.updateRegistrationState(r.registration_id, registrationState.ASKED_REMINDER));
                }
              }
            })
        )
      )
    });
}
