///<reference path="webrtc.d.ts"/>

import {Event} from "../event/Event";
import {Event2Args} from "../event/Event2Args";

require('webrtc-adapter');

export interface IRTCLog {
  w(...args: any[]);

  d(...args: any[]);

  e(...args: any[]);

  v(...args: any[]);

  i(...args: any[]);

}

export interface IRTCModule {
  RTCPeerConnection: typeof RTCPeerConnection;
  RTCSessionDescription: typeof RTCSessionDescription;
}

export class WebRTCConnection {

  public OnEndOfCandidates = new Event<WebRTCConnection>();
  public OnMessageReceived = new Event<ArrayBuffer>();
  public OnChannelStateChanged = new Event2Args<WebRTCConnection, WebRTCConnection.States>();
  public OnLocalDescriptionSet = new Event2Args<WebRTCConnection, RTCSessionDescription>();
  public OnIceCallback = new Event2Args<WebRTCConnection, RTCIceCandidate>();


  private peerConnection: RTCPeerConnection;
  private dataChannel: RTCDataChannel;
  private channelReadyState: string;
  private createdCandidatesNumber = 0;
  private static connectionCounter = 0;
  public connectionId = 0;

  private state: WebRTCConnection.States = WebRTCConnection.States.UNKNOWN;
  private cleanedUp = false;
  // protected Log = new Logger("RTC:___");




  constructor(private settings: WebRTCConnection.Settings,
              private Log: IRTCLog,
              private rtcModule: IRTCModule) {
    this.connectionId = WebRTCConnection.connectionCounter++;
  }

