import { IconButton, Skeleton, Stack } from "@mui/material";
import { useState } from "react";
import EnumPropertyInputField from "./EnumPropertyInputField";

import UploadIcon from '@mui/icons-material/Upload';
import RefreshIcon from "@mui/icons-material/Refresh";
import useObjectEntryInfo from "../../hooks/object_entry_info";
import useObjectEntryValue from "../../hooks/object_entry_value";
import { EnumTypeInfo } from "../types/Type";
import sendSetReq from "../../divisions/levitation/set_req_util";
import { invoke } from "@tauri-apps/api";


interface EnumPropertyFieldProps {
  nodeName: string,
  objectEntryName: string,
  label?: string,
  width?: string,
}


function EnumPropertyField({
  nodeName,
  objectEntryName,
  label,
  width = "75ch"
}: Readonly<EnumPropertyFieldProps>) {
  const info = useObjectEntryInfo(nodeName, objectEntryName);
  const value = useObjectEntryValue(nodeName, objectEntryName);

  const [input, setInput] = useState<string | null>(null);

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
        <EnumPropertyInputField
          variants={(info.ty.info as EnumTypeInfo).variants}
          currentValue={value as string}
          onUpdate={x => setInput(x)}
          name={label ?? `${nodeName}::${objectEntryName}`}
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

export default EnumPropertyField;
