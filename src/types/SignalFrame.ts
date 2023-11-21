

export interface SignalFrame {
  id: number;
  ide: boolean;
  rtr: boolean;
  dlc: number;
  signals: Signal[];
  name : string,
  description? : string,
}

export interface Signal {
  name: string;
  value: string;
}