  public connect = () => {
    this.Log.d('Creating WebRTC connection');
    const pcConfig: RTCConfiguration = {
      //WARN: do not use it in production
      iceServers: [
        {urls: "stun:stun.l.google.com:19302"},
        {urls: "stun:stun.schlund.de"}
      ]
    };
    this.setChannelState(WebRTCConnection.States.INIT);

    // Add localConnection to global scope to make it visible from the browser console.
    this.peerConnection = new this.rtcModule.RTCPeerConnection(pcConfig);

    let dChSetting = {
      label: "data_channel",
      params: {}
    };

    if (this.settings.reliable === true) {
      dChSetting.label = "reliable_data_channel";
      dChSetting.params = <RTCDataChannelInit>{ordered: true, protocol: ""};
    } else {
      dChSetting.label = "unreliable_data_channel";
      dChSetting.params = <RTCDataChannelInit>{
        ordered: false,
        protocol: "udp",
        maxRetransmits: 0,
        negotiated: false
      };
    }


    this.peerConnection.onicecandidate = this.iceCallbackProxy;
    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.cleanedUp == true) {
        return;
      }
      this.Log.d(this.peerConnection.iceConnectionState);
      if (this.peerConnection.iceConnectionState == "disconnected" ||
        this.peerConnection.iceConnectionState == "failed") {
        this.setChannelState(WebRTCConnection.States.CLOSED);
        this.close();
      }
    };


    if (this.settings.initiator === true) {
      this.dataChannel = this.peerConnection.createDataChannel(dChSetting.label, dChSetting.params);
      this.dataChannel.binaryType = 'arraybuffer';
      this.Log.d('Created send data channel');

      this.onDataChannelCreated(this.dataChannel);

      this.Log.d('Creating an offer');


      this.peerConnection.createOffer(this.gotDescription, this.logError("createOffer"));
    } else {
      this.peerConnection.ondatachannel = (event: RTCDataChannelEvent) => {
        this.dataChannel = event.channel;
        this.dataChannel.binaryType = 'arraybuffer';
        this.onDataChannelCreated(this.dataChannel);
      };
    }


  };


  private iceCallbackProxy = (event: RTCPeerConnectionIceEvent) => {
    if (this.state == WebRTCConnection.States.CLOSED) {
      return;
    }
    if (event.candidate) {
      this.createdCandidatesNumber++;
      this.OnIceCallback.trigger(this, event.candidate);
      this.Log.d("candidate: ", event.candidate);
    } else {
      if (this.createdCandidatesNumber == 0) {
        console.error("No candidates were created!");
      }
      this.OnEndOfCandidates.trigger(this);
      this.Log.d('End of candidates.');
    }

  };

  public onMessage(event: MessageEvent) {
    this.OnMessageReceived.trigger(event.data);
  };

  private onDataChannelCreated = (dataChannel: RTCDataChannel) => {
    if (this.state == WebRTCConnection.States.CLOSED) {
      return;
    }
    dataChannel.onopen = this.onSendChannelStateChange;
    dataChannel.onclose = this.onSendChannelStateChange;
    dataChannel.onerror = this.onSendChannelStateChange;
    dataChannel.onmessage = (event: MessageEvent) => {
      this.onMessage(event);
    };
  };


  private setLocalDescriptionCallback = () => {
    if (this.peerConnection != null) {
      this.OnLocalDescriptionSet.trigger(this, this.peerConnection.localDescription);
    }
  };

  private gotDescription = (desc: RTCSessionDescription) => {
    if (this.peerConnection != null) {
      this.peerConnection.setLocalDescription(desc, this.setLocalDescriptionCallback, this.logError("gotDescription"));
    }
  };


  private onSendChannelStateChange = () => {
    if (!this.dataChannel) {
      return;
    }
    this.channelReadyState = this.dataChannel.readyState;
    this.Log.d('Send channel state is: ' + this.channelReadyState);
    if (this.channelReadyState == "open") {
      this.setChannelState(WebRTCConnection.States.CONNECTED);
    } else if (this.channelReadyState == "closed") {
      this.setChannelState(WebRTCConnection.States.CLOSED);
      this.close();
    } else {
      this.setChannelState(WebRTCConnection.States.UNKNOWN);
    }
  };

  private sentSize = 0;
  private lastBufferQueried = 0;
  private lastBufferAmount = 0;

  public send(data: ArrayBuffer) {
    if (this.state !== WebRTCConnection.States.CONNECTED) {
      this.Log.w("Trying to send data, while channel is not connected");
      return;
    }

    try {
      this.dataChannel.send(data);
      this.sentSize += data.byteLength;
    } catch (err) {
      console.error("Error sending data over WebRTC: " + err);
      this.close();
    }
  };

  public getSendChannelBufferAmount = () => {
    if (this.lastBufferQueried + 100 < Date.now()) {
      this.sentSize = 0;
      this.lastBufferAmount = this.dataChannel.bufferedAmount;
      this.lastBufferQueried = Date.now();
    }
    return this.lastBufferAmount + this.sentSize;
  };

  public isSendChannelShouldWait = () => {
    return this.getSendChannelBufferAmount() > 15*1024*1024;
  };

  public isReady() {
    return this.dataChannel.bufferedAmount == 0;
  }

  public setRemoteDescription = (descriptionInitDict: RTCSessionDescriptionInit) => {
    if (this.state === WebRTCConnection.States.CLOSED) {
      return;
    }
    if (this.state != WebRTCConnection.States.CONNECTED) {
      this.setChannelState(WebRTCConnection.States.DSP_EXCHANGED);
    }
    this.peerConnection.setRemoteDescription(new this.rtcModule.RTCSessionDescription(descriptionInitDict),
      () => {
        this.Log.d("remote desc set");
      },
      this.logError("setRemoteDescription"));
    if (!this.settings.initiator) {
      this.peerConnection.createAnswer(this.gotDescription, this.logError("setRemoteDescription"));
    }
  };


  private setIceCandidate(event: RTCIceCandidateEvent) {
    if (this.state === WebRTCConnection.States.CLOSED) {
      return;
    }

    this.Log.d('remote ice callback');
    if (event.candidate) {
      this.peerConnection.addIceCandidate(event.candidate, this.onAddIceCandidateSuccess, this.logError("setIceCandidate"));
      //     this.Log.d('Remote ICE candidate:  ' + event.candidate.candidate);
    }
  };

  private addIceCandidate(candidate: RTCIceCandidate) {
    if (this.state != WebRTCConnection.States.CONNECTED) {
      this.setChannelState(WebRTCConnection.States.ICE_EXCHANGED);
    }
    this.peerConnection.addIceCandidate(candidate, this.onAddIceCandidateSuccess, this.logError("addIceCandidate"));
  };

  private onAddIceCandidateSuccess = () => {
    //   this.Log.d('AddIceCandidate success.');
  };


  private logError = (tag) => {
    return (error) => {
      let containsText = error.toString().indexOf('0x8000ffff (NS_ERROR_UNEXPECTED)') >= 0;

      if (this.state == WebRTCConnection.States.CLOSED && containsText) { //neglecting some kind of firefox bug
        this.setChannelState(WebRTCConnection.States.ERROR);
        return;
      }

      console.error("[" + tag + "]" + 'Error: ' + error.toString(),
        {
          connectionState: this.state,
          errorObject: error
        });

      this.setChannelState(WebRTCConnection.States.ERROR);
    }
  };


  public close = () => {
    this.setChannelState(WebRTCConnection.States.CLOSED);
    this.Log.d('Closing data channels');
    if (this.dataChannel) {
      this.Log.d('Closed data channel with label: ' + this.dataChannel.label);
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.peerConnection) {
      if (this.channelReadyState != "closed") {
        this.peerConnection.close();
      }
      this.Log.d('Closed peer connections');
    }
    if (this.cleanedUp === true) {
      return;
    }
    this.cleanedUp = true;

    this.peerConnection = null;

    this.OnMessageReceived.allOff();
    this.OnChannelStateChanged.allOff();
    this.OnLocalDescriptionSet.allOff();
    this.OnIceCallback.allOff();

  };

  private setChannelState = (state: WebRTCConnection.States) => {
    if (this.state != state) {
      this.state = state;
      this.OnChannelStateChanged.trigger(this, state);
    }
  };

  public get State(): WebRTCConnection.States {
    return this.state;
  };

  public isOutgoing(): boolean {
    return this.settings.initiator;
  }

  public isReliable(): boolean {
    return this.settings.reliable;
  }

  public getLocalDescription(): RTCSessionDescription {
    return this.peerConnection.localDescription;
  }


}

export module WebRTCConnection {
  export enum States {
    INIT,
    DSP_EXCHANGED,
    ICE_EXCHANGED,
    CONNECTED,
    CLOSED,
    ERROR,
    UNKNOWN
  }

  export interface Settings {
    reliable: boolean;
    initiator: boolean;
  }
}

