import { invoke } from '@tauri-apps/api/tauri'
import { listen, Event, UnlistenFn } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import ObjectEntryListenHistoryResponse from '../types/ObjectEntryListenHistoryResponse';
import ObjectEntryEvent from '../types/ObjectEntryEvent';
import { ObjectEntryHistoryEvent } from '../types/ObjectEntryHistoryEvent';

interface GraphProps {
  nodeName: string,
  oeName: string,
}


function Graph({ nodeName, oeName }: GraphProps) {
  const [history, setHistory] = useState<ObjectEntryEvent[]>([]);

  const frameSize: number = 1000; // in milliseconds
  const minInterval: number = 10; // in milliseconds


  useEffect(() => {

    const asyncGetInitialData = async () => {

      let historyResponse = await invoke<ObjectEntryListenHistoryResponse>('listen_to_history_of_object_entry',
        { nodeName: nodeName, objectEntryName: oeName, frameSize, minInterval });

      setHistory(historyResponse.history);

      const handleNewEvent = (evt: Event<ObjectEntryHistoryEvent>) => {
        setHistory(oldVec => {
          // payload is a vector!
          // interesstingly concat performs a lot worst than push
          //return oldVec.concat(evt.payload) 
          let newVec = oldVec.slice(evt.payload.deprecated_count);
          newVec.push(...evt.payload.new_values);
          return newVec;
        })
      };

      let unsubscribe = await listen<ObjectEntryHistoryEvent>(historyResponse.event_name, handleNewEvent);

      return () => {
        unsubscribe()
        invoke("unlisten_from_history_of_object_entry",
          { nodeName, objectEntryName: oeName, eventName: historyResponse.event_name }
        ).catch(console.error);
      };
    };

    let unsubscribe: Promise<UnlistenFn> = asyncGetInitialData();


    return () => {
      unsubscribe.then(f => f()).catch(console.error);
    };
  }, [nodeName, oeName]);

  return <LineChart width={600} height={500} data={history}>
    <Line type="linear" dataKey="value" stroke="black" isAnimationActive={false} dot={false} />
    <CartesianGrid stroke="secondary" strokeDasharray="5 5" />
    <XAxis dataKey="timestamp" />
    <YAxis />
    <Tooltip />
  </LineChart>
}

export default Graph;
