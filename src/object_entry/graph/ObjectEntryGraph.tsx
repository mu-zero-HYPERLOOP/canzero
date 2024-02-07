import { ReactElement, useEffect, useState } from "react";
import { ObjectEntryInformation } from "../types/ObjectEntryInformation";
import { invoke } from "@tauri-apps/api";
import { Skeleton } from "@mui/material";
import { listen } from "@tauri-apps/api/event";
import { ObjectEntryHistoryEvent } from "../types/events/ObjectEntryHistoryEvent";
import { ObjectEntryEvent } from "../types/events/ObjectEntryEvent";
import { EnumTypeInfo, StructTypeInfo, Type } from "../types/Type";
import { ObjectEntryListenHistoryResponse } from "../types/events/ObjectEntryListenHistoryResponse";
import { Value } from "../types/Value";
import NumberGraph from "../../graph/NumberGraph";
import StringGraph from "../../graph/StringGraph";
import { GraphInterpolation } from "../../graph/GraphInterpolation";

interface ObjectEntryGraph {
  nodeName: string,
  objectEntryName: string,
  useScrolling?: boolean,
  updateIntervalMillis?: number,
  smoothMode? : boolean,
}

const DEFAULT_TIMEDOMAIN: number = 5000;

function ObjectEntryGraph({
  nodeName,
  objectEntryName,
  useScrolling = false,
  updateIntervalMillis = 20,
  smoothMode,
}: ObjectEntryGraph) {
  smoothMode ??= updateIntervalMillis < 50;

  const [timeDomain, setTimeDomain] = useState(DEFAULT_TIMEDOMAIN);

  const [graphList, setGraphList] = useState<ReactElement[]>([]);


  useEffect(() => {
    async function asyncSetup() {
      // fetch information!
      let information = await invoke<ObjectEntryInformation>("object_entry_information",
        { nodeName, objectEntryName });

      let graphList: ReactElement[] = [];

      // register tauri listener!
      let response = await invoke<ObjectEntryListenHistoryResponse>("listen_to_history_of_object_entry",
        { nodeName, objectEntryName, frameSize: timeDomain, minInterval: updateIntervalMillis });
      // initalize history
      let history = response.history;

      // this function creates a list of Graphs
      // for struct types it is called recursively.
      function buildGraphList(ty: Type, property: (event: ObjectEntryEvent) => Value, unit?: string) {
        if (ty.id == "int" || ty.id == "uint" || ty.id == "real") {
          graphList.push(<NumberGraph<ObjectEntryEvent>
            datum={{
              values: history,
              xValue: (event) => event.timestamp,
              yValue: (event) => property(event) as number,
            }}
            width={400}
            height={200}
            unit={unit}
            interpolation={GraphInterpolation.Step}
            refreshRate={50}
            timeDomainMs={timeDomain}
            timeShiftMs={smoothMode ? updateIntervalMillis : 0}
          />);
        } else if (ty.id == "enum") {
          let enumInfo = ty.info as EnumTypeInfo;
          graphList.push(<StringGraph<ObjectEntryEvent>
            datum={{
              values: history,
              xValue: (event) => event.timestamp,
              yValue: (event) => property(event) as string,
            }}
            domain={enumInfo.variants}
            width={400}
            height={200}
            unit={unit}
            interpolation={GraphInterpolation.Step}
            refreshRate={50}
            timeDomainMs={timeDomain}
            timeShiftMs={smoothMode ? updateIntervalMillis : 0}
          />);
        } else if (ty.id == "struct") {
          let structInfo = ty.info as StructTypeInfo;
          for (const [attrib_name, attrib_type] of Object.entries(structInfo.attributes)) {
            buildGraphList(attrib_type, (event) => {
              return (property(event) as { [name: string]: Value })[attrib_name];
            }, undefined);
          };
        } else {
          console.error("INVALID TYPE ID");
        }
      }

      buildGraphList(information.ty, (event) => event.value, information.unit);

      setGraphList(graphList);

      // register js listener
      let unlistenJs = await listen<ObjectEntryHistoryEvent>(response.event_name, (event) => {
        // update history
        history.splice(0, event.payload.deprecated_count);
        history.push(...event.payload.new_values);
      });

      return () => {
        // unregister js listener
        unlistenJs()
        // async unregister tauri listener
        invoke("unlisten_from_history_of_object_entry",
          { nodeName, objectEntryName, eventName: response.event_name }).catch(console.error);
      }
    }

    let asyncCleanup = asyncSetup();



    return () => {
      // reset component!
      setTimeDomain(DEFAULT_TIMEDOMAIN);
      // async cleanup of listeners
      asyncCleanup.then(f => f()).catch(console.error);
    };
  }, [nodeName, objectEntryName, timeDomain]);



  if (graphList.length != 0) {
    return <>{graphList}</>;
  } else {
    return <Skeleton variant="rounded" height={"300px"} />
  }
}

export default ObjectEntryGraph;
