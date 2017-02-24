import emitter from "./events";

export const noMessage = "NO MESSAGE PROVIDED";

export function remote(user, case_number, name) {
  const evt = {user, case_number, name, message: noMessage};
  emitter.emit("courtbot-messaging-remote", evt);
  return evt.message;
}

export function reminder(reg, evt) {
  const evnt = {reg, evt, message: noMessage};
  emitter.emit("courtbot-messaging-reminder", evnt);
  return evnt.message;
}

export function askReminder(phone, registration, party) {
  const evt = {phone, registration, party, message: noMessage};
  emitter.emit("courtbot-messaging-ask-reminder", evt);
  return evt.message;
}

export function noCaseMessage(caseNumber) {
  const evt = {caseNumber, message: noMessage};
  emitter.emit("courtbot-messaging-no-case-message", evt);
  return evt.message;
}

export function askParty(phone, registration, parties) {
  const evt = {phone, registration, parties, message: noMessage};
  emitter.emit("courtbot-messaging-ask-party", evt);
  return evt.message;
}

export function expiredRegistration() {
  const evt = {message: noMessage};
  emitter.emit("courtbot-messaging-expired-registration", evt);
  return evt.message;
}

export function confirmRegistration(phone, pending) {
  const evt = {phone, pending, message: noMessage};
  emitter.emit("courtbot-messaging-confirm-registration", evt);
  return evt.message;
}

export function cancelRegistration(phone, pending) {
  const evt = {phone, pending, message: noMessage};
  emitter.emit("courtbot-messaging-cancel-registration", evt);
  return evt.message;
}

export function isOrdinal(text) {
  const evt = {text, result: false};
  emitter.emit("courtbot-messaging-is-ordinal", evt);
  return evt.result;
}

export function getOrdinal(text) {
  const evt = {text, result: 0};
  emitter.emit("courtbot-messaging-get-ordinal", evt);
  return evt.result;
}

export function isYes(text) {
  const evt = {text, result: false};
  emitter.emit("courtbot-messaging-is-yes", evt);
  return evt.result;
}

export function isNo(text) {
  const evt = {text, result: false};
  emitter.emit("courtbot-messaging-is-no", evt);
  return evt.result;
}

export function badMessage(text, lastMessage) {
  const evt = {text, lastMessage, message: noMessage};
  emitter.emit("courtbot-messaging-bad-message", evt);
  return evt.message;
}

const messaging = {
  noMessage,

  remote,
  reminder,
  askReminder,
  noCaseMessage,
  askParty,
  expiredRegistration,
  confirmRegistration,
  cancelRegistration,

  isOrdinal,
  getOrdinal,
  isYes,
  isNo,

  badMessage
};

export default messaging;
