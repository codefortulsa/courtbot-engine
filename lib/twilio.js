"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sendMessage = sendMessage;
exports.sendNonReplyMessage = sendNonReplyMessage;

var _twilio = require("twilio");

var _twilio2 = _interopRequireDefault(_twilio);

var _log4js = require("log4js");

var _log4js2 = _interopRequireDefault(_log4js);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function sendMessage(msg, res) {
  var twiml = new _twilio2.default.TwimlResponse();
  _log4js2.default.getLogger("twilio-response").info("Sending reply.", msg);
  twiml.sms(msg);
  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());

  return Promise.resolve(msg);
}

function sendNonReplyMessage(phone, message, opt) {
  _log4js2.default.getLogger("twilio-non-respose").info("Sending non reply message.", { message: message, phone: phone, from: opt.twilioPhone });
  return new Promise(function (resolve, reject) {
    var client = (0, _twilio2.default)(opt.twilioAccount, opt.twilioToken);
    client.sendMessage({ to: phone, from: opt.twilioPhone, body: message }, function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}