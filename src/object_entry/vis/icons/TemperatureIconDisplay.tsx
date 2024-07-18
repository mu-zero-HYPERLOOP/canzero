import { Thermostat } from "@mui/icons-material";
import { Box, Tooltip, Typography } from "@mui/material";
import { invoke } from "@tauri-apps/api";
import { useEffect, useState } from "react";
import { ObjectEntryListenLatestResponse } from "../../types/events/ObjectEntryListenLatestResponse";
import { listen } from "@tauri-apps/api/event";
import { ObjectEntryEvent } from "../../types/events/ObjectEntryEvent";
import theme from "../../../theme.ts";
import useObjectEntryValue from "../../../hooks/object_entry_value.ts";



const OE = { nodeName: "mother_board", objectEntryName: "error_level_over_temperature_system" };


function Popup() {
  const l1l = useObjectEntryValue("levitation_board1", "magnet_temperature_left");
  const l1r = useObjectEntryValue("levitation_board1", "magnet_temperature_right");
  const l2l = useObjectEntryValue("levitation_board2", "magnet_temperature_left");
  const l2r = useObjectEntryValue("levitation_board2", "magnet_temperature_right");
  const l3l = useObjectEntryValue("levitation_board3", "magnet_temperature_left");
  const l3r = useObjectEntryValue("levitation_board3", "magnet_temperature_right");
  const g1l = useObjectEntryValue("guidance_board_front", "magnet_temperature_left");
  const g1r = useObjectEntryValue("guidance_board_front", "magnet_temperature_right");
  const g2l = useObjectEntryValue("guidance_board_front", "magnet_temperature_left");
  const g2r = useObjectEntryValue("guidance_board_front", "magnet_temperature_right");

  return (
    <div>
      <p>{`Levi1-LeftMagnet  : ${(l1l as number)?.toFixed(2)}C`}</p>
      <p>{`Levi1-RightMagnet : ${(l1r as number)?.toFixed(2)}C`}</p>
      <p>{`Levi2-LeftMagnet  : ${(l2l as number)?.toFixed(2)}C`}</p>
      <p>{`Levi2-RightMagnet : ${(l2r as number)?.toFixed(2)}C`}</p>
      <p>{`Levi3-LeftMagnet  : ${(l3l as number)?.toFixed(2)}C`}</p>
      <p>{`Levi3-RightMagnet : ${(l3r as number)?.toFixed(2)}C`}</p>
      <p>{`Guid1-LeftMagnet  : ${(g1l as number)?.toFixed(2)}C`}</p>
      <p>{`Guid1-RightMagnet : ${(g1r as number)?.toFixed(2)}C`}</p>
      <p>{`Guid2-LeftMagnet  : ${(g2l as number)?.toFixed(2)}C`}</p>
      <p>{`Guid2-RightMagnet : ${(g2r as number)?.toFixed(2)}C`}</p>
    </div>
  );
}

function TemperatureIconDisplay() {

  const [state, setState] = useState<string>("");

  useEffect(() => {
    async function asyncSetup() {
      try {
        const resp = await invoke<ObjectEntryListenLatestResponse>("listen_to_latest_object_entry_value", OE);
        if (resp.latest !== undefined && resp.latest !== null) {
          setState(resp.latest.value as string);
        }
        const unlisten = await listen<ObjectEntryEvent>(resp.event_name, event => {
          setState(event.payload.value as string);
        });
        return () => {
          unlisten();
          invoke("unlisten_from_latest_object_entry_value", OE).catch(console.error);
        };
      } catch (e) {
        console.error(`Failed to register listener for temperature icon: Object entry ${OE.nodeName}:${OE.objectEntryName} not found`);
        return () => { }
      }
    }
    const asyncCleanup = asyncSetup();

    return () => {
      asyncCleanup.then(f => f()).catch(console.error);
    };

  }, []);

    let color = theme.palette.background.disabled

    if (state === "INFO") color = "blue"
    else if (state === "WARNING") color = "orange"
    else if (state === "ERROR") color = "red"

  return (
    <Tooltip title={Popup()}>
      <Box component="div" sx={{
        textAlign: "center",
      }}>
        <Thermostat sx={{ fontSize: "32px", color: color }} />
        <div style={{ marginBottom: "-6px" }} />
        <Typography color="white">
          Temperature
        </Typography>
      </Box>
    </Tooltip>
  );
}

export default TemperatureIconDisplay;
