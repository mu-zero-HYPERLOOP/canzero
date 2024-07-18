import {Box, Paper, Stack, Typography, useTheme} from "@mui/material";
import useObjectEntryValue from "../hooks/object_entry_value.ts";
import useObjectEntryInfo from "../hooks/object_entry_info.ts";
import interpolate from "color-interpolate";
import "./ColorBar.css"
import {useEffect} from "react";


function getLightColorInterpolate(value: number, min: number, max: number) {
  let colormap = interpolate(['#93ee9a', '#ffeb7b', '#ff816e']);
  let percent = (value - min) / (max - min)
  return colormap(percent)
}

function getMainColorInterpolate(value: number, min: number, max: number) {
  let colormap = interpolate(['#2E9B33', '#FFD500', '#E32E13']);
  let percent = (value - min) / (max - min)
  return colormap(percent)
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

  let value = useObjectEntryValue(nodeName, objectEntryName);
  const info = useObjectEntryInfo(nodeName, objectEntryName);

  let unit = (info?.unit ?? "") as string;
  let color = theme.palette.background.paper2
  if (value !== undefined) {
      color = getLightColorInterpolate(value as number, min, max)
  }

  useEffect(() => {
    const paper = document.getElementById(label)!;
    const bar = paper.getElementsByClassName("color-bar")[0] as HTMLElement;

    if (value !== undefined) {
      value = value as number;
      value = Math.max(min, value)
      value = Math.min(value, max)
      bar.style.setProperty("--color", `${getMainColorInterpolate(value, min, max)}`);
      bar.style.setProperty("--width", `${(48.1) * (value - min) / (max - min)}%`);
    }

  }, []);

  return (
    <Paper id={label} sx={{
      backgroundColor: color,
      marginLeft: "0.25em", marginRight: "0.25em",
      marginBottom: "0.25em",
      height: `2.5em`
    }}>
      <Box className="color-bar">
        <div className="bar">
        </div>
      </Box>
      <Stack direction="row" justifyContent="space-between" paddingTop="0.8em" paddingLeft="0.5em" paddingRight="0.5em">
        <Stack direction="row" justifyContent="space-around" sx={{
          width: "50%",
          paddingLeft: "0.5em",
        }}>
          <Typography variant="body2" fontSize={12} width="70%" sx={{position: "relative",}}>
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
          <Typography variant="body2" fontSize={12} width="15vh" textAlign="left" sx={{position: "relative",}}>
            {`Min: ${min}${unit}`}
          </Typography>
          <Typography variant="body2" fontSize={12} width="15vh" textAlign="left" sx={{position: "relative",}}>
            {`Max: ${max}${unit}`}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  )
}

interface VoltagesValuesProps {
  width?: string,
  height?: string,
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
        <Entry label="Battery-Temperature:" nodeName="input_board" objectEntryName="bat24_temperature_max" min={0} max={50} />
        <Entry label="Link24-Current:" nodeName="input_board" objectEntryName="link24_current" min={2} max={20} />
        <Entry label="Link45-Current:" nodeName="input_board" objectEntryName="link45_current" min={0} max={150} />
      </Stack>
    </Paper>
  );
}

export default VoltagesValues;
