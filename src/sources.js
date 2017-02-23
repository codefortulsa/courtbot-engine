import log4js from "log4js";
const logger = log4js.getLogger("sources");

export var registrationSourceFn = function() { logger.warn(`registrationSourceFn in sources.js not initialized`) };

export function setRegistrationSource(sourceFn) {
  // Unlike vanilla JavaScript, node returns `function` when using typeof on functions
  if (typeof sourceFn !== `function`) return false;

  registrationSourceFn = sourceFn;
  return true;
}
