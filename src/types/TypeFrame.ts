

export interface TypeFrame {
  id: number;
  ide: boolean;
  rtr: boolean;
  dlc: number;
  name : string,
  description? : string,
  data : number,
  attributes: FrameAttribute[];
}

export interface FrameAttribute {
  name: string;
  value: number | string | FrameAttribute[];
}

