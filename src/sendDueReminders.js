import moment from "moment";
import { sendNonReplyMessage } from "./events";
import completeOptions from "./defaultOptions";
import { registrationSourceFn } from "./sources";
import registrationState from "./registrationState";
import {getCasePartyEvents} from "./events";
import log4js from "log4js";
import messaging from "./messaging";

const log = log4js.getLogger("send-due-reminders");

export default function(opt) {
  var options = completeOptions(opt);
  var registrationSource = registrationSourceFn(options.dbUrl);

  return registrationSource.getRegistrationsByState(registrationState.REMINDING)
  .then(registrations => {
    if(registrations.length == 0) {
      log.info("No records to process.");
      return;
    }
    return Promise.all(registrations.map(r => {
      return getCasePartyEvents(r.case_number, r.name)
        .then(events => events.filter(x => {
          var theDate = isNaN(moment(x.date)) ? moment(x.date.replace(" at ", " "), "dddd, MMMM D, YYYY h:mm A") : moment(x.date);
          var theDiff = theDate.diff(moment(), 'days');
          log.debug(`Event at ${theDiff} days out.`);
          return theDiff < options.reminderDaysOut && theDiff > 0;
        }))
        .then(events => {
          return Promise.all(events.map(e => {
            return registrationSource.getSentMessage(r.contact, r.communication_type, r.name, e.date, e.description)
              .then(d => {
                if(d.length == 0) {
                  var message = messaging.reminder(r, e);
                  return sendNonReplyMessage(r.phone, message, r.communication_type)
                    .then(() => registrationSource.createSentMessage(r.contact, r.communication_type, r.name, e.date, e.description));
                } else {
                  log.info("already sent ", messaging.reminder(r, e), "to", r.phone);
                }
              })
          }));
        })
        .catch(err => log.error("Error sending reminders for " + r.casenumber + ": " + err.toString()))
    }))
  });
}
