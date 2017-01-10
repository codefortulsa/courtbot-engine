import sinon from "sinon";
import chai from "chai";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import Chance from "chance";
import proxyquire from "proxyquire";


const chance = new Chance();
const expect = chai.expect;
const should = chai.should();
chai.use(sinonChai);
chai.use(chaiAsPromised);

describe("twilio", () => {
  let twilio;
  let smsStub;
  let sendMessageStub;
  let testee;
  let twimlOutput;

  beforeEach(() => {
    smsStub = sinon.stub();
    sendMessageStub = sinon.stub();

    twimlOutput = chance.paragraph();
    twilio = sinon.stub().returns({
      sendMessage: sendMessageStub
    });
    twilio.TwimlResponse = sinon.stub();
    twilio.TwimlResponse.prototype.sms = smsStub;
    twilio.TwimlResponse.prototype.toString = () => twimlOutput;

    testee = proxyquire("../src/twilio.js", {
      twilio
    });
  });

  describe("sendMessage", () => {
    let res;
    let msg;

    beforeEach(() => {
      res = {
        writeHead: sinon.stub(),
        end: sinon.stub()
      };
      msg = chance.paragraph();
    });

    it("adds an sms response to the twilio response", () => {
      return testee.sendMessage(msg, res)
        .then(() => expect(smsStub).to.have.been.calledWith(msg));
    });

    it("sets the header to 200/xml", () => {
      return testee.sendMessage(msg, res)
        .then(() => expect(res.writeHead).to.have.been.calledWith(200, {'Content-Type': 'text/xml'}));
    });

    it("sets he response to the output of twiml.toString()", () => {
      return testee.sendMessage(msg, res)
        .then(() => expect(res.end).to.have.been.calledWith(twimlOutput));
    });

    it("returns a promise resolved with the message", () => {
      return testee.sendMessage(msg, res)
        .then(m => expect(m).to.equal(msg));
    });
  });

  describe("sendNonReplyMessage", () => {
    let phone;
    let msg;
    let opt;

    beforeEach(() => {
      phone = chance.phone();
      msg = chance.paragraph();
      opt = {
        twilioAccount: chance.word(),
        twilioToken: chance.guid(),
        twilioPhone: chance.phone()
      };
      sendMessageStub.callsArgWith(1, undefined);
    });

    it("creates a twilio client with the account and token", () => {
      return testee.sendNonReplyMessage(phone, msg, opt)
        .then(() => expect(twilio).to.have.been.calledWith(opt.twilioAccount, opt.twilioToken));
    });

    it("calls sendMessage on the client with the correct params", () => {
      return testee.sendNonReplyMessage(phone, msg, opt)
        .then(() => expect(sendMessageStub).to.have.been.calledWith({to: phone, from: opt.twilioPhone, body: msg}));
    });

    it("rejects the promise if there is an error", () => {
      sendMessageStub.callsArgWith(1, "error!");
      return testee.sendNonReplyMessage(phone, msg, opt).should.eventually.be.rejectedWith("error!");
    });

    it("resolves the promise if there is not an error", () => {
      return testee.sendNonReplyMessage(phone, msg, opt).should.eventually.be.fulfilled;
    });
  });
});
