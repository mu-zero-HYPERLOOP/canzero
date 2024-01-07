
import ObjectEntryEvent from "./ObjectEntryEvent.ts";


interface ObjectEntryListenHistoryResponse {
  event_name : string,
  history : ObjectEntryEvent[],
}

export default ObjectEntryListenHistoryResponse;
