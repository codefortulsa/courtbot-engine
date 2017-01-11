import routes from "./routes";
import completeOptions from "./defaultOptions";

export default function(app, options) {
  console.error("Deprecated, please use app.use(\"/pathForSms\", courtbot.routes(options));");
  var completeOptions = completeOptions(options);
  app.use(options.path, routes(options));
}
