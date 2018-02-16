export enum SessionType {
  Simple = 0,
  RLNC_block = 1,
  RLNC_sliding_window = 2
}

export interface SignInRequestDTO {
  offer: string;
  sessionType: SessionType;
  reliableDataConnection: boolean;
}

export interface SignInResponseDTO {
  sdp: string;
  connectionId: number;
}
