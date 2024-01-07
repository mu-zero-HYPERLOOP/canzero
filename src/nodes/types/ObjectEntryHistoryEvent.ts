import ObjectEntryEvent from "./ObjectEntryEvent.ts";


export interface ObjectEntryHistoryEvent {
  new_values : ObjectEntryEvent[],
  deprecated_count : number,
}
