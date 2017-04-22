import moment from "moment-timezone";
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
          var theDate = isNaN(moment(x.date)) ? moment(x.date.replace(" at ", " "), "dddd, MMMM D, YYYY h:mm A") : moment(x.date).tz(options.timeZoneName || "America/Chicago");
          var theDiff = theDate.diff(moment(), 'days', true);

          x.date = theDate.format("LLL");

          var isInReminderPeriod = theDiff < options.reminderDaysOut && theDiff >= 0;

          log.debug(`Event at ${theDiff} days out, which ${isInReminderPeriod ? "is" : "is not"} in the reminder period of ${options.reminderDaysOut}.`);

          return isInReminderPeriod;
        }))
        .then(events => {
          return Promise.all(events.map(e => {
            return registrationSource.getSentMessage(r.contact, r.communication_type, r.name, e.date, e.description, r.case_number)
              .then(d => {
                if(d.length == 0) {
                  var message = messaging.reminder(r, e);
                  return sendNonReplyMessage(r.contact, message, r.communication_type)
                    .then(() => registrationSource.createSentMessage(r.contact, r.communication_type, r.name, e.date, e.description, r.case_number));
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
