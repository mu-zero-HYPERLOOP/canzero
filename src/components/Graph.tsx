import { invoke } from '@tauri-apps/api/tauri'
import { LineChart } from '@mui/x-charts/LineChart';
import { listen } from "@tauri-apps/api/event";
import { useEffect, useState, useRef } from "react";

function Graph() {
  console.log("graph executed");
  const [vec, setVec] = useState([0]);
  const isInitializedRef = useRef(false);
  const eventHandleRef = useRef("default");

  // graph_object is JSON object (struct in rust)
  if (!isInitializedRef.current) {
    isInitializedRef.current = true;
    invoke('initialize_graph' , { source: 42 }).then((graph_object) => {
      setVec(graph_object["passed_values"]);
      eventHandleRef.current = graph_object["event_handle"];
      console.log("graph_event_handle: " + eventHandleRef.current);
    }).catch((error) => {
      console.error("error initializing graph " + error);
    });
  }

    useEffect(() => {
      console.log("useEffect called");
      if (isInitializedRef.current === true) {
        let unsubscribe = listen<number>("random-integer" , (event) => {

            console.log("listener executed");
            setVec(oldVec => {
              let newVec = oldVec.slice(1, oldVec.length);
              newVec.push(event.payload);
              return newVec;
            });

        });
        // the lambda returned will be executed on cleanup of the effect.
        return () => {
            console.log("destructor called");
            unsubscribe.then(f => f());
        };
      }
    }, []);

  let xRange = Array.from(Array(vec.length), (_, index) => index);
  
  return <LineChart
     xAxis={[{ data: xRange }]}
      series={[
        {
          data: vec,
        },
      ]}
      width={500}
      height={300}
  />
}

export default Graph;
