"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (app, options) {
  console.error("Deprecated, please use app.use(\"/pathForSms\", courtbot.routes(options));");
  var completeOptions = getCompleteOptions(options);
  app.use(options.path, (0, _routes2.default)(options));
};

var _routes = require("./routes");

var _routes2 = _interopRequireDefault(_routes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }