import setup from './setup';
import proxyquire from 'proxyquire';
import EventEmitter from 'events';
import _ from "lodash";

describe("messaging", () => {
  const {expect, sandbox, chance} = setup();

  let messaging;
  let emitter;
  beforeEach(() => {
    emitter = new EventEmitter();
    messaging = proxyquire("../src/messaging.js", {
      "./events": {default: emitter }
    });
  });

  function testMessage(name, messageName, args) {
    it(`${name} invokes ${messageName} with passed data`, () => {
      const stub = sandbox.stub();
      emitter.on(messageName, stub);

      Reflect.apply(messaging[name], messaging, _.map(args, v => v));

      expect(stub).to.have.been.calledWith(Object.assign({}, args, {message: messaging.noMessage}));
    });
  }

  function testCheck(name, messageName, text, result) {
    it(`${name} invokes ${messageName} with passed text`, () => {
      const stub = sandbox.stub();
      emitter.on(messageName, stub);

      Reflect.apply(messaging[name], messaging, [text]);

      expect(stub).to.have.been.calledWith({text, result});
    });
  }

  testMessage("remote", "courtbot-messaging-remote", { user: chance.word(), case_number: chance.guid(), name: chance.word() });
  testMessage("reminder", "courtbot-messaging-reminder", { reg: {}, evt: { date: chance.date().toString(), description: chance.paragraph() } });
  testMessage("askReminder", "courtbot-messaging-ask-reminder", { phone: chance.phone(), registration: {}, party: chance.word() });
  testMessage("noCaseMessage", "courtbot-messaging-no-case-message", { caseNumber: chance.guid() });
  testMessage("askParty", "courtbot-messaging-ask-party", { phone: chance.phone(), registration: {}, parties: chance.n(chance.word, 4) });
  testMessage("expiredRegistration", "courtbot-messaging-expired-registration", { });
  testMessage("confirmRegistration", "courtbot-messaging-confirm-registration", { phone: chance.phone(), pending: {} });
  testMessage("cancelRegistration", "courtbot-messaging-cancel-registration", { phone: chance.phone(), pending: {} });
  testMessage("badMessage", "courtbot-messaging-bad-message", { text: chance.word(), lastMessage: chance.paragraph() });

  testCheck("isOrdinal", "courtbot-messaging-is-ordinal", chance.word(), false);
  testCheck("getOrdinal", "courtbot-messaging-get-ordinal", chance.word(), 0);
  testCheck("isYes", "courtbot-messaging-is-yes", chance.word(), false);
  testCheck("isNo", "courtbot-messaging-is-no", chance.word(), false);
})
