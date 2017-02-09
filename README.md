# courtbot-engine [![Build Status](https://travis-ci.org/codefortulsa/courtbot-engine.svg?branch=master)](https://travis-ci.org/codefortulsa/courtbot-engine) [![npm](https://img.shields.io/npm/v/courtbot-engine.svg)](https://www.npmjs.com/package/courtbot-engine) [![npm](https://img.shields.io/npm/dt/courtbot-engine.svg)](https://www.npmjs.com/package/courtbot-engine) [![Coverage Status](https://coveralls.io/repos/github/codefortulsa/courtbot-engine/badge.svg?branch=master)](https://coveralls.io/github/codefortulsa/courtbot-engine?branch=master)

This repository is the meat of the courtbot functionality, intended to be require'd by a project that wants to implement courtbot.

# Registration Source

In order to store and retreive registrations and sent-messages a registration source must be configured. The easiest way to do that is to use https://github.com/codefortulsa/courtbot-engine-pg to fill this role.

Example code to fulfill this requirement:
``` js
var courtbot = require("courtbot-engine");

courtbot.setRegistrationSource(function(connectionString) {
  return {
    getRegistrationById: function (id) {
      /* return the registration with the id provided */
      return Promise.resolve(regs);
    },
    getRegistrationsByContact: function(contact, communicationType) {
      /* return all registrations that are for the contact and type provided */
      return Promise.resolve(regs);
    },
    getRegistrationsByState: function (state) {
      /* return all registrations in the given state */
      return Promise.resolve(regs);
    },
    createRegistration: function (registration) {
      /* create a new registration and return its id */
      return Promise.resolve(1);
    },
    updateRegistrationName: function (id, name) {
      /* update the registration to the name provided */
      return Promise.resolve();
    },
    updateRegistrationState: function (id, state) {
      /* update the registration to state provided */
      return Promise.resolve();
    },

    getSentMessage: function (contact, communication_type, date, description) {
      /* get a matching sent message if it exists */
      return Promise.resolve(msg);
    },
    createSentMessage: function (contact, communication_type, date, description) {
      /* create a record of the sent message */
      return Promise.resolve();
    },
    migrate: function() {
      /* migrate to the most recent schema */
      return Promise.resolve();
    }
  };
});
```

# Message Source

In order to send messages and interpret messages from the client, the engine requires a message source to be defined. This provides translations for all the messages.

Example code to fulfill this requirement:
``` js
var courtbot = require('courtbot-engine');

courtbot.setMessageSource(() => ({
  remote: function(user, case_number, name) {
    return "...";
  },
  reminder: function(reg, evt) {
    return "...";
  },
  askReminder: function(phone, registration, party) {
    return "...";
  },
  noCaseMessage: function(caseNumber) {
    return "...";
  },
  askPartyAgain: function(text, phone, registration, parties){
    return "...";
  },
  askParty: function(phone, registration, parties) {
    return "...";
  },
  expiredRegistration: function() {
    return "...";
  },
  confirmRegistration: function(phone, pending) {
    return "...";
  },
  cancelRegistration: function(phone, pending) {
    return "...";
  },
  isOrdinal: function(text) {
    return parseInt(text) > 0;
  },
  getOrdinal: function(text) {
    return parseInt(text);
  },
  isYes: function(text) {
    return text == "YES";
  },
  isNo: function(text) {
    return text == "NO";
  }
}));
```

# Communication

For courtbot to talk to someone via a communication method, you have to add that method.  The following methods exist:

* SMS: [courtbot-engine-twilio](https://github.com/codefortulsa/courtbot-engine-twilio) or you can get it from [NPM](https://www.npmjs.com/package/courtbot-engine-twilio)

# Usage

## Express

The following example adds the necessary routes to your express app:

```js
app.use("/", courtbot.routes({ dbUrl: process.env.DATABASE_URL });
```

## Console test prompt

To enable the console prompt in a local courbot instance, set the environment variable USE_CONSOLE=1. This will allow you to communicate with courtbot without using twilio.

## Background Tasks

The following functions should be run on a regular basis, at least once per day:

* ```sendDueReminders(options)``` - Sends reminders for cases that are within the reminder period.
* ```checkMissingCases(options)``` - Looks for cases that were not initially found.
