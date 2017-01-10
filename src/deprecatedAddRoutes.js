import routes from "./routes";

export default function(app, options) {
  console.error("Deprecated, please use app.use(\"/pathForSms\", courtbot.routes(options));");
  var completeOptions = getCompleteOptions(options);
  app.use(options.path, routes(options));
}
