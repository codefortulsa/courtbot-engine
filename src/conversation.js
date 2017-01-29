import registrationState from "./registrationState";
import EventEmitter from "events";
import log4js from "log4js";
import {getCaseParties} from "./events";

export default class CourtbotConversation extends EventEmitter {
  constructor(conversationType, registrationSource, messageSource) {
    super();

    this.conversationType = conversationType;
    this.registrationSource = registrationSource;
    this.messageSource = messageSource;

    this.logger = log4js.getLogger("CourtbotConversation");
  }

  emitReply(reply) {
    const result = {};
    this.emit("reply", reply, result);

    if(result.promise) {
      return result.promise;
    }

    if(result.promises) {
      return Promise.all(result.promises);
    }

    return Promise.resolve(result);
  }

  parse(text, from) {
    this.logger.debug(`parsing text ${text} from ${from}`);
    return this.fetchActiveConversation(from)
      .then(conversation => {
        if(!conversation) return this.createNewConversation(text, from);
        if(conversation.state === registrationState.ASKED_PARTY) return this.chooseParty(conversation, text, from);
        if(conversation.state === registrationState.ASKED_REMINDER) return this.finalQuestion(conversation, text, from);
      })
      .then(() => this.emit("done"));
  }

  finalQuestion(conversation, text, from) {
    if(this.messageSource.isYes(text)) {
      return this.emitReply(this.messageSource.confirmRegistration(from, conversation))
      .then(() => this.registrationSource.updateRegistrationState(conversation.registration_id, registrationState.REMINDING));
    }
    else if(this.messageSource.isNo(text)) {
      return this.emitReply(this.messageSource.cancelRegistration(from, conversation))
      .then(() => this.registrationSource.updateRegistrationState(conversation.registration_id, registrationState.UNSUBSCRIBED));
    }
  }

  chooseParty(conversation, text, from) {
    getCaseParties(conversation.case_number)
      .then(parties => {
        var matching;
        if(this.messageSource.isOrdinal(text)) {
          var ord = this.messageSource.getOrdinal(text);
          this.logger.info(`trying to choose party number: ${ord} (number of parties: ${parties.length})`);
          if(ord > 0 && ord <= parties.length) {
            matching = parties[ord - 1];
          }else {
            this.logger.info(`${ord} is out of range.`);
          }
        }

        var candidates = parties.filter(p => p.name.toUpperCase().indexOf(text) >= 0);
        if(candidates.length > 0) {
          matching = candidates[0];
        }

        if(matching) {
          this.registrationSource.updateRegistrationName(conversation.registration_id, matching.name)
            .then(() => this.emitReply(this.messageSource.askReminder(from, conversation, matching)))
            .then(() => this.registrationSource.updateRegistrationState(conversation.registration_id, registrationState.ASKED_REMINDER));
        } else {
          this.logger.info(`did not find any parties for text: ${text}.`);
          this.emitReply(this.messageSource.askPartyAgain(text, from, conversation, parties));
        }
      });
  }

  createNewConversation(text, from) {
    this.logger.info("Creating new registration...");
    this.registrationSource.createRegistration({
      contact: from,
      communication_type: this.conversationType,
      name: null,
      case_number: text,
      state: registrationState.UNBOUND
    })
    .then(id => this.registrationSource.getRegistrationById(id))
    .then(registration => getCaseParties(text).then(parties => {
      this.logger.info("parties found for new registration", parties);
      if(parties.length > 1) {
        this.logger.info("more than 1 party found!");
        return this.emitReply(this.messageSource.askParty(from, registration, parties))
          .then(() => this.registrationSource.updateRegistrationState(registration.registration_id, registrationState.ASKED_PARTY));
      }
      else if(parties.length == 1) {
        this.logger.info("exactly one party found!");
        return this.registrationSource.updateRegistrationName(registration.registration_id, parties[0].name)
          .then(() => this.emitReply(this.messageSource.askReminder(from, registration, parties[0])))
          .then(() => this.registrationSource.updateRegistrationState(registration.registration_id, registrationState.ASKED_REMINDER));
      }
      else {
        return this.emitReply(this.messageSource.noCaseMessage(text));
      }
    }))
    .catch(err => this.logger.info("Error occured during registration", err));
  }

  fetchActiveConversation(from) {
    this.registrationSource.getRegistrationsByContact(from, conversationType)
      .then(registrations =>
        registrations.filter(r => r.state != registrationState.REMINDING && r.state != registrationState.UNBOUND && r.state != registrationState.UNSUBSCRIBED)
      )
      .then(pendingRegistrations => pendingRegistrations.length > 0 ? pendingRegistrations[0] : null);
  }
}
