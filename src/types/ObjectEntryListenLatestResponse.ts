import ObjectEntryEvent from "./ObjectEntryEvent";


interface ObjectEntryListenLatestResponse {
  event_name : string,
  latest : ObjectEntryEvent
}

export default ObjectEntryListenLatestResponse;
