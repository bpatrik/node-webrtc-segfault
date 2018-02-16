import * as winston from "winston";

declare module 'winston' {
  interface LoggerInstance {
    logFileName: string;
    logFilePath: string;
  }
}

export const winstonSettings = {
  transports: [
    new winston.transports.Console({
      level: process.env.NODE_ENV == "production" ? "info" : 'silly',
      handleExceptions: true,
      json: false,
      colorize: true,
      timestamp: function () {
        return (new Date()).toLocaleString();
      },
      label: "innerLabel",
      formatter: (options) => {
        // Return string will be passed to logger.
        return options.timestamp() + '[' + winston['config']['colorize'](options.level, options.level.toUpperCase()) + '] ' +
          (undefined !== options.message ? options.message : '') +
          (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta) : '');
      },
      debugStdout: true
    })
  ],
  exitOnError: false
};

export const Logger = new winston.Logger(winstonSettings);
