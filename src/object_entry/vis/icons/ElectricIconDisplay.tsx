import { Bolt } from "@mui/icons-material";
import { Box, Tooltip, Typography } from "@mui/material";
import { ObjectEntryListenLatestResponse } from "../../types/events/ObjectEntryListenLatestResponse";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import { ObjectEntryEvent } from "../../types/events/ObjectEntryEvent";
import theme from "../../../theme.ts";
import useObjectEntryValue from "../../../hooks/object_entry_value.ts";


const OE = { nodeName: "input_board", objectEntryName: "system_sdc_status" };

function ElectricIconDisplay() {

  const [state, setState] = useState<boolean>(false);

  useEffect(() => {
    async function asyncSetup() {
      try {
        const resp = await invoke<ObjectEntryListenLatestResponse>("listen_to_latest_object_entry_value", OE);
        if (resp.latest !== undefined && resp.latest !== null) {
          setState(resp.latest.value as string == "CLOSED");
        }
        const unlisten = await listen<ObjectEntryEvent>(resp.event_name, event => {
          setState(event.payload.value as string == "CLOSED");
        });
        return () => {
          unlisten();
          invoke("unlisten_from_latest_object_entry_value", OE).catch(console.error);
        };
      } catch (e) {
        console.error(`Failed to register listener for electric icon: Object entry ${OE.nodeName}:${OE.objectEntryName} not found`);
        return () => {
        }
      }
    }
    const asyncCleanup = asyncSetup();

    return () => {
      asyncCleanup.then(f => f()).catch(console.error);
    };

  }, []);

  const link45Voltage = useObjectEntryValue("input_board", "link45_voltage");
  const supercapVoltage = useObjectEntryValue("input_board", "supercap_voltage");
  const link45Current = useObjectEntryValue("input_board", "link45_current");

  return (
    <Tooltip title={
      <div>
        <p>{`Link45-Voltage : ${(link45Voltage as number)?.toFixed(2)}V`}</p>
        <p>{`Link45-Current : ${(link45Current as number)?.toFixed(2)}A`}</p>
        <p>{`Supercap-Voltage : ${(supercapVoltage as number)?.toFixed(2)}V`}</p>
      </div>
      }>
      <Box component="div" sx={{
        textAlign: "center",
      }}>
        <Bolt id="electric-icon" sx={{ fontSize: "32px", color: state ? "blue" : theme.palette.background.disabled }} />
        <div style={{ marginBottom: "-6px" }} />
        <Typography color="white">
          Electric
        </Typography>
      </Box>
    </Tooltip>
  );
}

export default ElectricIconDisplay;
