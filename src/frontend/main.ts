import {WebRTCConnection} from "../common/webrtc/WebRTCConnection";
import {SignInResponseDTO} from "../common/dto/SignInDTO";
import {Log} from "./Log";
import {ClientRTCFactory} from "./ClientRTCFactory";
import {UDPTest} from "../backend/model/UDPTest";

declare var $;
let dataConnection: WebRTCConnection;
const signIn = () => {
  $.ajax({
    type: "POST",
    url: "/api/udp-test/sign-in",
    data: {
      offer: dataConnection.getLocalDescription().sdp
    },
    dataType: "json",
  }).done((response: SignInResponseDTO) => {
    let desc = new RTCSessionDescription({
      type: "answer",
      sdp: decodeURI(response.sdp)
    });
    dataConnection.setRemoteDescription(desc);
  }).fail(() => {
    Log.e("Failed to sign in");
  });
};


const startTime = Date.now();
let receiedCount = 0;
const onDataChMessage = (msg: ArrayBuffer) => {
  receiedCount++;
  if (receiedCount % 100 == 0) {
    $("#progress").html("" + receiedCount);
  }
};

const channelStateChange = (conn: WebRTCConnection, state: WebRTCConnection.States) => {
  if (state == WebRTCConnection.States.CLOSED) {
    $("#startBtn").html("Start");
    $("#startBtn").removeAttr("disabled");
  }
  if (state == WebRTCConnection.States.CONNECTED) {
    let counter = 0;
    while (counter < 10000) {
      const uint8 = new Uint8Array(1000);
      const dw = new DataView(uint8.buffer);
      dw.setInt32(0, counter++);
      conn.send(uint8.buffer);
      if (counter >= 10000) {
        conn.close();
        break;
      }
    }
  }
};

$("#startBtn").click(() => {
  receiedCount = 0;
  $("#startBtn").html("in progress..");
  dataConnection = ClientRTCFactory.create({reliable: false, initiator: true});
  dataConnection.OnMessageReceived.on(onDataChMessage);
  dataConnection.OnEndOfCandidates.on(signIn);
  dataConnection.OnChannelStateChanged.on(channelStateChange);
  dataConnection.connect();
  $("#startBtn").attr("disabled", "disabled");
});
