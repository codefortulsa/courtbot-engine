"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sendMessage = sendMessage;
exports.sendNonReplyMessage = sendNonReplyMessage;

var _twilio = require("twilio");

var _twilio2 = _interopRequireDefault(_twilio);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function sendMessage(msg, res) {
  var twiml = new _twilio2.default.TwimlResponse();
  console.log("Sending:", msg);
  twiml.sms(msg);
  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());

  return Promise.resolve(msg);
}

function sendNonReplyMessage(phone, message, opt) {
  console.log("Sending:", message, " to: ", phone);
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