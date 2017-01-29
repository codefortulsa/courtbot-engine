import proxyquire from "proxyquire";
import setup from './setup';
import registrationState from "../src/registrationState";

describe("CourtbotConversation", () => {
  const {sandbox, chance, expect} = setup();

  let conversationType;
  let registrationSource;
  let messageSource;
  let getCasePartiesStub;
  let getLoggerStub;
  let logger;
  let ConversationClass;
  let conversation;

  beforeEach(() => {
    conversationType = chance.word();
    registrationSource = {};
    messageSource = {};
    logger = {
      info: sandbox.stub(),
      debug: sandbox.stub(),
    };
    getCasePartiesStub = sandbox.stub();
    getLoggerStub = sandbox.stub().returns(logger);
    ConversationClass = proxyquire("../src/conversation", {
      log4js: { getLogger: getLoggerStub },
      "./events": { getCaseParties: getCasePartiesStub }
    }).default;
    conversation = new ConversationClass(conversationType, registrationSource, messageSource);
  });

  it("has the correct settings", () => {
    expect(conversation.conversationType).to.equal(conversationType);
    expect(conversation.registrationSource).to.equal(registrationSource);
    expect(conversation.messageSource).to.equal(messageSource);
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
      messageSource.isYes = sandbox.stub();
      messageSource.isNo = sandbox.stub();
      messageSource.confirmRegistration = sandbox.stub();
      messageSource.cancelRegistration = sandbox.stub();
      registrationSource.updateRegistrationState = sandbox.stub();

      conv = {
        registration_id: chance.integer(),
        state: registrationState.ASKED_REMINDER
      }
    });

    it("sets the registration state to REMINDING if the response counts as yes", () => {
      messageSource.isYes.returns(true);
      return conversation.finalQuestion(conv, msg, from).then(() => {
        expect(registrationSource.updateRegistrationState).to.have.been.calledWith(conv.registration_id, registrationState.REMINDING);
        expect(messageSource.confirmRegistration).to.have.been.calledWith(from, conv);
      });
    });

    it("sets the registration state to UNSUBSCRIBED if the response counts as no", () => {
      messageSource.isNo.returns(true);
      return conversation.finalQuestion(conv, msg, from).then(() => {
        expect(registrationSource.updateRegistrationState).to.have.been.calledWith(conv.registration_id, registrationState.UNSUBSCRIBED);
        expect(messageSource.cancelRegistration).to.have.been.calledWith(from, conv);
      });
    });

  });

});
