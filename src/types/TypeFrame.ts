

export interface TypeFrame {
  id: number;
  ide: boolean;
  rtr: boolean;
  dlc: number;
  data : number,
  attributes: TypeFrame[];
  name : string,
  description? : string,
}

export interface FrameAttribute {
  name: string;
  value: number | string | FrameAttribute[];
}
