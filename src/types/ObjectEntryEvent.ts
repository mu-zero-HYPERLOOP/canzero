

export interface ObjectEntryComposite {
  name: string;
  value: number | string | ObjectEntryComposite[];
}

interface ObjectEntryEvent {
  value: number | string | ObjectEntryComposite
  timestamp: number,
  delta_time: number,
}

export default ObjectEntryEvent;

