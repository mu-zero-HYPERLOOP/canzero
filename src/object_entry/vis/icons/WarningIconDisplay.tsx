import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, Typography } from "@mui/material";
import useObjectEntryValue from "../../../hooks/object_entry_value.ts";
import theme from "../../../theme.ts";


function WarningIconDisplay() {

  const state = useObjectEntryValue("mother_board", "error_any")

  let color = theme.palette.background.disabled

  if (state === "INFO") color = "blue"
  else if (state === "WARNING") color = "orange"
  else if (state === "ERROR") color = "red"

  return (
    <Box component="div" sx={{
      textAlign: "center",
    }}>
      <FontAwesomeIcon id="warning-icon" color={color} icon={faTriangleExclamation} fontSize="30px" />
      <Typography color="white">
        Warning
      </Typography>
    </Box>
  );

}

export default WarningIconDisplay;

