import {Box, Paper, Stack, Typography, useTheme} from "@mui/material";
import useObjectEntryValue from "../hooks/object_entry_value.ts";
import useObjectEntryInfo from "../hooks/object_entry_info.ts";
import interpolate from "color-interpolate";
import "./ColorBar.css"
import {useEffect} from "react";

function getLightColorInterpolate(rgb: boolean, value: number, min: number, max: number) {
  let colormap = interpolate(['#93ee9a', '#ffeb7b', '#ff816e']);
  if (rgb) {
    colormap = interpolate(['#ff816e', '#ffeb7b', '#93ee9a']);
  }
  let percent = (rgb) ? 1 : 0
  if (max !== min) {
    percent = (value - min) / (max - min)
  }
  return colormap(percent)
}

function getMainColorInterpolate(rgb: boolean, value: number, min: number, max: number) {
  let colormap = interpolate(['#2E9B33', '#FFD500', '#E32E13']);
  if (rgb) {
    colormap = interpolate(['#E32E13', '#FFD500', '#2E9B33']);
  }
  let percent = (rgb) ? 1 : 0
  if (max !== min) {
    percent = (value - min) / (max - min)
  }
  return colormap(percent)
}

interface EntryProps {
  label: string,
  nodeName: string,
  objectEntryName: string,
  min: number,
  max: number,
  target: number,
}

function Entry({ label, nodeName, objectEntryName, min, max, target}: Readonly<EntryProps>) {
  const theme = useTheme();

  let value = useObjectEntryValue(nodeName, objectEntryName);
  const info = useObjectEntryInfo(nodeName, objectEntryName);

  let unit = (info?.unit ?? "") as string;
  let color = theme.palette.background.paper2

  if (value !== undefined) {
      value = value as number;
      value = Math.max(min, value)
      value = Math.min(value, max)
      if (target >= value) {
        color = getLightColorInterpolate(true, value, min, target)
      } else {
        color = getLightColorInterpolate(false, value, target, max)
      }
  }

  useEffect(() => {
    const paper = document.getElementById(label)!;
    const bar = paper.getElementsByClassName("color-bar")[0] as HTMLElement;
    if (value !== undefined) {
      value = value as number;
      value = Math.max(min, value)
      value = Math.min(value, max)
      bar.style.setProperty("--width", `${(100) * (value - min) / (max - min)}%`);
      if (target >= value) {
        bar.style.setProperty("--color", `${getMainColorInterpolate(true, value, min, target)}`);
      } else {
        bar.style.setProperty("--color", `${getMainColorInterpolate(false, value, target, max)}`);
      }
    } else {
      bar.style.setProperty("--width", `0%`);
    }

  }, [value]);

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
        <Entry label="Battery-Voltage:" nodeName="input_board" objectEntryName="bat24_voltage" min={22.2} max={29} target={29}/>
        <Entry label="Supercap-Voltage:" nodeName="input_board" objectEntryName="supercap_voltage" min={30} max={50} target={45}/>
        <Entry label="Battery-Temperature:" nodeName="input_board" objectEntryName="bat24_temperature_max" min={20} max={50} target={20}/>
        <Entry label="Link24-Current:" nodeName="input_board" objectEntryName="link24_current" min={0} max={20} target={0}/>
        <Entry label="Link45-Current:" nodeName="input_board" objectEntryName="link45_current" min={0} max={150} target={0}/>
      </Stack>
    </Paper>
  );
}

export default VoltagesValues;
