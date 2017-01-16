"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCaseParties = getCaseParties;
exports.getCasePartyEvents = getCasePartyEvents;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = require('events');

var CourtbotEmitter = function (_EventEmitter) {
  _inherits(CourtbotEmitter, _EventEmitter);

  function CourtbotEmitter() {
    _classCallCheck(this, CourtbotEmitter);

    return _possibleConstructorReturn(this, (CourtbotEmitter.__proto__ || Object.getPrototypeOf(CourtbotEmitter)).apply(this, arguments));
  }

  return CourtbotEmitter;
}(EventEmitter);

;

var emitter = new CourtbotEmitter();

exports.default = emitter;
function getCaseParties(casenumber) {
  var result = {
    promises: [],
    parties: []
  };
  emitter.emit("retrieve-parties", casenumber, result);

  return Promise.all(result.promises).then(function (results) {
    return results.reduce(function (a, b) {
      return a.concat(b);
    }, result.parties);
  });
}

function getCasePartyEvents(casenumber, party) {
  var result = {
    promises: [],
    events: []
  };
  emitter.emit("retrieve-party-events", casenumber, party, result);

  return Promise.all(result.promises).then(function (results) {
    return results.reduce(function (a, b) {
      return a.concat(b);
    }, result.events);
  });
}