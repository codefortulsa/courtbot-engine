# courtbot-engine [![Build Status](https://travis-ci.org/codefortulsa/courtbot-engine.svg?branch=master)](https://travis-ci.org/codefortulsa/courtbot-engine)

This repository is the meat of the courtbot functionality, intended to be require'd by a project that wants to implement courtbot.

# Registration Source

In order to store and retreive registrations and sent-messages a registration source must be configured. The easiest way to do that is to use https://github.com/codefortulsa/courtbot-engine-pg to fill this role

TODO: example code

# Message Source

In order to send messages and interpret messages from the client, the engine requires a message source to be defined. This provides translations for all the message.

TODO: example code

# courtbot.addRoutes

The following example adds the necessary routes to your express app:

```js
courtbot.addRoutes(app, {
  path: "/sms",
  dbUrl: process.env.DATABASE_URL,
  caseData: {
    getCasePartyEvents: (caseNumber, partyName) => {},
    getCaseParties: (caseNumber) => {},
    refreshData: () => {}
  }
});
```

The `caseData` option should define three functions:

1. `getCaseParties`
1. `getCasePartyEvents`
1. `refreshData`

## getCaseParties

Given a case number, it must return a promise that resolves with the parties for the given case. For example:
 
```js
function getCaseParties(caseNumber) {
  return Promise.resolve([
    {name: "Mickey Mouse"}, {name: "Minnie Mouse"}
  ]);
}
```

## getCasePartyEvents

Given a case number and party name, it must return a promise that resolves with the events party's events (date and description). For example:

```js
function getCasePartyEvents(caseNumber, partyName) {
	return [{
	  date: "Thursday, December 22, 1982 at 9:00 AM",
     description: "PRELIMINARY HEARING ISSUE (PUBLIC DEFENDER)"
   }, {
	  date: "Thursday, December 31, 1982 at 9:00 AM",
     description: "PRELIMINARY HEARING ISSUE (PUBLIC DEFENDER)"
   }];
}
```

## refreshData

???

# Usage

## Express

To add courtbot routes to an epress route, the following code is used:

TODO: exmaple code

## Background Tasks

TODO
