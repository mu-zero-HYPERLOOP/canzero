import { LegacyRef, ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ObjectEntryInformation } from "../types/ObjectEntryInformation";
import { invoke } from "@tauri-apps/api";
import { Box, Container, Skeleton, Stack } from "@mui/material";
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
  timeDomain: number,
  smoothMode?: boolean,
  buffering: boolean,
  interpolation: GraphInterpolation,
}


function ObjectEntryGraph({
  nodeName,
  objectEntryName,
  useScrolling = false,
  timeDomain = 5000,
  buffering = true,
  smoothMode,
  interpolation = GraphInterpolation.Step,
}: ObjectEntryGraph) {

  // TODO remove me
  useEffect(()=> {
    console.log("init");
  }, []);

  const [graphList, setGraphList] = useState<ReactElement[]>([]);

  // creates a mutable history object, which is modified in the useEffect.
  const history = useMemo<ObjectEntryEvent[]>(() => [], [nodeName, objectEntryName]);

  const [timeDomainState, setTimeDomainState] = useState<number>(timeDomain);


  useEffect(() => {

    async function asyncSetup() {

      let updateIntervalMillis: number;
      if (!buffering) {
        updateIntervalMillis = 10;
      } else {
        if (timeDomainState < 5000) {
          updateIntervalMillis = timeDomainState / 100;
        } else if (timeDomain < 10000) {
          updateIntervalMillis = timeDomainState / 50;
        } else {
          updateIntervalMillis = timeDomainState / 10;
        }
      }
      updateIntervalMillis ??= buffering ? timeDomainState / 25 : 10;
      updateIntervalMillis = Math.floor(updateIntervalMillis);
      smoothMode ??= updateIntervalMillis < 100;

      console.log(updateIntervalMillis);
      // fetch information!
      let information = await invoke<ObjectEntryInformation>("object_entry_information",
        { nodeName, objectEntryName });

      let graphList: ReactElement[] = [];

      // register tauri listener!
      let response = await invoke<ObjectEntryListenHistoryResponse>("listen_to_history_of_object_entry",
        { nodeName, objectEntryName, frameSize: timeDomainState, minInterval: updateIntervalMillis });
      // initalize history
      history.splice(0, history.length);
      history.push(...response.history);

      let acc: number = 0;
      let refreshRate: number;
      if (buffering) {
        if (updateIntervalMillis! < 5000) {
          refreshRate = 50;
        } else if (updateIntervalMillis! < 10000) {
          refreshRate = updateIntervalMillis! / 10;
        } else {
          refreshRate = updateIntervalMillis!;
        }
      } else {
        refreshRate = 10;
      }

      // this function creates a list of Graphs
      // for struct types it is called recursively.
      function buildGraphList(ty: Type, property: (event: ObjectEntryEvent) => Value, unit?: string) {
        acc += 1;
        if (ty.id == "int" || ty.id == "uint" || ty.id == "real") {
          graphList.push(<NumberGraph<ObjectEntryEvent>
            id={objectEntryName + acc}
            datum={{
              values: history,
              xValue: (event) => event.timestamp,
              yValue: (event) => property(event) as number,
            }}
            height={200}
            unit={unit}
            interpolation={interpolation}
            refreshRate={refreshRate}
            timeDomainMs={timeDomainState}
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
            height={200}
            unit={unit}
            interpolation={interpolation}
            refreshRate={refreshRate}
            timeDomainMs={timeDomainState}
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
      let unlistenJs = listen<ObjectEntryHistoryEvent>(response.event_name, (event) => {
        // update history
        history.splice(0, event.payload.deprecated_count);
        history.push(...event.payload.new_values);
      });

      return () => {
        // unregister js listener
        unlistenJs.then(f => f()).catch(console.error);
        // async unregister tauri listener
        invoke("unlisten_from_history_of_object_entry",
          { nodeName, objectEntryName, eventName: response.event_name }).catch(console.error);
      }
    }

    let asyncCleanup = asyncSetup();



    return () => {
      // reset component!
      // setTimeDomain(DEFAULT_TIMEDOMAIN);
      // async cleanup of listeners
      asyncCleanup.then(f => f()).catch(console.error);
    };
  }, [nodeName, objectEntryName, buffering, smoothMode, interpolation, timeDomainState]);


  function clampTimeDomain(domain: number) {
    if (domain <= 1000){
      return 1000;
    }
    if (domain >= 60000*3) {
      return 60000 * 3;
    } 
    return domain;
  }

  function handleScrollWheel(event: any) {
    setTimeDomainState(oldDomain => {
      let factor: number;
      if (event.altKey) {
        factor = 1;
      } else if (event.shiftKey) {
        factor = 100;
      } else {
        factor = 10;
      }
      let newDomain = oldDomain + (event.deltaY + event.deltaX) * factor;
      newDomain = clampTimeDomain(newDomain);
      return Math.floor(newDomain);
    });
  }

  if (graphList.length != 0) {
    return <div onWheel={handleScrollWheel}>
      <Stack spacing={2} sx={{ width: "calc(100% - 16px)" }}>{graphList}</Stack>
    </div>;
  } else {
    return <Skeleton variant="rounded" height={"200px"} />;
  }
}

export default ObjectEntryGraph;
