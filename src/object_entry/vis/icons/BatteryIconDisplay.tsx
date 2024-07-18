import { faCarBattery } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, Tooltip, Typography } from "@mui/material";
import { ObjectEntryListenLatestResponse } from "../../types/events/ObjectEntryListenLatestResponse";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import { ObjectEntryEvent } from "../../types/events/ObjectEntryEvent";
import theme from "../../../theme.ts";
import useObjectEntryValue from "../../../hooks/object_entry_value.ts";


const OE = { nodeName: "input_board", objectEntryName: "error_level_bat24_under_voltage" };
const BAT24_VOLTAGE = { nodeName: "input_board", objectEntryName: "bat24_voltage" };
const BAT24_CURRENT = { nodeName: "input_board", objectEntryName: "bat24_current" };
const BAT24_TEMP = { nodeName: "input_board", objectEntryName: "bat24_temperature_max" };

function BatteryIconDisplay() {

  const [state, setState] = useState<string>("");
  const bat24Voltage = useObjectEntryValue(BAT24_VOLTAGE.nodeName,
    BAT24_VOLTAGE.objectEntryName);
  const bat24Current = useObjectEntryValue(BAT24_CURRENT.nodeName,
    BAT24_CURRENT.objectEntryName);
  const bat24Temperature = useObjectEntryValue(BAT24_TEMP.nodeName,
    BAT24_TEMP.objectEntryName);

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
        console.error(`Failed to register listener for battery icon: Object entry ${OE.nodeName}:${OE.objectEntryName} not found`);
        return () => {
        }
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
    <Tooltip title={
        <div>
          <p>{`Voltage : ${(bat24Voltage as number)?.toFixed(2)}V`}</p>
          <p>{`Current : ${(bat24Current as number)?.toFixed(2)}A`}</p>
          <p>{`Temperature : ${(bat24Temperature as number)?.toFixed(2)}C`}</p>
        </div>} >
      <Box component="div" sx={{
        textAlign: "center",
      }}>
        <FontAwesomeIcon color={color} icon={faCarBattery} fontSize="30px" />
        <Typography color="white">
          Battery
        </Typography>
      </Box>
    </Tooltip>
  );
}

export default BatteryIconDisplay;
