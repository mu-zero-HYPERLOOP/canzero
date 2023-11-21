import { Stack } from "@mui/material";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";

import React, { useEffect, useState } from "react";

interface SerializedSignalFrame {
  id: number;
  ide: boolean;
  rtr: boolean;
  dlc: number;
  signals: SerializedSignal[];
}

interface SerializedSignal {
  name: string;
  value: string;
}

interface SerializedUndefinedFrame {
  id: number;
  ide: boolean;
  rtr: boolean;
  dlc: number;
  data : number,
}

interface SerializedTypeFrame {
  id: number;
  ide: boolean;
  rtr: boolean;
  dlc: number;
  attributes: SerializedAttribute[];
}

interface SerializedAttribute {
  name: string;
  value: number | string | SerializedAttribute[];
}

interface SerializedFrame {
  SignalFrame?: SerializedSignalFrame;
  TypeFrame?: SerializedTypeFrame;
  UndefinedFrame?: SerializedUndefinedFrame;
  //ErrorFrame?: ErrorFrame;
}


function KarlsTraceExample() {

  const [rows, setRows] = useState<SerializedFrame[]>([]);

  function handle_event(frame: SerializedFrame) {
    let index = rows.findIndex((f) => {
      return JSON.stringify(f) == JSON.stringify(frame);
    });
    setRows((rows) => {
      rows[index] = frame;
      return rows;
    });
  }

  useEffect(() => {
    invoke<SerializedFrame[]>("listen_to_trace").then((frames) => {
      setRows((rows) => rows = frames);
      // console.log("initalize ", events);
    });

    let trace_event_listener = listen<SerializedFrame[]>("trace", (event) => {
      for (let frame of event.payload) {
        handle_event(frame);
      }
    });
    return () => {
      invoke("unlisten_to_trace")
      trace_event_listener.then((f) => f());
    }
  }, []);

  return (
    <Stack>
      {rows.map((row) => {
        if (row.TypeFrame) {
          let id = row.TypeFrame.id;
          let ide = row.TypeFrame.ide;
          let rtr = row.TypeFrame.rtr;
          let dlc = row.TypeFrame.dlc;

          let attributes = row.TypeFrame.attributes;
          
          console.log(attributes);
          let name = "{";
          for (let attrib of attributes) {
            name += `${attrib.value} = ${attrib.name}, `;
          }
          name += "}";

          return <p> TypeFrame : {id}{ide?"x":""} = {name} </p>;
        }else if (row.SignalFrame) {
          let id = row.SignalFrame.id;
          let ide = row.SignalFrame.ide;
          let rtr = row.SignalFrame.rtr;
          let dlc = row.SignalFrame.dlc;
          return <p> SignalFrame : {id}{ide?"x":""} </p>
        }else if (row.UndefinedFrame) {
          let id = row.UndefinedFrame.id;
          let ide = row.UndefinedFrame.ide;
          let rtr = row.UndefinedFrame.rtr;
          let dlc = row.UndefinedFrame.dlc;
          return <p> UndefinedFrame : {id}{ide?"x":""} </p>
        }else {
          return <p> WeirdFrame</p>
        }
      })}
    </Stack>
  )
}

export default KarlsTraceExample;
