import log4js from "log4js";
import { sendMessage, sendNonReplyMessage } from "./twilio";
import emitter from "./events";
import CourtbotConversation from "./conversation";

export default function(name, options) {
  const communicationType = "sms" + (name || "");

  emitter.on("query-communication-types", (types) => types.push(communicationType));

  emitter.on("add-routes", ({router, registrationSource, messageSource}) => {
    router.post("/sms", function(req,res) {
      log4js.getLogger("sms").debug("Incomming request", req.body);

      var text = req.body.Body.toUpperCase().trim();
      var phone = req.body.From;
      var conversation = new CourtbotConversation(communicationType, registrationSource, messageSource);

      conversation.on("reply", (reply, result) => {
        result.promise = sendMessage(reply, res);
      });

      conversation.parse(text, phone);
    });
  });

  emitter.on("send-non-reply", ({to, msg, msgCommunicationType}) => {
    if(msgCommunicationType === communicationType) {
      sendNonReplyMessage(to, msg, options);
    }
  });
}
