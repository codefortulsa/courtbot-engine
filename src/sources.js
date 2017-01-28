
export var registrationSourceFn = function() { console.warn(`registrationSourceFn in sources.js not initialized`) };
export var messageSourceFn = function() { console.warn(`messageSourceFn in sources.js not initialized`) };

export function setRegistrationSource(sourceFn) {
  // Unlike vanilla JavaScript, node returns `function` when using typeof on functions
  if (typeof sourceFn !== `function`) return false;

  registrationSourceFn = sourceFn;
  return true;
}

export function setMessageSource(sourceFn) {
  // Unlike vanilla JavaScript, node returns `function` when using typeof on functions
  if (typeof sourceFn !== `function`) return false;

  messageSourceFn = sourceFn;
  return true;
}
