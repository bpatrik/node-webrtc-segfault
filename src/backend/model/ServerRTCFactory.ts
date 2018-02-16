import * as webrtc from "wrtc"
import {Logger} from "../Logger";
import {WebRTCConnection} from "../../common/webrtc/WebRTCConnection";

export class ServerRTCFactory {

  public static create(settings: WebRTCConnection.Settings) {
    const Log = {
      w: Logger.warn,
      d: Logger.debug,
      i: Logger.info,
      e: Logger.error,
      v: Logger.verbose,
    };
    return new WebRTCConnection(settings, Log, webrtc);
  }
}
