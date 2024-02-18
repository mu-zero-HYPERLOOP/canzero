
import { useEffect } from "react";
import "./TemperatureVis.css"
import { invoke } from "@tauri-apps/api";
import { ObjectEntryListenLatestResponse } from "../../object_entry/types/events/ObjectEntryListenLatestResponse";
import { ObjectEntryEvent } from "../../object_entry/types/events/ObjectEntryEvent";
import { listen } from "@tauri-apps/api/event";
import { ObjectEntryInformation } from "../../object_entry/types/ObjectEntryInformation";
import { IntTypeInfo, RealTypeInfo, UIntTypeInfo } from "../../object_entry/types/Type";
import { Paper, Stack, Typography } from "@mui/material";


interface Color {
  r: number,
  g: number,
  b: number,
}

function learpColor(alpha: number, colorA: Color, colorB: Color): Color {
  return {
    r: alpha * colorA.r + (1.0 - alpha) * colorB.r,
    g: alpha * colorA.g + (1.0 - alpha) * colorB.g,
    b: alpha * colorA.b + (1.0 - alpha) * colorB.b
  }
}

function colorToCss(color: Color): string {
  return `rgb(${color.r},${color.g},${color.b}`;
}

const hot: Color = {
  r: 242,
  g: 5,
  b: 5,
};

const cold: Color = {
  r: 195,
  g: 197,
  b: 203
}

const MLU1_OE = { nodeName: "mlu1", objectEntryName: "magnet_temperature" };
const MLU2_OE = { nodeName: "mlu2", objectEntryName: "magnet_temperature" };
const MLU3_OE = { nodeName: "mlu3", objectEntryName: "magnet_temperature" };
const MLU4_OE = { nodeName: "mlu4", objectEntryName: "magnet_temperature" };
const MLU5_OE = { nodeName: "mlu5", objectEntryName: "magnet_temperature" };
const MLU6_OE = { nodeName: "mlu6", objectEntryName: "magnet_temperature" };
const MGU1_STARBOARD_OE = { nodeName: "mgu1", objectEntryName: "magnet_temperature_starboard" };
const MGU1_PORT_OE = { nodeName: "mgu1", objectEntryName: "magnet_temperature_port" };
const MGU2_STARBOARD_OE = { nodeName: "mgu2", objectEntryName: "magnet_temperature_starboard" };
const MGU2_PORT_OE = { nodeName: "mgu2", objectEntryName: "magnet_temperature_port" };
const DSLIM_STARBOARD_OE = { nodeName: "motor_driver", objectEntryName: "motor_temperature_starboard" };
const DSLIM_PORT_OE = { nodeName: "motor_driver", objectEntryName: "motor_temperature_port" };
const EBOX1_OE = { nodeName: "input_board", objectEntryName: "ebox_temperature" };
const EBOX2_OE = { nodeName: "input_board", objectEntryName: "ebox_temperature" };
const MOTOR_DRIVER_OR = { nodeName: "motor_driver", objectEntryName: "motor_temperature_starboard" }; // TODO
const COOLING_RESERVOIR_OE = { nodeName: "input_board", objectEntryName: "cooling_cycle_temperature" };


interface OeId {
  nodeName: string,
  objectEntryName: string,
}

async function registerOe(oe: OeId, property: string, element: HTMLElement) {
  const info = await invoke<ObjectEntryInformation>("object_entry_information", oe as any);
  let min: number, max: number;
  switch (info.ty.id) {
    case "int": {
      const typeInfo = info.ty.info as IntTypeInfo;
      const bitSize = typeInfo.bit_size;
      max = Math.pow(2, bitSize / 2) - 1;
      min = -Math.pow(2, bitSize / 2);
      break;
    }
    case "uint": {
      const typeInfo = info.ty.info as UIntTypeInfo;
      const bitSize = typeInfo.bit_size;
      max = Math.pow(2, bitSize / 2) - 1;
      min = -Math.pow(2, bitSize / 2);
      break;
    }
    case "real": {
      const typeInfo = info.ty.info as RealTypeInfo;
      max = typeInfo.max;
      min = typeInfo.min;
      break;
    }
    case "enum":
    case "struct":
      return () => { };
  }
  const resp = await invoke<ObjectEntryListenLatestResponse>("listen_to_latest_object_entry_value", oe as any);
  if (resp.latest !== undefined && resp.latest !== null) {
    const alpha = ((resp.latest.value as number) + min) / (max - min);
    const cssColor = colorToCss(learpColor(alpha, hot, cold));
    element.style.setProperty(property, cssColor);
  }
  const unlistenJs = await listen<ObjectEntryEvent>(resp.event_name, event => {
    const alpha = ((event.payload.value as number) + min) / (max - min);
    const cssColor = colorToCss(learpColor(alpha, hot, cold));
    element.style.setProperty(property, cssColor);
  });

  return () => {
    unlistenJs();
    invoke("unlisten_from_latest_object_entry_value", oe as any);
  }
}


