import express from "express";
import log4js from "log4js";
import { sendMessage } from "./twilio";
import completeOptions from "./defaultOptions";
import { registrationSourceFn, messageSourceFn } from "./sources";
import registrationState from "./registrationState";
import emitter, {getCaseParties} from "./events";

export default function(opt) {
  var router = express.Router();
  var options = completeOptions(opt);

  var registrationSource = registrationSourceFn(options.dbUrl);
  var messageSource = messageSourceFn(options);

  registrationSource.migrate().then(() =>
    emitter.emit("add-routes", {router, options, registrationSource, messageSource});
  );

  return router;
}
