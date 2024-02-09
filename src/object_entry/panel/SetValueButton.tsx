import { IconButton, SxProps, Theme } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import { useState } from "react";
import { ObjectEntryInformation } from "../types/ObjectEntryInformation";
import EditDialog from "../edit_dialog/EditDialog";

interface SetValueButtonProps {
  nodeName: string,
  objectEntryInfo: ObjectEntryInformation,
  sx: SxProps<Theme>,
}

function SetValueButton({ nodeName, objectEntryInfo, sx }: Readonly<SetValueButtonProps>) {
  let [showDialog, setShowDialog] = useState(false);

  return <>
    <IconButton
      size="small"
      onClick={() => setShowDialog(true)}
      sx={sx}
    >
      <EditIcon fontSize="small" />
    </IconButton>
    {showDialog ? <EditDialog
      open={showDialog}
      onClose={() => setShowDialog(false)}
      nodeName={nodeName}
      objectEntryInfo={objectEntryInfo}
    /> : undefined}
  </>

}

export default SetValueButton
