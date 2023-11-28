
import ObjectEntryEvent from "./ObjectEntryEvent";


interface ObjectEntryListenHistoryResponse {
  event_name : string,
  history : ObjectEntryEvent[],
}

export default ObjectEntryListenHistoryResponse;
