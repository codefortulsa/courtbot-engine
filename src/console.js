import log4js from "log4js";
import emitter from "./events";
import CourtbotConversation from "./conversation";
import inquirer from "inquirer";
import sendDueReminders from "./sendDueReminders";
import checkMissingCases from "./checkMissingCases";

export default function(name, options) {
  const communicationType = "console" + (name || "");

  emitter.on("query-communication-types", (types) => types.push(communicationType));

  const idleQuestion = {
    type: "list",
    name: "idle",
    message: "What would you like to do?",
    choices: [
      "Start a new registration",
      "Check form reminders",
      "Check for missing cases",
      new inquirer.Separator(),
      "Exit"
    ]
  };

  emitter.on("add-routes", ({registrationSource, messageSource}) => {
    function idlePrompt() {
      return inquirer.prompt([idleQuestion]).then(result => {
        switch(result.idle) {
          case "Start a new registration":
            return new Promise(function(resolve) {
              var conversation = new CourtbotConversation(communicationType, registrationSource, messageSource);

              conversation.on("reply", (reply, result) => {
                result.promise = inquirer.prompt([
                  {
                    type: "input",
                    name: "reply",
                    message: reply,
                    default: "END"
                  }
                ]).then(replyResult => {
                  if(replyResult.input === "END") {
                    resolve();
                    return;
                  }

                  conversation.parse(replyResult.input, "tty");
                })
              });

              inquirer.prompt([
                {
                  type: "input",
                  name: "init",
                  message: "Case number",
                }
              ]).then(initial => conversation.parse(initial.init, "tty"));
            });
          case "Check form reminders":
            return sendDueReminders(options);
          case "Check for missing cases":
            return checkMissingCases(options);
          case "Exit":
            process.exit(0);
            break;
        }
      }).then(idlePrompt);
    }

    idlePrompt();
  });

  emitter.on("send-non-reply", ({msg, msgCommunicationType}) => {
    if(msgCommunicationType === communicationType) {
      log4js.getLogger("console").info(msg);
    }
  });
}
