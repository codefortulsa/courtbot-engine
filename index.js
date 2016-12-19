var twilio = require("twilio");
var moment = require("moment");
var registrationSourceFn;
var messageSourceFn;

var registrationState = {
  UNBOUND: 0,
  ASKED_PARTY: 1,
  ASKED_REMINDER: 2,
  REMINDING: 3,
  UNSUBSCRIBED: 4
}

module.exports.registrationState = registrationState;

function getCompleteOptions(options) {
  return Object.assign({
    path: "/courtbot",
    dbUrl: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/courtbotdb"
  }, options);
}

function sendMessage(msg, res) {
  twiml = new twilio.TwimlResponse();
  twiml.sms(msg);
  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());

  return Promise.resolve(msg);
}

function sendNonReplyMessage(phone, message, opt) {
  return new Promise(function(resolve, reject) {
    var client = twilio(opt.twilioAccount, opt.twilioToken);
    client.sendMessage({to: phone, from: opt.twilioPhone, body: message}, function(err) {
      if(err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

module.exports.sendDueReminders = function(opt) {
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
      return options.caseData.getCasePartyEvents(r.casenumber, r.name)
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

module.exports.checkMissingCases = function(opt) {
  var options = completeOptions(opt);
  var registrationSource = registrationSourceFn(options.dbUrl);
  var messageSource = messageSourceFn(options);

  return registrationSource.getRegistrationsByState(registrationState.UNBOUND)
    .then(registrations => {
      Promise.all(
        registrations.map(r =>
          options.getCaseParties(r.case_number)
            .then(parties => {
              if(parties.length == 0) {
                if(moment(parties.create_date).diff(moment(), 'days') > options.UnboundTTL) {
                  return sendNonReplyMessage(r.phone, messageSource.expiredRegistration(r), options)
                    .then(() => registrationSource.updateRegistrationState(r.registration_id, registrationState.UNSUBSCRIBED));
                }
                else if(parties.length > 1) {
                  sendNonReplyMessage(r.phone, messageSource.askParty(r.phone, registration, parties), options)
                    .then(() => registrationSource.updateRegistrationState(registration.registration_id, registrationState.ASKED_PARTY));
                }
                else if(parties.length == 1) {
                  registrationSource.updateRegistrationName(registration.registration_id, parties[0].name)
                    .then(() => sendNonReplyMessage(r.phone, messageSource.askReminder(r.phone, registration, parties[0]), options))
                    .then(() => registrationSource.updateRegistrationState(registration.registration_id, registrationState.ASKED_REMINDER));
                }
              }
            })
        )
      )
    });
}

module.exports.addRoutes = function(app, options) {

  var completeOptions = getCompleteOptions(options);

  var registrationSource = registrationSourceFn(options.dbUrl);
  var messageSource = messageSourceFn(options);

  app.use(completeOptions.path, function(req,res,next) {
    var text = req.body.Body.toUpperCase().trim();
    var phone = req.body.From;

    registrationSource.getRegistrationsByPhone(phone)
      .then(registrations => {
        console.dir(registrations);
        var pendingRegistrations = registrations.filter(r => r.state != registrationState.REMINDING && r.state != registrationState.UNBOUND && r.state != registrationState.UNSUBSCRIBED);

        if(pendingRegistrations.length > 0) {
          var pending = pendingRegistrations[0];

          if(pending.state == registrationState.ASKED_PARTY) {
            options.caseData.getCaseParties(pending.case_number)
              .then(parties => {
                if(messageSource.isOrdinal(text)) {
                  var ord = messageSource.getOrdinal(text);
                  var matching;

                  if(ord > 0 && ord <= parties.length) {
                    matching = parties[ord - 1];
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
                  }
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
          registrationSource.createRegistration({
            phone,
            name: null,
            case_number: text,
            state: registrationState.UNBOUND
          })
          .then(id => registrationSource.getRegistrationById(id))
          .then(registration => options.caseData.getCaseParties(text).then(parties => {
            if(parties.length > 1) {
              return sendMessage(messageSource.askParty(phone, registration, parties), res)
                .then(() => registrationSource.updateRegistrationState(registration.registration_id, registrationState.ASKED_PARTY));
            }
            else if(parties.length == 1) {
              return registrationSource.updateRegistrationName(registration.registration_id, parties[0].name)
                .then(() => sendMessage(messageSource.askReminder(phone, registration, parties[0]), res))
                .then(() => registrationSource.updateRegistrationState(registration.registration_id, registrationState.ASKED_REMINDER));
            }
            else {
              return sendMessage(messageSource.noCaseMessage(text), res);
            }
          }))
          .catch(err => console.log("Error:", err));
        }
      })
  });
}

module.exports.setRegistrationSource = function(sourceFn) {
  registrationSourceFn = sourceFn;
}

module.exports.setMessageSource = function(sourceFn) {
  messageSourceFn = sourceFn;
}
