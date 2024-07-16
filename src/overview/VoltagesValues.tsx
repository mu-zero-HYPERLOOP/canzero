import { Paper, Stack, Typography, useTheme } from "@mui/material";
import useObjectEntryValue from "../hooks/object_entry_value.ts";
import useObjectEntryInfo from "../hooks/object_entry_info.ts";


interface VoltagesValuesProps {
  width?: string,
  height?: string,
}

interface EntryProps {
  label: string,
  nodeName: string,
  objectEntryName: string,
  min: number,
  max: number,
}

function Entry({ label, nodeName, objectEntryName, min, max }: Readonly<EntryProps>) {
  const theme = useTheme();

  const value = useObjectEntryValue(nodeName, objectEntryName);
  const info = useObjectEntryInfo(nodeName, objectEntryName);

  let unit = (info?.unit ?? "") as string;
  let color = theme.palette.background.paper2
  if (value !== undefined) {
      if ((value as number) > max || (value as number) < min) color = theme.palette.temperatureHot.main
  }

  return (
    <Paper sx={{
      backgroundColor: color,
      marginLeft: "0.25em", marginRight: "0.25em",
      marginBottom: "0.25em",
      height: `2.5em`
    }}>
      <Stack direction="row" justifyContent="space-between" paddingTop="0.8em" paddingLeft="0.5em" paddingRight="0.5em">
        <Stack direction="row" justifyContent="space-around" sx={{
          width: "50%",
          paddingLeft: "0.5em",
        }}>
          <Typography variant="body2" fontSize={12} width="70%">
            {label}
          </Typography>
          <Typography variant="body2" fontSize={16} width="70%" sx={{
            position: "relative",
            top: "-0.25em",
          }}>
            {(value === undefined) ? `?${unit}` : `${(value as number).toFixed(2)}${unit}`}
          </Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-around" margin={0} padding={0} width="30%">
          <Typography variant="body2" fontSize={12} width="15vh" textAlign="left">
            {`Min: ${min}${unit}`}
          </Typography>
          <Typography variant="body2" fontSize={12} width="15vh" textAlign="left">
            {`Max: ${max}${unit}`}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  )
}

function VoltagesValues({ width, height }: Readonly<VoltagesValuesProps>) {

  return (
    <Paper component="div" sx={{
      width,
      height,
    }}>
      <Stack sx={{
        padding: 0,
        paddingTop: "0.25em",
      }} direction="column" justifyContent="space-between">
        <Entry label="Battery-Voltage:" nodeName="input_board" objectEntryName="bat24_voltage" min={22.2} max={29} />
        <Entry label="Supercap-Voltage:" nodeName="input_board" objectEntryName="supercap_voltage" min={30} max={50} />
        <Entry label="Link45-Voltage:" nodeName="input_board" objectEntryName="link45_voltage" min={0} max={50} />
        <Entry label="Link24-Current:" nodeName="input_board" objectEntryName="link24_current" min={2} max={20} />
        <Entry label="Link45-Current:" nodeName="input_board" objectEntryName="link45_current" min={0} max={150} />
      </Stack>
    </Paper>
  );
}

export default VoltagesValues;
