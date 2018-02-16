import * as _express from "express";
import * as _bodyParser from "body-parser";
import * as _http from "http";
import {Logger} from "./Logger";
import {ProxyRouter} from "./routers/ProxyRouter";
import {PublicRouter} from "./routers/PublicRouter";

const LOG_TAG = "[server]";

export class Server {

  private app: any;
  private server: any;

  constructor() {
    if (!(process.env.NODE_ENV == "production")) {
      Logger.debug(LOG_TAG, "Running in DEBUG mode");
    }

    this.init();
  }

  async init() {

    this.app = _express();


    this.app.set('view engine', 'ejs');


    /**
     * Parse parameters in POST
     */
    // for parsing application/json
    this.app.use(_bodyParser.urlencoded({limit: '50mb', extended: true}));
    this.app.use(_bodyParser.json({limit: '50mb'}));


    PublicRouter.route(this.app);
    ProxyRouter.route(this.app);


    // Get PORT from environment and store in Express.
    this.app.set('port', 8080);

    // Create HTTP server.
    this.server = _http.createServer(this.app);

    //Listen on provided PORT, on all network interfaces.
    this.server.listen(8080);
    this.server.on('error', this.onError);
    this.server.on('listening', this.onListening);


  }


  /**
   * Event listener for HTTP server "error" event.
   */
  private onError = (error: any) => {
    if (error.syscall !== 'listen') {
      Logger.error(LOG_TAG, 'Server error', error);
      throw error;
    }


    // handle specific listen error with friendly messages
    switch (error.code) {
      case 'EACCES':
        Logger.error(LOG_TAG, '80808 requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        Logger.error(LOG_TAG, '8080 is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  };


  /**
   * Event listener for HTTP server "listening" event.
   */
  private onListening = () => {
    let addr = this.server.address();
    const bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    Logger.info(LOG_TAG, 'Listening on ' + bind);
  };

}


