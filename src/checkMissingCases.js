import moment from "moment";
import completeOptions from "./defaultOptions";
import { registrationSourceFn } from "./sources";
import registrationState from "./registrationState";
import { getCaseParties, sendNonReplyMessage } from "./events";
import log4js from "log4js";
import messaging from "./messaging";

export default function(opt) {
  var options = completeOptions(opt);
  var registrationSource = registrationSourceFn(options.dbUrl);
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
                if(parties.length > 1) {
                  logger.debug("Multiple parties found.");
                  return sendNonReplyMessage(r.contact, messaging.askParty(r.contact, r, parties), r.communication_type)
                    .then(() => registrationSource.updateRegistrationState(r.registration_id, registrationState.ASKED_PARTY));
                }
                else if(parties.length == 1) {
                  logger.debug("Single party found");
                  return registrationSource.updateRegistrationName(r.registration_id, parties[0].name)
                    .then(() => sendNonReplyMessage(r.contact, messaging.askReminder(r.contact, r, parties[0]), r.communication_type))
                    .then(() => registrationSource.updateRegistrationState(r.registration_id, registrationState.ASKED_REMINDER));
                }
              } else if(moment(parties.create_date).diff(moment(), 'days') > options.UnboundTTL) {
                logger.debug("Expired registration found.");
                return sendNonReplyMessage(r.phone, messaging.expiredRegistration(r), options)
                  .then(() => registrationSource.updateRegistrationState(r.registration_id, registrationState.UNSUBSCRIBED));
              }
            })
        )
      )
    }).catch(err => logger.error("Error checking missing cases:", err));
}
