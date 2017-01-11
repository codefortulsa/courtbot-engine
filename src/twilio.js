import twilio from "twilio";
import log4js from "log4js";

export function sendMessage(msg, res) {
  const twiml = new twilio.TwimlResponse();
  log4js.getLogger("twilio-response").info("Sending reply.", msg);
  twiml.sms(msg);
  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());

  return Promise.resolve(msg);
}

export function sendNonReplyMessage(phone, message, opt) {
  log4js.getLogger("twilio-non-respose").info("Sending non reply message.", {message, phone, from: opt.twilioPhone});
  return new Promise(function(resolve, reject) {
    var client = twilio(opt.twilioAccount, opt.twilioToken);
    client.sendMessage({to: phone, from: opt.twilioPhone, body: message}, function(err) {
      if(err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}
