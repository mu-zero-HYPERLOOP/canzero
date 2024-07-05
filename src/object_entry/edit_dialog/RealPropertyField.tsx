
import { IconButton, Skeleton, Stack } from "@mui/material";
import { useState } from "react";

import UploadIcon from '@mui/icons-material/Upload';
import RefreshIcon from "@mui/icons-material/Refresh";
import useObjectEntryInfo from "../../hooks/object_entry_info";
import useObjectEntryValue from "../../hooks/object_entry_value";
import { RealTypeInfo } from "../types/Type";
import sendSetReq from "../../divisions/levitation/set_req_util";
import RealPropertyInputField from "./RealPropertyInputField";
import { invoke } from "@tauri-apps/api";


interface RealPropertyFieldProps {
  nodeName: string,
  objectEntryName: string,
  label?: string,
  width?: string,
}


function RealPropertyField({
  nodeName,
  objectEntryName,
  label,
  width = "75ch"
}: Readonly<RealPropertyFieldProps>) {
  const info = useObjectEntryInfo(nodeName, objectEntryName);
  const value = useObjectEntryValue(nodeName, objectEntryName);

  const [input, setInput] = useState<number | null>();

  function onUpload() {
    sendSetReq(nodeName, objectEntryName, input!);
  }

  return (
    <Stack
      direction="row"
      justifyContent="start"
      alignItems={"center"}
      spacing={2}
      sx={{
        width,
      }}>
      {info === undefined ? <Skeleton width="100%" /> : <>
        <RealPropertyInputField
          name={label ?? `${nodeName}::${objectEntryName}`}
          min={(info.ty.info as RealTypeInfo).min}
          max={(info.ty.info as RealTypeInfo).max}
          bitSize={(info.ty.info as RealTypeInfo).bit_size}
          currentValue={value as number}
          onUpdate={(x) => setInput(x)}
        />
        <IconButton
          size="small"
          sx={{
            width: "35px",
            height: "35px",
          }}
          onClick={onUpload}
          disabled={input === null || input === undefined}
        >
          <UploadIcon />
        </IconButton>

        <IconButton
          size="small"
          sx={{
            width: "35px",
            height: "35px",
          }}
          onClick={() => {
            invoke("request_object_entry_value", {
              nodeName,
              objectEntryName,
            }).catch(console.error);
          }}
        >
          <RefreshIcon />
        </IconButton>
      </>
      }
    </Stack>
  );
}

export default RealPropertyField;
