
export type ObjectEntryType = number | string | ObjectEntryComposite;

export interface ObjectEntryComposite {
  name: string; // redundant!
  value: {name : string, value : ObjectEntryType}[],
}

interface ObjectEntryEvent {
  value: number | string | ObjectEntryComposite
  timestamp: number,
  delta_time: number,
}

export default ObjectEntryEvent;

