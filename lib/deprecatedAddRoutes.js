"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (app, options) {
  console.error("Deprecated, please use app.use(\"/pathForSms\", courtbot.routes(options));");
  var opts = (0, _defaultOptions2.default)(options);
  app.use(options.path, (0, _routes2.default)(opts));
};

var _routes = require("./routes");

var _routes2 = _interopRequireDefault(_routes);

var _defaultOptions = require("./defaultOptions");

var _defaultOptions2 = _interopRequireDefault(_defaultOptions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }