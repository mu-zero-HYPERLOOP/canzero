import { Stack } from "@mui/material";
import EnumPropertyField from "../../object_entry/edit_dialog/EnumPropertyField";
import RealPropertyField from "../../object_entry/edit_dialog/RealPropertyField";

function AirgapTransition() {

  return (
    <Stack direction="column" justifyContent="start" spacing={1}
      sx={{
        width: "100%",
      }}>
      <RealPropertyField
      nodeName={"mother_board"}
      objectEntryName={"target_airgap"}
      label={"target-airgap"}
      width="100%"
      />
      <EnumPropertyField
      nodeName={"mother_board"}
      objectEntryName={"airgap_transition_mode"}
      label={"transition-function"}
      width="100%"
      />
      <RealPropertyField
      nodeName={"mother_board"}
      objectEntryName={"airgap_transition_duration"}
      label={"transition-duration"}
      width="100%"
      />
    </Stack>
  );
}

export default AirgapTransition;
