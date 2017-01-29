import moment from "moment";
import completeOptions from "./defaultOptions";
import { registrationSourceFn, messageSourceFn } from "./sources";
import registrationState from "./registrationState";
import { getCaseParties, sendNonReplyMessage } from "./events";
import log4js from "log4js";

export default function(opt) {
  var options = completeOptions(opt);
  var registrationSource = registrationSourceFn(options.dbUrl);
  var messageSource = messageSourceFn(options);
  const logger = log4js.getLogger("checkMissingCases");
  logger.info("Checking for missing cases...");

  return registrationSource.getRegistrationsByState(registrationState.UNBOUND)
    .then(registrations => {
      return Promise.all(
        registrations.map(r =>
          getCaseParties(r.case_number)
            .then(parties => {
              logger.debug("parties returned from search:", parties);
              if(parties.length != 0) {
                if(moment(parties.create_date).diff(moment(), 'days') > options.UnboundTTL) {
                  return sendNonReplyMessage(r.phone, messageSource.expiredRegistration(r), options)
                    .then(() => registrationSource.updateRegistrationState(r.registration_id, registrationState.UNSUBSCRIBED));
                }
                else if(parties.length > 1) {
                  return sendNonReplyMessage(r.phone, messageSource.askParty(r.phone, r, parties), r.communication_type)
                    .then(() => registrationSource.updateRegistrationState(r.registration_id, registrationState.ASKED_PARTY));
                }
                else if(parties.length == 1) {
                  return registrationSource.updateRegistrationName(r.registration_id, parties[0].name)
                    .then(() => sendNonReplyMessage(r.phone, messageSource.askReminder(r.phone, r, parties[0]), r.communication_type))
                    .then(() => registrationSource.updateRegistrationState(r.registration_id, registrationState.ASKED_REMINDER));
                }
              }
            })
        )
      )
    });
}
