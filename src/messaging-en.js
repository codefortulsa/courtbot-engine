import emitter from "./events";

emitter.on("courtbot-messaging-remote", evt =>
evt.message = `You've been signed up for court case reminders by ${evt.user} for court case ${evt.case_number} for party ${evt.name}.
Would you like a courtesy reminder the day before any events? (reply YES or NO)`);

emitter.on("courtbot-messaging-reminder", evt =>
evt.message = `Reminder: It appears you have an event on ${evt.evt.date}
description: ${evt.evt.description}. You should confirm your case date and time by going to ${process.env.COURT_PUBLIC_URL}. - ${process.env.COURTBOT_TITLE}`);

emitter.on("courtbot-messaging-ask-reminder", evt =>
evt.message = `We found a case for ${evt.party.name}. Would you like a courtesy reminder the day before any events? (reply YES or NO)`);

emitter.on("courtbot-messaging-ask-party", evt =>
evt.message = `We found a case for multiple parties, please specify which party you are by entering the number shown:

${evt.parties.map((p, i) => `${i + 1} - ${p.name}
`).join("")}`);

emitter.on("courtbot-messaging-expired-registration", evt =>
evt.message = `We haven't been able to find your court case. You can go to ${process.env.process.env.COURT_PUBLIC_URL} for more information. - ${process.env.COURTBOT_TITLE}`);

emitter.on("courtbot-messaging-confirm-registration", evt =>
evt.message = `We'll attempt to send you a reminder for any upcoming events related to the case.`)

emitter.on("courtbot-messaging-cancel-registration", evt =>
evt.message = `Registration cancelled.`);

emitter.on("courtbot-messaging-is-ordinal", evt => evt.result = parseInt(evt.text) > 0)
emitter.on("courtbot-messaging-get-ordinal", evt => evt.result = parseInt(evt.text))
emitter.on("courtbot-messaging-is-yes", evt => evt.result = evt.text.trim().toUpperCase() === "YES")
emitter.on("courtbot-messaging-is-no", evt => evt.result = evt.text.trim().toUpperCase() === "NO")

emitter.on("courtbot-messaging-no-case-message", () => null); //NEEDS MESSAGE!

emitter.on("courtbot-messaging-bad-message", evt => evt.message = `I'm sorry, we couldn't understand "${evt.text}".

${evt.lastMessage}`);
