import routes from "./routes";
import completeOptions from "./defaultOptions";
import log4js from "log4js";

export default function(app, options) {
  log4js.getLogger("deprecated-add-routes").error("Deprecated, please use app.use(\"/pathForSms\", courtbot.routes(options));");
  var opts = completeOptions(options);
  app.use(options.path, routes(opts));
}
