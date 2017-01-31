import express from "express";
import completeOptions from "./defaultOptions";
import { registrationSourceFn, messageSourceFn } from "./sources";
import emitter from "./events";

//TODO: move to outside of the engine.
import ConsoleREPL from "./console";

export default function(opt) {
  var router = express.Router();
  var options = completeOptions(opt);

  var registrationSource = registrationSourceFn(options.dbUrl);
  var messageSource = messageSourceFn(options);

  //TODO: move to outside of the engine.
  if(opt.ConsoleREPL)
    ConsoleREPL("", options);

  router.get("/communication-types", (req, res) => {
    const communicationTypes = [];
    emitter.emit("query-communication-types", communicationTypes);
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(communicationTypes));
  });

  registrationSource.migrate().then(() =>
    emitter.emit("add-routes", {router, options, registrationSource, messageSource})
  );

  return router;
}
