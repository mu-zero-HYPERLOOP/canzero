import { SetStateAction, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  InputAdornment,
  Modal,
  OutlinedInput,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import CreateIcon from "@mui/icons-material/Create";
import {
  isInt,
  isObjectEntryCompositeType,
  isReal,
  isStringArray,
  isUint,
  ObjectEntryInformation,
  ObjectEntryType
} from "./types/ObjectEntryInformation.ts";
import ObjectEntryEvent from "./types/ObjectEntryEvent.ts";
import { invoke } from "@tauri-apps/api";
import ObjectEntryListenLatestResponse from "./types/ObjectEntryListenLatestResponse.ts";
import { listen } from "@tauri-apps/api/event";

function sendInput(node: string, objectEntry: string, val: string) {
  return invoke("set_object_entry_value", {
    nodeName: node,
    objectEntryName: objectEntry,
    newValueJson: val,
  })
}

function checkAndSendInput(node: string, objectEntry: string, val: string, type: ObjectEntryType, setError: {
  (value: SetStateAction<boolean>): void;
  (arg0: boolean): void;
}) {
  setError(false)

  if (isInt(type)) {
    if (!val.includes(".")) {
      let num = parseInt(val)
      if (!isNaN(num)) {
        sendInput(node, objectEntry, num.toString()).catch((_) => setError(true));
        return;
      }
    }
  } else if (isUint(type)) {
    if (!val.includes(".")) {
      let num = parseInt(val)
      if (!isNaN(num) && num >= 0) {
        sendInput(node, objectEntry, num.toString()).catch((_) => setError(true));
        return;
      }
    }
  } else if (isReal(type)) {
    let num = parseFloat(val)
    if (!isNaN(num)) {
      sendInput(node, objectEntry, num.toString()).catch((_) => setError(true));
      return;
    }
  } else if (isStringArray(type)) {
    sendInput(node, objectEntry, val).catch((_) => setError(true));
    return;
  } else if (isObjectEntryCompositeType(type)) {
    invoke("set_object_entry_value", {
      nodeName: node,
      objectEntryName: objectEntry,
      newValueJson: val
    }).catch((_) => setError(true));
    return;
  } else {
    setError(true)
  }
}

const dialogStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper',
  boxShadow: 24,
  pt: 2,
  px: 4,
  pb: 3,
};

interface EditDialogProps {
  open: boolean,
  onClose: () => void,
  nodeName: string,
  objectEntryName: string,
}

function EditDialog({ onClose, open, nodeName, objectEntryName }: Readonly<EditDialogProps>) {

  let [information, setInformation] = useState<ObjectEntryInformation | null>(null);
  let [value, setValue] = useState<ObjectEntryEvent | null>(null);
  let [error, setError] = useState<boolean>(false);
  const newValue = useRef<string>("");

  function updateValue(event: ObjectEntryEvent) {
    console.log("update value!");
    setValue(event);
  }

  async function fetchInformation() {
    let information = await invoke<ObjectEntryInformation>("object_entry_information",
      { nodeName, objectEntryName });
    setInformation(information);
    return information;
  }

  async function registerListener() {
    let { event_name, latest } = await invoke<ObjectEntryListenLatestResponse>("listen_to_latest_object_entry_value",
      { nodeName, objectEntryName });
    updateValue(latest);
    let unlistenBackend = () => invoke("unlisten_from_latest_object_entry_value", {
      nodeName,
      objectEntryName
    }).catch(console.error);

    let unlistenReact = await listen<ObjectEntryEvent>(event_name, event => updateValue(event.payload));

    return () => {
      unlistenBackend();
      unlistenReact();
    }
  }

  async function asyncTask() {
    let information = await fetchInformation();
    console.log("fetched information", information);
    // wait for fetch Information to be complete before listeningS
    // allows using the information in updateValue!
    return await registerListener();
  }

  useEffect(() => {
    if (open) {
      console.log("use effect");
      let cleanup = asyncTask();
      return () => {
        cleanup.then(f => f()).catch(console.error);
        setInformation(null);
        setValue(null);
      }
    }
  }, [nodeName, objectEntryName, open]);

  let adornment = information?.unit ? <InputAdornment position="end">{information.unit}</InputAdornment> : undefined;

  return <Modal
    open={open && information != null}
    onClose={onClose}>
    <Paper sx={{ ...dialogStyle }}>
      <Stack direction="column" spacing={2}>
        <Stack direction="row" sx={{
          position: "relative",
          left: "-10px",
        }}>
          <Typography fontWeight={20} sx={{ marginRight: "8px" }}>
            <strong>Edit:</strong>
          </Typography>
          <Typography>
            {`${information?.name} of ${nodeName}`}
          </Typography>
        </Stack>
        <FormControl sx={{ width: '25ch' }} variant="outlined">
          <FormHelperText id="outlined-weight-helper-text1">
            Weight
          </FormHelperText>
          <OutlinedInput
            placeholder={value ? `${value.value}` : undefined}
            id="outlined-adornment-weight1"
            endAdornment={adornment}
            aria-describedby="outlined-weight-helper-text1"
            inputProps={{
              'aria-label': 'weight',
            }}
            onAnimationStart={() => setError(false)}
            onChange={(event) => {
              newValue.current = event.target.value
            }}
            error={error}
          />
        </FormControl>
        <Box component="form"
          sx={{
            display: "flex",
            justifyContent: "flex-end",
          }}
        >

          <Button
            variant="outlined"
            sx={{
              marginLeft: "auto",
            }}
            onClick={() => {
              if (information) checkAndSendInput(nodeName, information.name, newValue.current, information.ty, setError)
            }}
          >
            Upload
          </Button>
        </Box>
      </Stack>
    </Paper>
  </Modal>
}
interface SetValueButtonProps {
  nodeName: string,
  objectEntryName: string,
}

function SetValueButton({ nodeName, objectEntryName }: Readonly<SetValueButtonProps>) {
  let [showDialog, setShowDialog] = useState(false);

  return <>
    <Button
      variant="outlined"
      startIcon={
        <CreateIcon />
      }
      color="primary"
      size="small"
      sx={{
        position: "absolute",
        top: "10px",
        right: "60px",
        width: "100px",
      }}
      onClick={() => setShowDialog(true)}
    >
      Edit
    </Button>
    <EditDialog
      open={showDialog}
      onClose={() => setShowDialog(false)}
      nodeName={nodeName}
      objectEntryName={objectEntryName}
    />
  </>
}

export default SetValueButton
