import proxyquire from "proxyquire";
import setup from './setup';
import registrationState from "../src/registrationState";
import EventEmitter from "events";

describe("CourtbotConversation", () => {
  const {sandbox, chance, expect} = setup();

  let conversationType;
  let registrationSource;
  let getCasePartiesStub;
  let getLoggerStub;
  let logger;
  let ConversationClass;
  let conversation;
  let emitter;
  let events;

  beforeEach(() => {
    conversationType = chance.word();
    registrationSource = {};
    logger = {
      info: sandbox.stub(),
      debug: sandbox.stub(),
    };
    getCasePartiesStub = sandbox.stub();
    getLoggerStub = sandbox.stub().returns(logger);
    emitter = new EventEmitter();
    events = { default: emitter, getCaseParties: getCasePartiesStub };
    ConversationClass = proxyquire("../src/conversation", {
      log4js: { getLogger: getLoggerStub },
      "./events": events,
      "./messaging": proxyquire("../src/messaging", {
        "./events": events
      })
    }).default;
    conversation = new ConversationClass(conversationType, registrationSource);
  });

  it("has the correct settings", () => {
    expect(conversation.conversationType).to.equal(conversationType);
    expect(conversation.registrationSource).to.equal(registrationSource);
  });

  it("creates a class level loger", () => {
    return expect(getLoggerStub).to.have.been.calledWith("CourtbotConversation");
  });

  describe("emitReply", () => {
    it("emits a reply event", () => {
      const msg = chance.paragraph()
      return expect(() => conversation.emitReply(msg)).to.emitFrom(conversation, "reply", msg, {});
    });

    describe("promise handling", () => {
      it("handles a single promise", () => {
        const msg = chance.paragraph()
        const promResult = chance.word();
        conversation.on("reply", (msg, result) => {
          result.promise = Promise.resolve(promResult);
        });
        return expect(conversation.emitReply(msg)).to.eventually.equal(promResult);
      });

      it("handles multiple promises", () => {
        const msg = chance.paragraph()
        const promResult1 = chance.word();
        const promResult2 = chance.word();
        const promResult3 = chance.word();
        conversation.on("reply", (msg, result) => {
          result.promises = [
            Promise.resolve(promResult1),
            Promise.resolve(promResult2),
            Promise.resolve(promResult3)
          ];
        });
        return expect(conversation.emitReply(msg)).to.eventually.eql([promResult1, promResult2, promResult3]);
      });
    });
  });

  describe("parse", () => {
    beforeEach(() => {
      conversation.fetchActiveConversation = sandbox.stub();
      conversation.createNewConversation = sandbox.stub();
      conversation.chooseParty = sandbox.stub();
      conversation.finalQuestion = sandbox.stub();
    });

    it("creates a new conversation if no conversation is active", () => {
      const msg = chance.word();
      const from = chance.phone();

      conversation.fetchActiveConversation.returns(Promise.resolve(null));
      conversation.createNewConversation.returns(Promise.resolve());
      return conversation.parse(msg, from).then(() => {
        expect(conversation.fetchActiveConversation).to.have.been.calledWith(from);
        expect(conversation.createNewConversation).to.have.been.calledWith(msg, from);
      });
    });

    it("chooses a party if it was waiting for a party", () => {
      const msg = chance.word();
      const from = chance.phone();
      const reg = { state: registrationState.ASKED_PARTY };

      conversation.fetchActiveConversation.returns(Promise.resolve(reg));
      conversation.createNewConversation.returns(Promise.resolve());
      return conversation.parse(msg, from).then(() => {
        expect(conversation.fetchActiveConversation).to.have.been.calledWith(from);
        expect(conversation.chooseParty).to.have.been.calledWith(reg, msg, from);
      });
    });

    it("finalizes the registration if it was waiting for the final question", () => {
      const msg = chance.word();
      const from = chance.phone();
      const reg = { state: registrationState.ASKED_REMINDER };

      conversation.fetchActiveConversation.returns(Promise.resolve(reg));
      conversation.createNewConversation.returns(Promise.resolve());
      return conversation.parse(msg, from).then(() => {
        expect(conversation.fetchActiveConversation).to.have.been.calledWith(from);
        expect(conversation.finalQuestion).to.have.been.calledWith(reg, msg, from);
      });
    });
  });

  describe("finalQuestion", () => {
    let msg;
    let from;
    let conv;

    beforeEach(() => {
      from = chance.phone();
      msg = chance.paragraph();
      registrationSource.updateRegistrationState = sandbox.stub();

      conv = {
        registration_id: chance.integer(),
        state: registrationState.ASKED_REMINDER
      }
    });

    it("sets the registration state to REMINDING if the response counts as yes", () => {
      emitter.on("courtbot-messaging-is-yes", evt => evt.result = true);
      const eventStub = sandbox.stub();
      const noMessage = "NO MESSAGE PROVIDED";
      emitter.on("courtbot-messaging-confirm-registration", eventStub);

      return conversation.finalQuestion(conv, msg, from).then(() => {
        expect(registrationSource.updateRegistrationState).to.have.been.calledWith(conv.registration_id, registrationState.REMINDING);
        expect(eventStub).to.have.been.calledWith({phone: from, pending: conv, message: noMessage});
      });
    });

    it("sets the registration state to UNSUBSCRIBED if the response counts as no", () => {
      emitter.on("courtbot-messaging-is-no", evt => evt.result = true);
      const eventStub = sandbox.stub();
      const noMessage = "NO MESSAGE PROVIDED";
      emitter.on("courtbot-messaging-cancel-registration", eventStub);
      return conversation.finalQuestion(conv, msg, from).then(() => {
        expect(registrationSource.updateRegistrationState).to.have.been.calledWith(conv.registration_id, registrationState.UNSUBSCRIBED);
        expect(eventStub).to.have.been.calledWith({phone: from, pending: conv, message: noMessage});
      });
    });

  });

});
