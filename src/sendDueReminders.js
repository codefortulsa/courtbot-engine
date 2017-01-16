import moment from "moment";
import { sendNonReplyMessage } from "./twilio";
import completeOptions from "./defaultOptions";
import { registrationSourceFn, messageSourceFn } from "./sources";
import registrationState from "./registrationState";
import {getCaseParties, getCasePartyEvents} from "./events";

export default function(opt) {
  var options = completeOptions(opt);
  var registrationSource = registrationSourceFn(options.dbUrl);
  var messageSource = messageSourceFn(options);

  return registrationSource.getRegistrationsByState(registrationState.REMINDING)
  .then(registrations => {
    if(registrations.length == 0) {
      console.log("No records to process.");
      return;
    }
    return Promise.all(registrations.map(r => {
      return getCasePartyEvents(r.casenumber, r.name)
        .then(events => events.filter(x => {
          var theDate = moment(x.date.replace(" at ", " "), "dddd, MMMM D, YYYY h:mm A");
          var theDiff = theDate.diff(moment(), 'days');
          return theDiff < options.reminderDaysOut && theDiff > 0;
        }))
        .then(events => {
          return Promise.all(events.map(e => {
            return registrationSource.getSentMessage(r.phone, r.name, e.date, e.description)
              .then(d => {
                if(d.length == 0) {
                  var message = messages.reminder(r, e);
                  return sendNonReplyMessage(r.phone, message, options)
                    .then(() => registrationSource.createSentMessage(r.phone, r,name, e.date, e.description));
                } else {
                  console.log("already sent ", messages.reminder(r, e), "to", r.phone);
                }
              })
          }));
        })
        .catch(err => console.log("Error sending reminders for " + r.casenumber + ": " + err.toString()))
    }))
  });
}
