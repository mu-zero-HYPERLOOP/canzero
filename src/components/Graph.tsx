import { invoke} from '@tauri-apps/api/tauri'
import { listen, Event, UnlistenFn } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import ObjectEntryListenHistoryResponse from '../types/ObjectEntryListenHistoryResponse';
import ObjectEntryEvent from '../types/ObjectEntryEvent';

interface GraphProps {
  nodeName: string,
  oeName: string,
}


function Graph({ nodeName, oeName }: GraphProps) {
  const [history, setHistory] = useState<ObjectEntryEvent[]>([]);

  const frame_size : number = 10000; // in milliseconds


  useEffect(() => {
    console.log("graph useEffect called");

    const asyncGetInitialData = async () => {

      let historyResponse = await invoke<ObjectEntryListenHistoryResponse>('listen_to_history_of_object_entry',
        { nodeName: nodeName, objectEntryName: oeName, frame_size});

      setHistory(historyResponse.history);

      const handleNewEvent = (evt: Event<ObjectEntryEvent[]>) => {
        console.log("graph received batch event: " + evt);
        setHistory(oldVec => {
          console.log("new values arrived");
          // payload is a vector!
          // interesstingly concat performs a lot worst than push
          //return oldVec.concat(evt.payload) 
          let newVec = oldVec.slice();
          newVec.push(...evt.payload);
          return newVec;
        })
      };

      console.log("graph listening to events of name: " + historyResponse.event_name);
      return await listen<ObjectEntryEvent[]>(historyResponse.event_name, handleNewEvent);
    };

    let unsubscribe : Promise<UnlistenFn> = asyncGetInitialData();


    return () => {
      console.log("graph destructor called");
      unsubscribe.then(f => f()).catch(console.error);
    };
  }, [nodeName, oeName]);

  return <LineChart width={1200} height={500} data={history}>
    <Line type="linear" dataKey="value" stroke="black" isAnimationActive={false} dot={false} />
    <CartesianGrid stroke="secondary" strokeDasharray="5 5" />
    <XAxis dataKey="timestamp" />
    <YAxis />
    <Tooltip />
  </LineChart>
}

export default Graph;
