import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import ErrorEvent from "../object_entry/types/events/ErrorEvent";



function useCanzeroErrors() {

  const [errors, setErrors] = useState<ErrorEvent[]>([]);
  useEffect(() => {
    invoke<ErrorEvent[]>("listen_to_errors").then(setErrors);
    console.log("listen");
    let unlisten = listen<ErrorEvent[]>("canzero_errors", event => {
      setErrors(event.payload)
    });

    return () => {
      invoke("unlisten_from_errors").catch(console.error);
      unlisten.then(f => f()).catch(console.error);
    }
  }, []);
  return errors;

}


export default useCanzeroErrors;
