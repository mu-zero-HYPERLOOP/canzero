import { useEffect, useState } from "react";
import Mode from "./mode";
import { invoke } from "@tauri-apps/api";
import sendSetReq from "./set_req_util";
import { ObjectEntryListenLatestResponse } from "../../object_entry/types/events/ObjectEntryListenLatestResponse";
import { Value } from "../../object_entry/types/Value";
import { Button, ButtonGroup, IconButton, Stack } from "@mui/material";
import RealPropertyInputField from "../../object_entry/edit_dialog/RealPropertyInputField";

import { listen } from "@tauri-apps/api/event";

import UploadIcon from '@mui/icons-material/Upload';
import RefreshIcon from "@mui/icons-material/Refresh";
import { ObjectEntryEvent } from "../../object_entry/types/events/ObjectEntryEvent";
import UnsignedPropertyInputField from "../../object_entry/edit_dialog/UnsignedPropertyInputField";
import EnumPropertyInputField from "../../object_entry/edit_dialog/EnumPropertyInputField";

function PIDControl() {

  const [Kp, setKp] = useState<number>();
  const [Ki, setKi] = useState<number>();
  const [Kd, setKd] = useState<number>();
  const [KiMin, setKiMin] = useState<number>();
  const [KiMax, setKiMax] = useState<number>();
  const [maxForce, setMaxForce] = useState<number>();
  const [errorFilterMode, setErrorFilterMode] = useState<string>();
  const [errorBoxcarN, setErrorBoxcarN] = useState<number>();
  const [errorEmaAlpha, setErrorEmaAlpha] = useState<number>();
  const [convFilterMode, setConvFilterMode] = useState<string>();
  const [convBoxcarN, setConvBoxcarN] = useState<number>();
  const [convEmaAlpha, setConvEmaAlpha] = useState<number>();

  const [KpInput, setKpInput] = useState<number | null>();
  const [KiInput, setKiInput] = useState<number | null>();
  const [KdInput, setKdInput] = useState<number | null>();
  const [KiMinInput, setKiMinInput] = useState<number | null>();
  const [KiMaxInput, setKiMaxInput] = useState<number | null>();
  const [maxForceInput, setMaxForceInput] = useState<number | null>();
  const [errorFilterModeInput, setErrorFilterModeInput] = useState<string | null>();
  const [errorBoxcarNInput, setErrorBoxcarNInput] = useState<number | null>();
  const [errorEmaAlphaInput, setErrorEmaAlphaInput] = useState<number | null>();
  const [convFilterModeInput, setConvFilterModeInput] = useState<string | null>();
  const [convBoxcarNInput, setConvBoxcarNInput] = useState<number | null>();
  const [convEmaAlphaInput, setConvEmaAlphaInput] = useState<number | null>();


  const [mode, setMode] = useState(Mode.All);


  async function refresh(nodeName: string) {
    await invoke("request_object_entry_value", {
      nodeName,
      objectEntryName: "airgap_pid",
    });

    await invoke("request_object_entry_value", {
      nodeName,
      objectEntryName: "airgap_pid_extra",
    });
  }

  function onRefreshClick() {
    switch (mode) {
      case Mode.Board1: {
        refresh("levitation_board1").catch(console.error);
        break;
      }
      case Mode.Board2: {
        refresh("levitation_board2").catch(console.error);
        break;
      }
      case Mode.Board3: {
        refresh("levitation_board3").catch(console.error);
        break;
      }
      case Mode.All: {
        refresh("levitation_board1").catch(console.error);
        break;
      }
    }
  }

  function uploadValid() {
    return KpInput !== null && KiInput !== null
      && KdInput !== null && KiMinInput !== null
      && KiMaxInput !== null && errorEmaAlphaInput !== null
      && Ki !== undefined && KiMin !== undefined
      && (
        KpInput !== undefined || KiInput !== undefined
        || KdInput !== undefined || KiMaxInput !== undefined
        || KiMinInput !== undefined || errorEmaAlphaInput !== undefined
      );
  }

  function onUploadClick() {
    const KpValue = (KpInput === undefined ? Kp : KpInput)!;
    const KiValue = (KiInput === undefined ? Ki : KiInput)!;
    const KdValue = (KdInput === undefined ? Kd : KdInput)!;
    const KiMinValue = (KiMinInput === undefined ? KiMin : KiMinInput)!;
    const KiMaxValue = (KiMaxInput === undefined ? KiMax : KiMaxInput)!;
    const maxForceValue = (maxForceInput === undefined ? maxForce : maxForceInput)!;
    const errorFilterModeValue = (errorFilterModeInput === undefined ? errorFilterMode : errorFilterModeInput)!;
    const errorBoxcarNValue = (errorBoxcarNInput === undefined ? errorBoxcarN : errorBoxcarNInput)!;
    const errorEmaAlphaValue = (errorEmaAlphaInput === undefined ? errorEmaAlpha : errorEmaAlphaInput)!;
    const convFilterModeValue = (convFilterModeInput === undefined ? convFilterMode : convFilterModeInput)!;
    const convBoxcarNValue = (convBoxcarNInput === undefined ? convBoxcarN : convBoxcarNInput)!;
    const convEmaAlphaValue = (convEmaAlphaInput === undefined ? convEmaAlpha : convEmaAlphaInput)!;


    const airgapPid = {
      Kp: KpValue,
      Ki: KiValue,
      Kd: KdValue,
    };
    const airgapPidExtra = {
      Ki_min: KiMinValue,
      Ki_max: KiMaxValue,
      force_max: maxForceValue,
      filter_mode: errorFilterModeValue,
      boxcar_n: errorBoxcarNValue,
      ema_alpha: errorEmaAlphaValue,
      conv_filter_mode: convFilterModeValue,
      conv_boxcar_n: convBoxcarNValue,
      conv_ema_alpha: convEmaAlphaValue,
    };
    switch (mode) {
      case Mode.Board1: {
        sendSetReq("levitation_board1", "airgap_pid", airgapPid);
        sendSetReq("levitation_board1", "airgap_pid_extra", airgapPidExtra);
        break;
      }
      case Mode.Board2: {
        sendSetReq("levitation_board2", "airgap_pid", airgapPid);
        sendSetReq("levitation_board2", "airgap_pid_extra", airgapPidExtra);
        break;
      }
      case Mode.Board3: {
        sendSetReq("levitation_board3", "airgap_pid", airgapPid);
        sendSetReq("levitation_board3", "airgap_pid_extra", airgapPidExtra);
        break;
      }
      case Mode.All: {
        sendSetReq("levitation_board1", "airgap_pid", airgapPid);
        sendSetReq("levitation_board1", "airgap_pid_extra", airgapPidExtra);
        sendSetReq("levitation_board2", "airgap_pid", airgapPid);
        sendSetReq("levitation_board2", "airgap_pid_extra", airgapPidExtra);
        sendSetReq("levitation_board3", "airgap_pid", airgapPid);
        sendSetReq("levitation_board3", "airgap_pid_extra", airgapPidExtra);
        break;
      }
    }
  }

  async function registerListener(nodeName: string) {
    await refresh(nodeName);

    const resp = await invoke<ObjectEntryListenLatestResponse>("listen_to_latest_object_entry_value", {
      nodeName,
      objectEntryName: "airgap_pid",
    });
    if (resp.latest !== undefined && resp.latest !== null) {
      const value = resp.latest.value as { [name: string]: Value };
      setKp(value["Kp"] as number);
      setKi(value["Ki"] as number);
      setKd(value["Kd"] as number);
    }
    const unregisterPID = await listen<ObjectEntryEvent>(resp.event_name, event => {
      const value = event.payload.value as { [name: string]: Value };
      setKp(value["Kp"] as number);
      setKi(value["Ki"] as number);
      setKd(value["Kd"] as number);
    });

    let respExtra = await invoke<ObjectEntryListenLatestResponse>("listen_to_latest_object_entry_value", {
      nodeName,
      objectEntryName: "airgap_pid_extra",
    });
    if (respExtra.latest !== undefined && respExtra.latest !== null) {
      const value = respExtra.latest.value as { [name: string]: Value };
      setKiMin(value["Ki_min"] as number);
      setKiMax(value["Ki_max"] as number);
      setMaxForce(value["force_max"] as number);
      setErrorFilterMode(value["filter_mode"] as string);
      setErrorBoxcarN(value["boxcar_n"] as number);
      setErrorEmaAlpha(value["ema_alpha"] as number);
      setConvFilterMode(value["conv_filter_mode"] as string);
      setConvBoxcarN(value["conv_boxcar_n"] as number);
      setConvEmaAlpha(value["conv_ema_alpha"] as number);
    }
    const unregisterExtra = await listen<ObjectEntryEvent>(respExtra.event_name, event => {
      const value = event.payload.value as { [name: string]: Value };
      setKiMin(value["Ki_min"] as number);
      setKiMax(value["Ki_max"] as number);
      setErrorEmaAlpha(value["ema_alpha"] as number);
    });

    return () => {
      unregisterPID();
      unregisterExtra();
      invoke("unlisten_from_latest_object_entry_value", {
        nodeName: "levitation_board1",
        objectEntryName: "airgap_pid",
      }).catch(console.error);
      invoke("unlisten_from_latest_object_entry_value", {
        nodeName: "levitation_board1",
        objectEntryName: "airgap_pid_extra",
      }).catch(console.error);
    };
  }

  useEffect(() => {
    async function asyncSetup(mode: Mode) {
      let unlisten;
      switch (mode) {
        case Mode.Board1: {
          unlisten = await registerListener("levitation_board1");
          break;
        }
        case Mode.Board2: {
          unlisten = await registerListener("levitation_board2");
          break;
        }
        case Mode.Board3: {
          unlisten = await registerListener("levitation_board3");
          break;
        }
        case Mode.All: {
          unlisten = await registerListener("levitation_board1");
          break;
        }
      }
      return () => {
        unlisten();
      };
    }

    const asyncCleanup = asyncSetup(mode);
    return () => {
      asyncCleanup.then(f => f()).catch(console.error);
    }
  }, [mode]);

  return (
    <Stack direction="column" justifyContent="space-between" spacing={2}>
      <Stack direction="row" spacing={2}>
        <Stack direction="column" justifyContent="start" spacing={1}
          sx={{
            width: "50%",
          }}>
          <RealPropertyInputField
            name={"Kp"}
            min={0}
            max={10000}
            onUpdate={(x) => setKpInput(x)}
            currentValue={Kp}
            bitSize={64}
            width="100%"
          />
          <RealPropertyInputField
            name={"Ki"}
            min={0}
            max={10000}
            onUpdate={(x) => setKiInput(x)}
            currentValue={Ki}
            bitSize={64}
            width="100%"
          />
          <RealPropertyInputField
            name={"Kd"}
            min={0}
            max={10000}
            onUpdate={(x) => setKdInput(x)}
            currentValue={Kd}
            bitSize={64}
            width="100%"
          />
          <RealPropertyInputField
            name={"MaxForce"}
            min={0}
            max={10000}
            onUpdate={(x) => setMaxForceInput(x)}
            currentValue={maxForce}
            bitSize={16}
            width="100%"
          />
          <EnumPropertyInputField
            name={"conv-FilterMode"}
            variants={["EMA", "BOXCAR"]}
            currentValue={convFilterMode}
            onUpdate={(x) => setConvFilterModeInput(x)}
            width="100%"
          />
          <UnsignedPropertyInputField
            name={"conv-BOX-N"}
            min={0}
            max={Math.pow(2.0, 15.0) - 1.0}
            bitSize={15}
            onUpdate={(x) => setConvBoxcarNInput(x)}
            currentValue={convBoxcarN}
            width="100%"
          />
        </Stack>
        <Stack direction="column" justifyContent="start" spacing={1}
          sx={{
            width: "50%",
          }}>
          <RealPropertyInputField
            name={"Ki_min"}
            min={-10000}
            max={0}
            onUpdate={(x) => setKiMinInput(x)}
            currentValue={KiMin}
            bitSize={64}
            width="100%"
          />
          <RealPropertyInputField
            name={"Ki_max"}
            min={0}
            max={10000}
            onUpdate={(x) => setKiMaxInput(x)}
            currentValue={KiMax}
            bitSize={64}
            width="100%"
          />
          <EnumPropertyInputField
            name={"error-FilterMode"}
            variants={["EMA", "BOXCAR"]}
            currentValue={errorFilterMode}
            onUpdate={(x) => setErrorFilterModeInput(x)}
            width="100%"
          />
          <RealPropertyInputField
            name={"error-EMA-α"}
            min={0}
            max={1}
            onUpdate={(x) => setErrorEmaAlphaInput(x)}
            currentValue={errorEmaAlpha}
            bitSize={64}
            width="100%"
          />
          <UnsignedPropertyInputField
            name={"error-BOX-N"}
            min={0}
            max={Math.pow(2.0, 16.0) - 1.0}
            bitSize={16}
            onUpdate={(x) => setErrorBoxcarNInput(x)}
            currentValue={errorBoxcarN}
            width="100%"
          />
          <RealPropertyInputField
            name={"conv-EMA-α"}
            min={0}
            max={1}
            onUpdate={(x) => setConvEmaAlphaInput(x)}
            currentValue={convEmaAlpha}
            bitSize={64}
            width="100%"
          />

        </Stack>
      </Stack>
      <Stack direction="row" justifyContent="end" spacing={2} sx={{
        width: "100%",
      }}>

        <IconButton
          size="small"
          sx={{
            width: "35px",
            height: "35px",
          }}
          disabled={!uploadValid()}
          onClick={onUploadClick}
        >
          <UploadIcon fontSize="small" />
        </IconButton>

        <IconButton
          size="small"
          sx={{
            width: "35px",
            height: "35px",
          }}
          onClick={onRefreshClick}
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
        <ButtonGroup variant="contained" aria-label="Basic button group">
          <Button variant={mode == Mode.Board1 ? "contained" : "text"}
            onClick={() => setMode(Mode.Board1)}>
            1
          </Button>
          <Button variant={mode == Mode.Board2 ? "contained" : "text"}
            onClick={() => setMode(Mode.Board2)}
          >
            2
          </Button>
          <Button variant={mode == Mode.Board3 ? "contained" : "text"}
            onClick={() => setMode(Mode.Board3)}>
            3
          </Button>
          <Button variant={mode == Mode.All ? "contained" : "text"}
            onClick={() => setMode(Mode.All)}>
            ∀
          </Button>
        </ButtonGroup>
      </Stack>
    </Stack >
  );
}

export default PIDControl;
