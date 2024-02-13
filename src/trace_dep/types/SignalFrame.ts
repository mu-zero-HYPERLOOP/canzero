

export interface SignalFrame {
  id: number;
  ide: boolean;
  rtr: boolean;
  dlc: number;
  signals: Signal[];
  name : string,
  description? : string,
  data : number,
}

export interface Signal {
  name: string;
  description? : string,
  value: number;
}

