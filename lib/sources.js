"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setRegistrationSource = setRegistrationSource;
exports.setMessageSource = setMessageSource;
var registrationSourceFn = exports.registrationSourceFn = undefined;
var messageSourceFn = exports.messageSourceFn = undefined;

function setRegistrationSource(sourceFn) {
  exports.registrationSourceFn = registrationSourceFn = sourceFn;
}

function setMessageSource(sourceFn) {
  exports.messageSourceFn = messageSourceFn = sourceFn;
}