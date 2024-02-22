import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, Typography } from "@mui/material";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import { ObjectEntryEvent } from "../../types/events/ObjectEntryEvent";
import { useEffect, useState } from "react";
import { ObjectEntryListenLatestResponse } from "../../types/events/ObjectEntryListenLatestResponse";



const OE = {nodeName : "master", objectEntryName : "error_any"};

function WarningIconDisplay() {

  const [state, setState] = useState<boolean>(false);

  useEffect(()=>{
    async function asyncSetup() {
      const resp = await invoke<ObjectEntryListenLatestResponse>("listen_to_latest_object_entry_value", OE);
      if (resp.latest !== undefined && resp.latest !== null) {
        setState(resp.latest.value as string == "ERROR");
      }
      const unlisten = await listen<ObjectEntryEvent>(resp.event_name, event => {
          setState(event.payload.value as string == "ERROR");
      });
      return () => {
        unlisten();
        invoke("unlisten_from_latest_object_entry_value", OE).catch(console.error);
      };
    }
    const asyncCleanup = asyncSetup();

    return () => {
      asyncCleanup.then(f=>f()).catch(console.error);
    };

  },[]);

  return (
    <Box component="div" sx={{
      textAlign: "center",
    }}>
      <FontAwesomeIcon id="warning-icon" color={state ? "red": "grey"} icon={faTriangleExclamation} fontSize="40px"/>
      <Typography color="black">
        Warning
      </Typography>
    </Box>
  );

}

export default WarningIconDisplay;

