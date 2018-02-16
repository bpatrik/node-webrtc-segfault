import {WebRTCConnection} from "../../common/webrtc/WebRTCConnection";
import {SignInRequestDTO, SignInResponseDTO} from "../../common/dto/SignInDTO";
import {ServerRTCFactory} from "./ServerRTCFactory";
import {TaskScheduler} from "../../common/TaskScheduler";

export class UDPTest {

  connectionIdCounter = 0;
  private connections: WebRTCConnection[] = [];
  private task: TaskScheduler = new TaskScheduler();

  public async signIn(data: SignInRequestDTO): Promise<SignInResponseDTO> {
    return new Promise<SignInResponseDTO>((resolve) => {
      let conn = ServerRTCFactory.create({
        reliable: false,
        initiator: false
      });
      let id = this.connectionIdCounter++;
      conn.connect();
      conn['packetID'] = 0;
      this.connections.push(conn);
      conn.setRemoteDescription({type: "offer", sdp: data.offer});
      conn.OnEndOfCandidates.on(() => {
        const answer = conn.getLocalDescription().sdp;
        resolve({
          sdp: answer,
          connectionId: id
        })
      });
      conn.OnChannelStateChanged.on(this.channelStateChange);
    });
  }

  private channelStateChange = (conn: WebRTCConnection, state: WebRTCConnection.States) => {
    if (state == WebRTCConnection.States.CONNECTED) {
      this.upload();
    }
    if (state == WebRTCConnection.States.CLOSED) {
      if (this.connections.indexOf(conn) != -1) {
        this.connections.splice(this.connections.indexOf(conn), 1);
      }
    }
  };

  static PACKETS = 10000;
  private upload = () => {
    this.task.clear();

    for (let i = 0; i < this.connections.length; i++) {
      if (this.connections[i].State != WebRTCConnection.States.CONNECTED) {
        continue;
      }

      while (this.connections[i]['packetID'] < UDPTest.PACKETS) {
        const uint8 = new Uint8Array(1000);
        const dw = new DataView(uint8.buffer);
        dw.setInt32(0, this.connections[i]['packetID']++);
        this.connections[i].send(uint8.buffer);
        if (this.connections[i]['packetID'] >= UDPTest.PACKETS) {
          this.connections[i].close();
          break;
        }
      }

    }

    if (this.connections.length > 0) {
      this.task.schedule(this.upload, 50);
    }

  }

}
