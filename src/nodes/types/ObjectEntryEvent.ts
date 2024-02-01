
export type ObjectEntryValue = number | string | ObjectEntryComposite;

export interface ObjectEntryComposite {
  name: string; // redundant!
  value: {name : string, value : ObjectEntryValue}[],
}

interface ObjectEntryEvent {
  value: ObjectEntryValue
  timestamp: number,
  delta_time: number,
}

export default ObjectEntryEvent;

