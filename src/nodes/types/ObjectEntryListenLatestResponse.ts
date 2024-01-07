import ObjectEntryEvent from "./ObjectEntryEvent.ts";


interface ObjectEntryListenLatestResponse {
  event_name : string,
  latest : ObjectEntryEvent
}

export default ObjectEntryListenLatestResponse;
