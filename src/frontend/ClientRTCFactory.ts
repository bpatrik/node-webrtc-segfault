import {WebRTCConnection} from "../common/webrtc/WebRTCConnection";
import {Log} from "./Log";


export class ClientRTCFactory {

  public static create(settings: WebRTCConnection.Settings): WebRTCConnection {
    return new WebRTCConnection(settings, Log,  {
      RTCPeerConnection: RTCPeerConnection,
      RTCSessionDescription: RTCSessionDescription
    });
  }
}
