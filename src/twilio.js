import twilio from "twilio";

export function sendMessage(msg, res) {
  const twiml = new twilio.TwimlResponse();
  twiml.sms(msg);
  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());

  return Promise.resolve(msg);
}

export function sendNonReplyMessage(phone, message, opt) {
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