function TemperatureVis() {

  useEffect(() => {

    const svg = document.getElementById("temperature_vis")!;

    let cleanup: (Promise<() => void>)[] = [];
    cleanup.push(registerOe(MLU1_OE, "--mlu1_temperature", svg));
    cleanup.push(registerOe(MLU2_OE, "--mlu2_temperature", svg));
    cleanup.push(registerOe(MLU3_OE, "--mlu3_temperature", svg));
    cleanup.push(registerOe(MLU4_OE, "--mlu4_temperature", svg));
    cleanup.push(registerOe(MLU5_OE, "--mlu5_temperature", svg));
    cleanup.push(registerOe(MLU6_OE, "--mlu6_temperature", svg));

    cleanup.push(registerOe(MGU1_STARBOARD_OE, "--mgu1_starboard_temperature", svg));
    cleanup.push(registerOe(MGU1_PORT_OE, "--mgu1_port_temperature", svg));
    cleanup.push(registerOe(MGU2_STARBOARD_OE, "--mgu2_starboard_temperature", svg));
    cleanup.push(registerOe(MGU2_PORT_OE, "--mgu2_port_temperature", svg));

    cleanup.push(registerOe(DSLIM_STARBOARD_OE, "--dslim_starboard_temperature", svg));
    cleanup.push(registerOe(DSLIM_PORT_OE, "--dslim_port_temperature", svg));

    cleanup.push(registerOe(EBOX1_OE, "--ebox1_temperature", svg));
    cleanup.push(registerOe(EBOX2_OE, "--ebox2_temperature", svg));

    cleanup.push(registerOe(MOTOR_DRIVER_OR, "--motor_driver_temperature", svg)); // TODO

    cleanup.push(registerOe(COOLING_RESERVOIR_OE, "--cooling_reservoir_temperature", svg));

    return () => {
      cleanup.forEach(p => p.then(f => f()).catch(console.error));
    };
  }, []);

  return (
    <Paper sx={{
      width: "100%",
      margin: 2,
      padding: 1
    }}>
      <Stack>
      <Typography style={{textAlign: "center"}}>
        Temperatures
      </Typography>
      <svg version="1.1"
        id={"temperature_vis"}
        xmlns="http://www.w3.org/2000/svg"
        x="0px"
        y="0px"
        viewBox="0 0 1068.63 524.46">
        <g id="frame">
          <g id="mgu2">
            <path className="mgu1_starboard" d="M284.91,32.02h-70.66c-2.88,0-5.24-2.36-5.24-5.24v-7.07c0-2.88,2.36-5.24,5.24-5.24h70.66
			c2.88,0,5.24,2.36,5.24,5.24v7.07C290.15,29.66,287.79,32.02,284.91,32.02z"/>
            <path className="mgu1_port" d="M285.31,500.21h-70.66c-2.88,0-5.24,2.36-5.24,5.24v7.07c0,2.88,2.36,5.24,5.24,5.24h70.66
			c2.88,0,5.24-2.36,5.24-5.24v-7.07C290.55,502.57,288.19,500.21,285.31,500.21z"/>
            <path className="mgu2_starboard" d="M871.69,31.73h-70.66c-2.88,0-5.24-2.36-5.24-5.24v-7.07c0-2.88,2.36-5.24,5.24-5.24h70.66
			c2.88,0,5.24,2.36,5.24,5.24v7.07C876.92,29.38,874.57,31.73,871.69,31.73z"/>
            <path className="mgu2_port" d="M872.08,499.93h-70.66c-2.88,0-5.24,2.36-5.24,5.24v7.07c0,2.88,2.36,5.24,5.24,5.24h70.66
			c2.88,0,5.24-2.36,5.24-5.24v-7.07C877.32,502.29,874.97,499.93,872.08,499.93z"/>
          </g>
          <path className="st0" d="M1044.17,82.06H24.08c-7.44,0-13.47-6.03-13.47-13.47V46.82c0-7.44,6.03-13.47,13.47-13.47h1020.08
		c7.44,0,13.47,6.03,13.47,13.47v21.77C1057.64,76.03,1051.61,82.06,1044.17,82.06z"/>
          <path className="st0" d="M1044.17,498.69H24.08c-7.44,0-13.47-6.03-13.47-13.47v-18.9c0-7.44,6.03-13.47,13.47-13.47h1020.08
		c7.44,0,13.47,6.03,13.47,13.47v18.9C1057.64,492.66,1051.61,498.69,1044.17,498.69z"/>
          <path className="st0" d="M1015.28,507.03H59.21c-9.37,0-16.97-7.6-16.97-16.97V42.36c0-9.37,7.6-16.97,16.97-16.97h956.07
		c9.37,0,16.97,7.6,16.97,16.97v447.71C1032.25,499.44,1024.65,507.03,1015.28,507.03z"/>
          <g>
            <line className="st1" x1="391.5" y1="78.5" x2="391.5" y2="450.81" />
            <line className="st1" x1="490.98" y1="79.12" x2="490.98" y2="451.43" />
            <line className="st1" x1="789.43" y1="82.23" x2="789.43" y2="454.54" />
            <line className="st1" x1="292.02" y1="79.74" x2="292.02" y2="452.06" />
            <line className="st1" x1="590.47" y1="80.36" x2="590.47" y2="452.68" />
            <line className="st1" x1="192.54" y1="82.85" x2="192.54" y2="455.16" />
            <line className="st1" x1="689.95" y1="77.88" x2="689.95" y2="450.19" />
            <line className="st1" x1="988.39" y1="77.26" x2="988.39" y2="449.57" />
            <line className="st1" x1="93.06" y1="80.99" x2="93.06" y2="453.3" />
            <line className="st1" x1="888.91" y1="81.61" x2="888.91" y2="453.92" />
          </g>
          <path className="st0" d="M1003.58,370.48H73.14c-6.6,0-12-5.4-12-12V173.31c0-6.6,5.4-12,12-12h930.44c6.6,0,12,5.4,12,12v185.18
		C1015.58,365.08,1010.18,370.48,1003.58,370.48z"/>
          <path className="st0" d="M577.58,348.01h-64.55c-9.6,0-17.37-7.78-17.37-17.37V194.84c0-9.6,7.78-17.37,17.37-17.37h64.55
		c9.6,0,17.37,7.78,17.37,17.37v135.79C594.96,340.23,587.18,348.01,577.58,348.01z"/>
          <path className="st0" d="M963.16,347.51H883.9c-6.6,0-12-5.4-12-12v-35.12c0-6.6,5.4-12,12-12h79.25c6.6,0,12,5.4,12,12v35.12
		C975.16,342.11,969.76,347.51,963.16,347.51z"/>
          <g>
            <path className="st2" d="M419.83,328.43c-4.62,0-8.38-3.76-8.38-8.38V205.43c0-4.62,3.76-8.38,8.38-8.38h261.65
			c4.62,0,8.38,3.76,8.38,8.38v114.62c0,4.62-3.76,8.38-8.38,8.38H419.83z"/>
            <path d="M681.48,197.55c4.35,0,7.88,3.54,7.88,7.88v114.62c0,4.35-3.54,7.88-7.88,7.88H419.83c-4.35,0-7.88-3.54-7.88-7.88V205.43
			c0-4.35,3.54-7.88,7.88-7.88H681.48 M681.48,196.55H419.83c-4.91,0-8.88,3.98-8.88,8.88v114.62c0,4.91,3.98,8.88,8.88,8.88h261.65
			c4.91,0,8.88-3.98,8.88-8.88V205.43C690.36,200.52,686.39,196.55,681.48,196.55L681.48,196.55z"/>
          </g>
        </g>
        <g id="ebox1">
          <path className="ebox2" d="M376.58,342.71h-66.97c-6.6,0-12-5.4-12-12V199.85c0-6.6,5.4-12,12-12h66.97c6.6,0,12,5.4,12,12v130.86
		C388.58,337.31,383.18,342.71,376.58,342.71z"/>
          <rect x="304.17" y="197.05" className="st0" width="36.57" height="69.35" />
          <rect x="345.95" y="197.05" className="st0" width="36.57" height="69.35" />
          <rect x="304.26" y="270.19" className="st0" width="78.54" height="28.8" />
          <rect x="304.5" y="303.35" className="st0" width="78.54" height="28.8" />
        </g>
        <g id="ebox2">
          <path className="ebox1" d="M276.65,341.47h-66.97c-6.6,0-12-5.4-12-12V198.6c0-6.6,5.4-12,12-12h66.97c6.6,0,12,5.4,12,12v130.86
		C288.65,336.07,283.25,341.47,276.65,341.47z"/>
          <rect x="203.61" y="302.02" className="st0" width="79.77" height="30.32" />
          <rect x="203.61" y="267.35" className="st0" width="79.77" height="30.32" />
          <rect x="203.61" y="232.17" className="st0" width="79.77" height="30.32" />
          <rect x="203.61" y="197.24" className="st0" width="79.77" height="30.32" />
        </g>
        <g id="motor_x5F_driver">
          <path className="motor_driver_board" d="M750.9,346.26h-26.14c-6.6,0-12-5.4-12-12V193.21c0-6.6,5.4-12,12-12h26.14c6.6,0,12,5.4,12,12
		v141.05C762.9,340.86,757.5,346.26,750.9,346.26z"/>
        </g>
        <g id="reservoir">
          <circle className="cooling_reservoir" cx="921.41" cy="228.64" r="50.92" />
        </g>
        <g id="supercaps">
          <path className="st0" d="M846.76,326.65h-58.74c-7.68,0-13.96-6.28-13.96-13.96v-98.4c0-7.68,6.28-13.96,13.96-13.96h58.74
		c7.68,0,13.96,6.28,13.96,13.96v98.4C860.72,320.37,854.43,326.65,846.76,326.65z"/>
          <path className="st0" d="M802.74,241.2h-12.38c-6.6,0-12-5.4-12-12v-12.38c0-6.6,5.4-12,12-12h12.38c6.6,0,12,5.4,12,12v12.38
		C814.74,235.8,809.34,241.2,802.74,241.2z"/>
          <path className="st0" d="M843.47,241.48h-12.38c-6.6,0-12-5.4-12-12v-12.38c0-6.6,5.4-12,12-12h12.38c6.6,0,12,5.4,12,12v12.38
		C855.47,236.08,850.07,241.48,843.47,241.48z"/>
          <path className="st0" d="M802.74,281.12h-12.38c-6.6,0-12-5.4-12-12v-12.38c0-6.6,5.4-12,12-12h12.38c6.6,0,12,5.4,12,12v12.38
		C814.74,275.72,809.34,281.12,802.74,281.12z"/>
          <path className="st0" d="M843.47,281.4h-12.38c-6.6,0-12-5.4-12-12v-12.38c0-6.6,5.4-12,12-12h12.38c6.6,0,12,5.4,12,12v12.38
		C855.47,276,850.07,281.4,843.47,281.4z"/>
          <path className="st0" d="M802.74,321.66h-12.38c-6.6,0-12-5.4-12-12v-12.38c0-6.6,5.4-12,12-12h12.38c6.6,0,12,5.4,12,12v12.38
		C814.74,316.26,809.34,321.66,802.74,321.66z"/>
          <path className="st0" d="M843.47,321.95h-12.38c-6.6,0-12-5.4-12-12v-12.38c0-6.6,5.4-12,12-12h12.38c6.6,0,12,5.4,12,12v12.38
		C855.47,316.55,850.07,321.95,843.47,321.95z"/>
          <circle className="st0" cx="787.55" cy="223.01" r="3.41" />
          <circle className="st0" cx="804.79" cy="223.29" r="3.51" />
          <circle className="st0" cx="829.28" cy="223.15" r="3.41" />
          <circle className="st0" cx="846.52" cy="223.44" r="3.51" />
          <circle className="st0" cx="787.59" cy="263.23" r="3.41" />
          <circle className="st0" cx="804.84" cy="263.51" r="3.51" />
          <circle className="st0" cx="828.71" cy="264.17" r="3.41" />
          <circle className="st0" cx="845.95" cy="264.46" r="3.51" />
          <circle className="st0" cx="787.78" cy="303.39" r="3.41" />
          <circle className="st0" cx="805.03" cy="303.68" r="3.51" />
          <circle className="st0" cx="828.9" cy="304.06" r="3.41" />
          <circle className="st0" cx="846.14" cy="304.34" r="3.51" />
        </g>
        <g id="DSLIM">
          <path className="st0" d="M690.28,311.31h-41.55c-2.38,0-4.64,1.03-6.2,2.83l-2.75,3.17h-17.43l-2.56-3.06
		c-1.56-1.86-3.87-2.94-6.3-2.94h-43.99c-2.79,0-5.38,1.41-6.89,3.75l-1.46,2.25H541.5l-1.43-2.22c-1.51-2.35-4.12-3.78-6.91-3.78
		H485.6c-2.32,0-4.54,0.98-6.09,2.71l-2.98,3.29h-16.41l-2.33-2.92c-1.56-1.95-3.92-3.08-6.41-3.08h-40.48v-39.32h279.39V311.31z"/>
          <rect x="417.76" y="271.51" className="dslim_port" width="49.65" height="12.71" />
          <rect x="411.02" y="258.19" className="st0" width="279.3" height="10.45" />
          <rect x="437.78" y="283.2" className="dslim_port" width="49.65" height="12.71" />
          <rect x="458.09" y="294.91" className="dslim_port" width="49.65" height="12.71" />
          <rect x="475.39" y="271.51" className="dslim_port" width="49.65" height="12.71" />
          <rect x="495.41" y="283.2" className="dslim_port" width="49.65" height="12.71" />
          <rect x="515.72" y="294.91" className="dslim_port" width="49.65" height="12.71" />
          <rect x="533.39" y="271.51" className="dslim_port" width="49.65" height="12.71" />
          <rect x="553.4" y="283.2" className="dslim_port" width="49.65" height="12.71" />
          <rect x="573.71" y="294.91" className="dslim_port" width="49.65" height="12.71" />
          <rect x="591.79" y="271.51" className="dslim_port" width="49.65" height="12.71" />
          <rect x="611.81" y="283.2" className="dslim_port" width="49.65" height="12.71" />
          <rect x="632.12" y="294.91" className="dslim_port" width="49.65" height="12.71" />
          <circle cx="462.52" cy="313.55" r="1.17" />
          <circle cx="474.39" cy="313.36" r="1.17" />
          <circle cx="545.49" cy="313.72" r="1.17" />
          <circle cx="557.37" cy="313.53" r="1.17" />
          <circle cx="625.26" cy="313.82" r="1.17" />
          <circle cx="637.14" cy="313.63" r="1.17" />
          <path className="st0" d="M690.37,215.1h-41.55c-2.38,0-4.64-1.03-6.2-2.83l-2.75-3.17h-17.43l-2.56,3.06c-1.56,1.86-3.87,2.94-6.3,2.94
		h-43.99c-2.79,0-5.38-1.41-6.89-3.75l-1.46-2.25h-19.64l-1.43,2.22c-1.51,2.35-4.12,3.78-6.91,3.78h-47.56
		c-2.32,0-4.54-0.98-6.09-2.71l-2.98-3.29h-16.41l-2.33,2.92c-1.56,1.95-3.92,3.08-6.41,3.08h-40.48v39.32h279.39V215.1z"/>
          <rect x="417.85" y="242.19" className="dslim_starboard" width="49.65" height="12.71" />
          <rect x="437.87" y="230.5" className="dslim_starboard" width="49.65" height="12.71" />
          <rect x="458.18" y="218.79" className="dslim_starboard" width="49.65" height="12.71" />
          <rect x="475.48" y="242.19" className="dslim_starboard" width="49.65" height="12.71" />
          <rect x="495.5" y="230.5" className="dslim_starboard" width="49.65" height="12.71" />
          <rect x="515.81" y="218.79" className="dslim_starboard" width="49.65" height="12.71" />
          <rect x="533.47" y="242.19" className="dslim_starboard" width="49.65" height="12.71" />
          <rect x="553.49" y="230.5" className="dslim_starboard" width="49.65" height="12.71" />
          <rect x="573.8" y="218.79" className="dslim_starboard" width="49.65" height="12.71" />
          <rect x="591.88" y="242.19" className="dslim_starboard" width="49.65" height="12.71" />
          <rect x="611.9" y="230.5" className="dslim_starboard" width="49.65" height="12.71" />
          <rect x="632.21" y="218.79" className="dslim_starboard" width="49.65" height="12.71" />
          <circle cx="462.61" cy="212.86" r="1.17" />
          <circle cx="474.48" cy="213.05" r="1.17" />
          <circle cx="545.58" cy="212.68" r="1.17" />
          <circle cx="557.46" cy="212.87" r="1.17" />
          <circle cx="625.35" cy="212.59" r="1.17" />
          <circle cx="637.22" cy="212.78" r="1.17" />
        </g>
        <g id="Layer_11">
        </g>
        <g id="Layer_3">
        </g>
        <g id="mlus">
          <path className="st3" d="M204.06,146.39" />
          <path className="st3" d="M196.61,145.75" />
          <path className="st0" d="M315.14,144.83l-9.99-3.53c-5-1.76-10.21-2.66-15.45-2.66h-92.9c-4.09,0-8.15,0.8-11.99,2.37l-8.31,3.4
		c-9.31,3.81-19.68-3.1-20.35-14.06c-0.02-0.39-0.04-0.78-0.04-1.18V59.54c0-0.4,0.01-0.79,0.04-1.18
		c0.64-10.55,10.19-17.6,19.43-14.9l10.16,2.97c3.24,0.95,6.57,1.43,9.92,1.43h97.08c3.24,0,6.47-0.4,9.63-1.2l13.81-3.48
		c6.86-1.73,14.13,1.69,17.29,8.65c1.05,2.32,1.64,4.94,1.64,7.71v69.63c0,0.4-0.01,0.79-0.04,1.18
		C334.42,141.12,324.43,148.11,315.14,144.83z"/>
          <path className="st4" d="M293.31,128.68h-98.39c-0.72,0-1.4-0.18-2.01-0.51c-6.95-3.76-14.04-7.19-21.61-8.96l-15.11-3.52V72.61
		l14.75-3.74c7.54-1.91,15.01-4.59,21.53-9.17c0.71-0.5,1.55-0.78,2.45-0.78h98.39c0.9,0,1.74,0.29,2.45,0.78
		c4.68,3.28,9.63,6.08,15.05,7.4l24.24,5.9v40.6l-16.99,4.59c-7.8,2.1-15.53,4.95-22.31,9.7
		C295.05,128.39,294.21,128.68,293.31,128.68z"/>
          <rect x="161.11" y="79.96" className="st4" width="32.59" height="28.79" />
          <rect x="294.11" y="79.96" className="st4" width="34" height="28.79" />
          <rect x="314.11" y="83.28" className="st5" width="10.58" height="21.71" />
          <rect x="164.78" y="83.28" className="st5" width="10.33" height="21.71" />
          <path id="XMLID_00000025420474694617434220000010280258879107864983_" className="mlu1" d="M280.62,88.69h-72.78
		c-5.4,0-9.78-5.17-9.78-11.55V65.99c0-6.38,4.38-11.55,9.78-11.55h72.78c5.4,0,9.78,5.17,9.78,11.55v11.15
		C290.4,83.52,286.02,88.69,280.62,88.69z"/>
          <path className="mlu1" d="M280.43,132.28h-72.78c-5.4,0-9.78-5.17-9.78-11.55v-11.15c0-6.38,4.38-11.55,9.78-11.55h72.78
		c5.4,0,9.78,5.17,9.78,11.55v11.15C290.21,127.1,285.83,132.28,280.43,132.28z"/>
          <path className="st0" d="M278.52,82.04h-68.96c-2.43,0-4.42-1.99-4.42-4.42V65.84c0-2.43,1.99-4.42,4.42-4.42h68.96
		c2.43,0,4.42,1.99,4.42,4.42v11.77C282.95,80.05,280.96,82.04,278.52,82.04z"/>
          <path className="st0" d="M278.33,125.62h-68.96c-2.43,0-4.42-1.99-4.42-4.42v-11.77c0-2.43,1.99-4.42,4.42-4.42h68.96
		c2.43,0,4.42,1.99,4.42,4.42v11.77C282.76,123.63,280.77,125.62,278.33,125.62z"/>
          <ellipse className="st5" cx="275.24" cy="71.66" rx="2.25" ry="2.49" />
          <ellipse className="st5" cx="212.77" cy="71.66" rx="2.25" ry="2.49" />
          <ellipse className="st5" cx="275.05" cy="115.24" rx="2.25" ry="2.49" />
          <ellipse className="st5" cx="212.58" cy="115.24" rx="2.25" ry="2.49" />
          <circle className="st4" cx="321.12" cy="56.06" r="8.86" />
          <circle className="st5" cx="321.12" cy="56.06" r="2.39" />
          <circle className="st4" cx="320.93" cy="132.72" r="8.86" />
          <circle className="st5" cx="320.93" cy="132.72" r="2.39" />
          <circle className="st4" cx="169.95" cy="133.29" r="8.86" />
          <circle className="st5" cx="169.95" cy="133.29" r="2.39" />
          <circle className="st4" cx="169.95" cy="56.56" r="8.86" />
          <circle className="st5" cx="169.95" cy="56.56" r="2.39" />
          <path className="st0" d="M610.5,145.28l-9.99-3.53c-5-1.76-10.21-2.66-15.45-2.66h-92.9c-4.09,0-8.15,0.8-11.99,2.37l-8.31,3.4
		c-9.31,3.81-19.68-3.1-20.35-14.06c-0.02-0.39-0.04-0.78-0.04-1.18V59.99c0-0.4,0.01-0.79,0.04-1.18
		c0.64-10.55,10.19-17.6,19.43-14.9l10.16,2.97c3.24,0.95,6.57,1.43,9.92,1.43h97.08c3.24,0,6.47-0.4,9.63-1.2l13.81-3.48
		c6.86-1.73,14.13,1.69,17.29,8.65c1.05,2.32,1.64,4.94,1.64,7.71v69.63c0,0.4-0.01,0.79-0.04,1.18
		C629.78,141.57,619.79,148.56,610.5,145.28z"/>
          <path className="st4" d="M588.66,129.13h-98.39c-0.72,0-1.4-0.18-2.01-0.51c-6.95-3.76-14.04-7.19-21.61-8.96l-15.11-3.52V73.06
		l14.75-3.74c7.54-1.91,15.01-4.59,21.53-9.17c0.71-0.5,1.55-0.78,2.45-0.78h98.39c0.9,0,1.74,0.29,2.45,0.78
		c4.68,3.28,9.63,6.08,15.05,7.4l24.24,5.9v40.6l-16.99,4.59c-7.8,2.1-15.53,4.95-22.31,9.7
		C590.4,128.84,589.57,129.13,588.66,129.13z"/>
          <rect x="456.47" y="80.41" className="st4" width="32.59" height="28.79" />
          <rect x="589.47" y="80.41" className="st4" width="34" height="28.79" />
          <rect x="609.47" y="83.73" className="st5" width="10.58" height="21.71" />
          <rect x="460.14" y="83.73" className="st5" width="10.33" height="21.71" />
          <path className="mlu2" d="M575.98,89.14H503.2c-5.4,0-9.78-5.17-9.78-11.55V66.43c0-6.38,4.38-11.55,9.78-11.55h72.78
		c5.4,0,9.78,5.17,9.78,11.55v11.15C585.76,83.97,581.38,89.14,575.98,89.14z"/>
          <path className="mlu2" d="M575.79,132.72h-72.78c-5.4,0-9.78-5.17-9.78-11.55v-11.15c0-6.38,4.38-11.55,9.78-11.55h72.78
		c5.4,0,9.78,5.17,9.78,11.55v11.15C585.57,127.55,581.19,132.72,575.79,132.72z"/>
          <path className="st0" d="M573.88,82.49h-68.96c-2.43,0-4.42-1.99-4.42-4.42V66.29c0-2.43,1.99-4.42,4.42-4.42h68.96
		c2.43,0,4.42,1.99,4.42,4.42v11.77C578.31,80.5,576.31,82.49,573.88,82.49z"/>
          <path className="st0" d="M573.69,126.07h-68.96c-2.43,0-4.42-1.99-4.42-4.42v-11.77c0-2.43,1.99-4.42,4.42-4.42h68.96
		c2.43,0,4.42,1.99,4.42,4.42v11.77C578.12,124.08,576.13,126.07,573.69,126.07z"/>
          <ellipse className="st5" cx="570.6" cy="72.11" rx="2.25" ry="2.49" />
          <ellipse className="st5" cx="508.13" cy="72.11" rx="2.25" ry="2.49" />
          <ellipse className="st5" cx="570.41" cy="115.69" rx="2.25" ry="2.49" />
          <ellipse className="st5" cx="507.94" cy="115.69" rx="2.25" ry="2.49" />
          <circle className="st4" cx="616.48" cy="56.51" r="8.86" />
          <circle className="st5" cx="616.48" cy="56.51" r="2.39" />
          <circle className="st4" cx="616.29" cy="133.17" r="8.86" />
          <circle className="st5" cx="616.29" cy="133.17" r="2.39" />
          <circle className="st4" cx="465.3" cy="133.74" r="8.86" />
          <circle className="st5" cx="465.3" cy="133.74" r="2.39" />
          <circle className="st4" cx="465.3" cy="57.01" r="8.86" />
          <circle className="st5" cx="465.3" cy="57.01" r="2.39" />
          <path className="st0" d="M908.82,145.27l-9.99-3.53c-5-1.76-10.21-2.66-15.45-2.66h-92.9c-4.09,0-8.15,0.8-11.99,2.37l-8.31,3.4
		c-9.31,3.81-19.68-3.1-20.35-14.06c-0.02-0.39-0.04-0.78-0.04-1.18V59.98c0-0.4,0.01-0.79,0.04-1.18
		c0.64-10.55,10.19-17.6,19.43-14.9l10.16,2.97c3.24,0.95,6.57,1.43,9.92,1.43h97.08c3.24,0,6.47-0.4,9.63-1.2l13.81-3.48
		c6.86-1.73,14.13,1.69,17.29,8.65c1.05,2.32,1.64,4.94,1.64,7.71v69.63c0,0.4-0.01,0.79-0.04,1.18
		C928.1,141.57,918.11,148.56,908.82,145.27z"/>
          <path className="st4" d="M886.99,129.12H788.6c-0.72,0-1.4-0.18-2.01-0.51c-6.95-3.76-14.04-7.19-21.61-8.96l-15.11-3.52V73.06
		l14.75-3.74c7.54-1.91,15.01-4.59,21.53-9.17c0.71-0.5,1.55-0.78,2.45-0.78h98.39c0.9,0,1.74,0.29,2.45,0.78
		c4.68,3.28,9.63,6.08,15.05,7.4l24.24,5.9v40.6l-16.99,4.59c-7.8,2.1-15.53,4.95-22.31,9.7
		C888.73,128.84,887.89,129.12,886.99,129.12z"/>
          <rect x="754.79" y="80.41" className="st4" width="32.59" height="28.79" />
          <rect x="887.79" y="80.41" className="st4" width="34" height="28.79" />
          <rect x="907.79" y="83.73" className="st5" width="10.58" height="21.71" />
          <rect x="758.46" y="83.73" className="st5" width="10.33" height="21.71" />
          <path className="mlu3" d="M874.31,89.14h-72.78c-5.4,0-9.78-5.17-9.78-11.55V66.43c0-6.38,4.38-11.55,9.78-11.55h72.78
		c5.4,0,9.78,5.17,9.78,11.55v11.15C884.08,83.97,879.7,89.14,874.31,89.14z"/>
          <path className="mlu3" d="M874.12,132.72h-72.78c-5.4,0-9.78-5.17-9.78-11.55v-11.15c0-6.38,4.38-11.55,9.78-11.55h72.78
		c5.4,0,9.78,5.17,9.78,11.55v11.15C883.89,127.55,879.52,132.72,874.12,132.72z"/>
          <path className="st0" d="M872.21,82.48h-68.96c-2.43,0-4.42-1.99-4.42-4.42V66.29c0-2.43,1.99-4.42,4.42-4.42h68.96
		c2.43,0,4.42,1.99,4.42,4.42v11.77C876.63,80.49,874.64,82.48,872.21,82.48z"/>
          <path className="st0" d="M872.02,126.06h-68.96c-2.43,0-4.42-1.99-4.42-4.42v-11.77c0-2.43,1.99-4.42,4.42-4.42h68.96
		c2.43,0,4.42,1.99,4.42,4.42v11.77C876.44,124.07,874.45,126.06,872.02,126.06z"/>
          <ellipse className="st5" cx="868.92" cy="72.1" rx="2.25" ry="2.49" />
          <ellipse className="st5" cx="806.45" cy="72.1" rx="2.25" ry="2.49" />
          <ellipse className="st5" cx="868.73" cy="115.69" rx="2.25" ry="2.49" />
          <ellipse className="st5" cx="806.26" cy="115.69" rx="2.25" ry="2.49" />
          <circle className="st4" cx="914.8" cy="56.5" r="8.86" />
          <circle className="st5" cx="914.8" cy="56.5" r="2.39" />
          <circle className="st4" cx="914.61" cy="133.17" r="8.86" />
          <circle className="st5" cx="914.61" cy="133.17" r="2.39" />
          <circle className="st4" cx="763.63" cy="133.74" r="8.86" />
          <circle className="st5" cx="763.63" cy="133.74" r="2.39" />
          <circle className="st4" cx="763.63" cy="57" r="8.86" />
          <circle className="st5" cx="763.63" cy="57" r="2.39" />
          <path className="st0" d="M315.56,489.02l-9.99-3.53c-5-1.76-10.21-2.66-15.45-2.66h-92.9c-4.09,0-8.15,0.8-11.99,2.37l-8.31,3.4
		c-9.31,3.81-19.68-3.1-20.35-14.06c-0.02-0.39-0.04-0.78-0.04-1.18v-69.63c0-0.4,0.01-0.79,0.04-1.18
		c0.64-10.55,10.19-17.6,19.43-14.9l10.16,2.97c3.24,0.95,6.57,1.43,9.92,1.43h97.08c3.24,0,6.47-0.4,9.63-1.2l13.81-3.48
		c6.86-1.73,14.13,1.69,17.29,8.65c1.05,2.32,1.64,4.94,1.64,7.71v69.63c0,0.4-0.01,0.79-0.04,1.18
		C334.84,485.31,324.85,492.3,315.56,489.02z"/>
          <path className="st4" d="M293.73,472.87h-98.39c-0.72,0-1.4-0.18-2.01-0.51c-6.95-3.76-14.04-7.19-21.61-8.96l-15.11-3.52V416.8
		l14.75-3.74c7.54-1.91,15.01-4.59,21.53-9.17c0.71-0.5,1.55-0.78,2.45-0.78h98.39c0.9,0,1.74,0.29,2.45,0.78
		c4.68,3.28,9.63,6.08,15.06,7.4l24.24,5.9v40.6l-16.99,4.59c-7.8,2.1-15.53,4.95-22.31,9.7
		C295.47,472.58,294.63,472.87,293.73,472.87z"/>
          <rect x="161.54" y="424.15" className="st4" width="32.59" height="28.79" />
          <rect x="294.54" y="424.15" className="st4" width="34" height="28.79" />
          <rect x="314.54" y="427.47" className="st5" width="10.58" height="21.71" />
          <rect x="165.2" y="427.47" className="st5" width="10.33" height="21.71" />
          <path className="mlu4" d="M281.05,432.88h-72.78c-5.4,0-9.78-5.17-9.78-11.55v-11.15c0-6.38,4.38-11.55,9.78-11.55h72.78
		c5.4,0,9.78,5.17,9.78,11.55v11.15C290.83,427.71,286.45,432.88,281.05,432.88z"/>
          <path className="mlu4" d="M280.86,476.46h-72.78c-5.4,0-9.78-5.17-9.78-11.55v-11.15c0-6.38,4.38-11.55,9.78-11.55h72.78
		c5.4,0,9.78,5.17,9.78,11.55v11.15C290.64,471.29,286.26,476.46,280.86,476.46z"/>
          <path className="st0" d="M278.95,426.23h-68.96c-2.43,0-4.42-1.99-4.42-4.42v-11.77c0-2.43,1.99-4.42,4.42-4.42h68.96
		c2.43,0,4.42,1.99,4.42,4.42v11.77C283.37,424.24,281.38,426.23,278.95,426.23z"/>
          <path className="st0" d="M278.76,469.81H209.8c-2.43,0-4.42-1.99-4.42-4.42v-11.77c0-2.43,1.99-4.42,4.42-4.42h68.96
		c2.43,0,4.42,1.99,4.42,4.42v11.77C283.18,467.82,281.19,469.81,278.76,469.81z"/>
          <ellipse className="st5" cx="275.67" cy="415.85" rx="2.25" ry="2.49" />
          <ellipse className="st5" cx="213.2" cy="415.85" rx="2.25" ry="2.49" />
          <ellipse className="st5" cx="275.48" cy="459.43" rx="2.25" ry="2.49" />
          <ellipse className="st5" cx="213.01" cy="459.43" rx="2.25" ry="2.49" />
          <circle className="st4" cx="321.54" cy="400.25" r="8.86" />
          <circle className="st5" cx="321.54" cy="400.25" r="2.39" />
          <circle className="st4" cx="321.36" cy="476.91" r="8.86" />
          <circle className="st5" cx="321.36" cy="476.91" r="2.39" />
          <circle className="st4" cx="170.37" cy="477.48" r="8.86" />
          <circle className="st5" cx="170.37" cy="477.48" r="2.39" />
          <circle className="st4" cx="170.37" cy="400.75" r="8.86" />
          <circle className="st5" cx="170.37" cy="400.75" r="2.39" />
          <path className="st0" d="M610.92,489.47l-9.99-3.53c-5-1.76-10.21-2.66-15.45-2.66h-92.9c-4.09,0-8.15,0.8-11.99,2.37l-8.31,3.4
		c-9.31,3.81-19.68-3.1-20.35-14.06c-0.02-0.39-0.04-0.78-0.04-1.18v-69.63c0-0.4,0.01-0.79,0.04-1.18
		c0.64-10.55,10.19-17.6,19.43-14.9l10.16,2.97c3.24,0.95,6.57,1.43,9.92,1.43h97.08c3.24,0,6.47-0.4,9.63-1.2l13.81-3.48
		c6.86-1.73,14.13,1.69,17.29,8.65c1.05,2.32,1.64,4.94,1.64,7.71v69.63c0,0.4-0.01,0.79-0.04,1.18
		C630.2,485.76,620.21,492.75,610.92,489.47z"/>
          <path className="st4" d="M589.09,473.32H490.7c-0.72,0-1.4-0.18-2.01-0.51c-6.95-3.76-14.04-7.19-21.61-8.96l-15.11-3.52v-43.07
		l14.75-3.74c7.54-1.91,15.01-4.59,21.53-9.17c0.71-0.5,1.55-0.78,2.45-0.78h98.39c0.9,0,1.74,0.29,2.45,0.78
		c4.68,3.28,9.63,6.08,15.05,7.4l24.24,5.9v40.6l-16.99,4.59c-7.8,2.1-15.53,4.95-22.31,9.7
		C590.83,473.03,589.99,473.32,589.09,473.32z"/>
          <rect x="456.9" y="424.6" className="st4" width="32.59" height="28.79" />
          <rect x="589.9" y="424.6" className="st4" width="34" height="28.79" />
          <rect x="609.9" y="427.92" className="st5" width="10.58" height="21.71" />
          <rect x="460.56" y="427.92" className="st5" width="10.33" height="21.71" />
          <path className="mlu5" d="M576.41,433.33h-72.78c-5.4,0-9.78-5.17-9.78-11.55v-11.15c0-6.38,4.38-11.55,9.78-11.55h72.78
		c5.4,0,9.78,5.17,9.78,11.55v11.15C586.18,428.16,581.81,433.33,576.41,433.33z"/>
          <path className="mlu5" d="M576.22,476.91h-72.78c-5.4,0-9.78-5.17-9.78-11.55V454.2c0-6.38,4.38-11.55,9.78-11.55h72.78
		c5.4,0,9.78,5.17,9.78,11.55v11.15C585.99,471.74,581.62,476.91,576.22,476.91z"/>
          <path className="st0" d="M574.31,426.68h-68.96c-2.43,0-4.42-1.99-4.42-4.42v-11.77c0-2.43,1.99-4.42,4.42-4.42h68.96
		c2.43,0,4.42,1.99,4.42,4.42v11.77C578.73,424.69,576.74,426.68,574.31,426.68z"/>
          <path className="st0" d="M574.12,470.26h-68.96c-2.43,0-4.42-1.99-4.42-4.42v-11.77c0-2.43,1.99-4.42,4.42-4.42h68.96
		c2.43,0,4.42,1.99,4.42,4.42v11.77C578.54,468.27,576.55,470.26,574.12,470.26z"/>
          <ellipse className="st5" cx="571.03" cy="416.3" rx="2.25" ry="2.49" />
          <ellipse className="st5" cx="508.55" cy="416.3" rx="2.25" ry="2.49" />
          <ellipse className="st5" cx="570.84" cy="459.88" rx="2.25" ry="2.49" />
          <ellipse className="st5" cx="508.36" cy="459.88" rx="2.25" ry="2.49" />
          <circle className="st4" cx="616.9" cy="400.7" r="8.86" />
          <circle className="st5" cx="616.9" cy="400.7" r="2.39" />
          <circle className="st4" cx="616.71" cy="477.36" r="8.86" />
          <circle className="st5" cx="616.71" cy="477.36" r="2.39" />
          <circle className="st4" cx="465.73" cy="477.93" r="8.86" />
          <circle className="st5" cx="465.73" cy="477.93" r="2.39" />
          <circle className="st4" cx="465.73" cy="401.2" r="8.86" />
          <circle className="st5" cx="465.73" cy="401.2" r="2.39" />
          <path className="st0" d="M909.24,489.46l-9.99-3.53c-5-1.76-10.21-2.66-15.45-2.66h-92.9c-4.09,0-8.15,0.8-11.99,2.37l-8.31,3.4
		c-9.31,3.81-19.68-3.1-20.35-14.06c-0.02-0.39-0.04-0.78-0.04-1.18v-69.63c0-0.4,0.01-0.79,0.04-1.18
		c0.64-10.55,10.19-17.6,19.43-14.9l10.16,2.97c3.24,0.95,6.57,1.43,9.92,1.43h97.08c3.24,0,6.47-0.4,9.63-1.2l13.81-3.48
		c6.86-1.73,14.13,1.69,17.29,8.65c1.05,2.32,1.64,4.94,1.64,7.71v69.63c0,0.4-0.01,0.79-0.04,1.18
		C928.53,485.76,918.54,492.75,909.24,489.46z"/>
          <path className="st4" d="M887.41,473.31h-98.39c-0.72,0-1.4-0.18-2.01-0.51c-6.95-3.76-14.04-7.19-21.61-8.96l-15.11-3.52v-43.07
		l14.75-3.74c7.54-1.91,15.01-4.59,21.53-9.17c0.71-0.5,1.55-0.78,2.45-0.78h98.39c0.9,0,1.74,0.29,2.45,0.78
		c4.68,3.28,9.63,6.08,15.05,7.4l24.24,5.9v40.6l-16.99,4.59c-7.8,2.1-15.53,4.95-22.31,9.7
		C889.15,473.02,888.31,473.31,887.41,473.31z"/>
          <rect x="755.22" y="424.6" className="st4" width="32.59" height="28.79" />
          <rect x="888.22" y="424.6" className="st4" width="34" height="28.79" />
          <rect x="908.22" y="427.92" className="st5" width="10.58" height="21.71" />
          <rect x="758.89" y="427.92" className="st5" width="10.33" height="21.71" />
          <path className="mlu6" d="M874.73,433.33h-72.78c-5.4,0-9.78-5.17-9.78-11.55v-11.15c0-6.38,4.38-11.55,9.78-11.55h72.78
		c5.4,0,9.78,5.17,9.78,11.55v11.15C884.51,428.16,880.13,433.33,874.73,433.33z"/>
          <path className="mlu6" d="M874.54,476.91h-72.78c-5.4,0-9.78-5.17-9.78-11.55V454.2c0-6.38,4.38-11.55,9.78-11.55h72.78
		c5.4,0,9.78,5.17,9.78,11.55v11.15C884.32,471.74,879.94,476.91,874.54,476.91z"/>
          <path className="st0" d="M872.63,426.67h-68.96c-2.43,0-4.42-1.99-4.42-4.42v-11.77c0-2.43,1.99-4.42,4.42-4.42h68.96
		c2.43,0,4.42,1.99,4.42,4.42v11.77C877.05,424.68,875.06,426.67,872.63,426.67z"/>
          <path className="st0" d="M872.44,470.25h-68.96c-2.43,0-4.42-1.99-4.42-4.42v-11.77c0-2.43,1.99-4.42,4.42-4.42h68.96
		c2.43,0,4.42,1.99,4.42,4.42v11.77C876.86,468.26,874.87,470.25,872.44,470.25z"/>
          <ellipse className="st5" cx="869.35" cy="416.29" rx="2.25" ry="2.49" />
          <ellipse className="st5" cx="806.88" cy="416.29" rx="2.25" ry="2.49" />
          <ellipse className="st5" cx="869.16" cy="459.88" rx="2.25" ry="2.49" />
          <ellipse className="st5" cx="806.69" cy="459.88" rx="2.25" ry="2.49" />
          <circle className="st4" cx="915.23" cy="400.69" r="8.86" />
          <circle className="st5" cx="915.23" cy="400.69" r="2.39" />
          <circle className="st4" cx="915.04" cy="477.36" r="8.86" />
          <circle className="st5" cx="915.04" cy="477.36" r="2.39" />
          <circle className="st4" cx="764.05" cy="477.93" r="8.86" />
          <circle className="st5" cx="764.05" cy="477.93" r="2.39" />
          <circle className="st4" cx="764.05" cy="401.19" r="8.86" />
          <circle className="st5" cx="764.05" cy="401.19" r="2.39" />
        </g>
      </svg>
      </Stack>
    </Paper>
  );
}

export default TemperatureVis;
