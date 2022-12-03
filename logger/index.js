var log4js = require("log4js");
var logger = log4js.getLogger();
log4js.configure({
  appenders: {
    out: { type: "stdout" },
    app: { type: "file", filename: "application.log" },
  },
  categories: {
    default: { appenders: ["out", "app"], level: "debug" },
  },
});
logger.level = "info"; // default level is OFF - which means no logs at all.

module.exports = { logger };
