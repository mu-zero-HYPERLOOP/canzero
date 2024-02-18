

import { Paper, Stack, Typography } from "@mui/material";
import "./StateVis.css"
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import { ObjectEntryListenLatestResponse } from "../../object_entry/types/events/ObjectEntryListenLatestResponse";
import { ObjectEntryEvent } from "../../object_entry/types/events/ObjectEntryEvent";
import { useEffect } from "react";


const MLU_OE = { nodeName: "mlu1", objectEntryName: "state" };
const MGU_OE = { nodeName: "mgu1", objectEntryName: "state" };
const DSLIM_OE = { nodeName: "motor_driver", objectEntryName: "state" };
const STATE_OE = { nodeName: "master", objectEntryName: "global_state" };


interface OeId {
  nodeName: string,
  objectEntryName: string,
}

async function registerOe(oe: OeId, property: string, element: HTMLElement, color: (_: string) => string) {
  const resp = await invoke<ObjectEntryListenLatestResponse>("listen_to_latest_object_entry_value", oe as any);
  if (resp.latest !== undefined && resp.latest !== null) {
    element.style.setProperty(property, color(resp.latest.value as string));
  }
  const unlistenJs = await listen<ObjectEntryEvent>(resp.event_name, event => {
    element.style.setProperty(property, color(event.payload.value as string));
  });

  return () => {
    unlistenJs();
    invoke("unlisten_from_latest_object_entry_value", oe as any);
  }
}

function StateVis() {

  useEffect(() => {
    const svg = document.getElementById("state_vis")!;
    let cleanup: (Promise<() => void>)[] = [];

    cleanup.push(registerOe(MLU_OE, "--mlu_state", svg, state => {
      switch (state) {
        case "INIT": return "#ffffff";
        case "IDLE": return "#0099f7";
        case "PRECHARGE": return "#bf00ff";
        case "READY": return "#4de339";
        case "START": return "#9fe339";
        case "CONTROL": return "#dae339";
        case "STOP": return "#ffa200";
        case "MANUAL": return "#3f39e3";
        case "ERROR": return "#ff0000";
        default: return "#000000";
      }
    }));
    cleanup.push(registerOe(MGU_OE, "--mgu_state", svg, state => {
      switch (state) {
        case "INIT": return "#ffffff";
        case "IDLE": return "#0099f7";
        case "PRECHARGE": return "#bf00ff";
        case "READY": return "#4de339";
        case "START": return "#9fe339";
        case "CONTROL": return "#dae339";
        case "STOP": return "#ffa200";
        case "MANUAL": return "#3f39e3";
        case "ERROR": return "#ff0000";
        default: return "#000000";
      }
    }));
    cleanup.push(registerOe(DSLIM_OE, "--dslim_state", svg, state => {
      switch (state) {
        case "INIT": return "#ffffff";
        case "IDLE": return "#0099f7";
        case "PRECHARGE": return "#bf00ff";
        case "READY": return "#4de339";
        case "START": return "#9fe339";
        case "CONTROL": return "#dae339";
        case "STOP": return "#ffa200";
        case "MANUAL": return "#3f39e3";
        case "ERROR": return "#ff0000";
        default: return "#000000";
      }
    }));
    cleanup.push(registerOe(STATE_OE, "--global_state", svg, state => {
      switch (state) {
        case "INIT": return "#ffffff";
        case "IDLE": return "#0099f7";
        case "PRECHARGE": return "#bf00ff";
        case "READY": return "#4de339";
        case "LEVITATION_STABLE":
        case "START_GUIDANCE":
        case "START_LEVITATION": return "#9fe339";
        case "GUIDANCE_STABLE": return "#dae339";
        case "ACCELERATION": return "#a200ff";
        case "CRUISING": return "#00e1ff";
        case "DECELERATION": return "#ffa200";
        default: return "#000000";
      }
    }));

    return () => {
      cleanup.forEach(p => p.then(f => f()).catch(console.error));
    };

  }, []);

  return (
    <Paper sx={{
      width: "100%",
      margin: 2,
      padding: 1,
    }}>
      <Stack>
      <Typography style={{textAlign: "center"}}>
        State
      </Typography>
      <svg version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        id="state_vis"
        x="0px"
        y="0px"
        viewBox="0 0 260.72 126.57">
        <g id="Layer_1">
          <rect x="172.26" y="96.39" className="st0" width="4.17" height="19.89" />
          <rect x="129.85" y="74.31" className="st0" width="2.53" height="46.45" />
          <rect x="28.72" y="5.67" className="st0" width="44.67" height="7.83" />
          <rect x="188.6" y="6.15" className="st0" width="44.67" height="7.83" />

          <rect x="238.46" y="82.04" transform="matrix(-1.836970e-16 1 -1 -1.836970e-16 337.1106 -165.1948)" className="st0" width="25.39" height="7.83" />

          <rect x="162.51" y="109.33" transform="matrix(-1 -1.224647e-16 1.224647e-16 -1 392.1474 226.5007)" className="st0" width="67.14" height="7.83" />

          <rect x="-1.58" y="83.04" transform="matrix(-1.836970e-16 1 -1 -1.836970e-16 98.0737 75.8421)" className="st0" width="25.39" height="7.83" />

          <rect x="86.39" y="96.06" transform="matrix(-1 -4.494683e-11 4.494683e-11 -1 176.9385 212.0105)" className="st0" width="4.17" height="19.89" />
          <rect x="33.17" y="109.01" className="st0" width="67.14" height="7.83" />
          <rect x="86.72" y="114.13" className="st0" width="85.54" height="7.2" />
        </g>
        <g id="pod">
          <path className="st1" d="M94.5,100.32h3.58c1.23,0,2.23-1,2.23-2.23V85.26H94.5V100.32z" />
          <path className="st1" d="M79.58,100.32h2.86V85.26h-5.43v12.49C77.01,99.17,78.16,100.32,79.58,100.32z" />

          <rect x="56.29" y="72.69" transform="matrix(-1 -4.491086e-11 4.491086e-11 -1 180.6544 161.7822)" className="st0" width="68.08" height="16.4" />
          <path className="st0" d="M77.01,90.05h23.29v-7.17c0-1.48-1.2-2.68-2.68-2.68H78.93c-1.06,0-1.92,0.86-1.92,1.92V90.05z" />

          <rect x="46.41" y="89.09" transform="matrix(-1 -4.489132e-11 4.489132e-11 -1 105.2237 192.9624)" className="st1" width="12.4" height="14.78" />
          <path className="st0" d="M26.87,99.32h3.09c0.57,0,1.03-0.46,1.03-1.03V74.93c0-0.55-0.45-0.99-0.99-0.99h-3.13V99.32z" />

          <rect x="24.96" y="81.32" transform="matrix(-1 -4.474833e-11 4.474833e-11 -1 53.7386 172.6256)" className="st0" width="3.82" height="9.98" />
          <path className="mgu" d="M23.1,83.6h4.64c0.58,0,1.04-0.47,1.04-1.04v-7.58c0-0.58-0.47-1.04-1.04-1.04H23.1
		c-0.58,0-1.04,0.47-1.04,1.04v7.58C22.05,83.13,22.52,83.6,23.1,83.6z"/>
          <path className="mgu" d="M23.07,99.32h4.69c0.56,0,1.02-0.46,1.02-1.02v-7.63c0-0.56-0.46-1.02-1.02-1.02h-4.69
		c-0.56,0-1.02,0.46-1.02,1.02v7.63C22.05,98.87,22.51,99.32,23.07,99.32z"/>

          <rect x="30.99" y="93.97" transform="matrix(-1 -4.507962e-11 4.507962e-11 -1 64.1597 190.1203)" className="st1" width="2.18" height="2.18" />
          <path className="st1" d="M168.32,100.65h-3.58c-1.23,0-2.23-1-2.23-2.23V85.59h5.81V100.65z" />
          <rect x="138.44" y="73.02" className="st0" width="68.08" height="16.4" />
          <rect x="204" y="89.42" className="st1" width="12.4" height="14.78" />
          <path className="st0" d="M235.94,99.65h-3.09c-0.57,0-1.03-0.46-1.03-1.03V75.26c0-0.55,0.45-0.99,0.99-0.99h3.13V99.65z" />
          <rect x="234.03" y="81.65" className="st0" width="3.82" height="9.98" />
          <polygon className="global" points="187.25,65.86 76.33,65.86 80.82,57.59 182.82,57.59 	" />
          <path className="st0" d="M221.93,60.12h-22.4c-0.61,0-1.11-0.5-1.11-1.11V27.6c0-0.61,0.5-1.11,1.11-1.11h22.4
		c0.61,0,1.11,0.5,1.11,1.11v31.41C223.03,59.62,222.53,60.12,221.93,60.12z"/>
          <path className="mlu" d="M188.6,58.19v-34.3c0-1.06,0.86-1.93,1.93-1.93h9.92c1.06,0,1.93,0.86,1.93,1.93v34.3
		c0,1.06-0.86,1.93-1.93,1.93h-9.92C189.47,60.12,188.6,59.25,188.6,58.19z"/>
          <path className="mlu" d="M219.5,58.26v-34.3c0-1.06,0.86-1.93,1.93-1.93h9.92c1.06,0,1.93,0.86,1.93,1.93v34.3
		c0,1.06-0.86,1.93-1.93,1.93h-9.92C220.37,60.18,219.5,59.32,219.5,58.26z"/>
          <path className="st0" d="M216.4,60.12h-11.08V36.37c0-0.69,0.56-1.25,1.25-1.25h8.58c0.69,0,1.25,0.56,1.25,1.25V60.12z" />
          <rect x="192.75" y="46.79" className="st1" width="5.49" height="18.41" />
          <rect x="223.65" y="46.79" className="st1" width="5.49" height="19.07" />
          <rect x="28.78" y="65.86" className="st0" width="204.5" height="2.46" />
          <path className="st0" d="M231.61,61.32h-41.16c-1.02,0-1.85-0.83-1.85-1.85v-4.59h44.67v4.78C233.28,60.57,232.53,61.32,231.61,61.32z"
          />
          <polygon className="st0" points="187.25,65.86 184.6,65.86 181.2,59.74 82.36,59.82 78.96,65.86 76.11,65.86 80.61,57.59 182.82,57.59 
			"/>
          <path className="mgu" d="M239.72,83.93h-4.64c-0.58,0-1.04-0.47-1.04-1.04v-7.58c0-0.58,0.47-1.04,1.04-1.04h4.64
		c0.58,0,1.04,0.47,1.04,1.04v7.58C240.76,83.46,240.29,83.93,239.72,83.93z"/>
          <path className="mgu" d="M239.74,99.65h-4.69c-0.56,0-1.02-0.46-1.02-1.02v-7.63c0-0.56,0.46-1.02,1.02-1.02h4.69
		c0.56,0,1.02,0.46,1.02,1.02v7.63C240.76,99.2,240.3,99.65,239.74,99.65z"/>
          <rect x="229.64" y="94.3" className="st1" width="2.18" height="2.18" />
          <rect x="229.64" y="77.44" className="st1" width="2.18" height="2.18" />
          <path className="st1" d="M183.23,100.65h-2.86V85.59h5.43v12.49C185.8,99.5,184.65,100.65,183.23,100.65z" />
          <path className="st0" d="M185.8,90.38h-23.29v-7.17c0-1.48,1.2-2.68,2.68-2.68h18.69c1.06,0,1.92,0.86,1.92,1.92V90.38z" />
          <rect x="91.07" y="22.85" className="st0" width="78.44" height="34.74" />
          <path className="st0" d="M62.04,60.05h-22.4c-0.61,0-1.11-0.5-1.11-1.11V27.53c0-0.61,0.5-1.11,1.11-1.11h22.4
		c0.61,0,1.11,0.5,1.11,1.11v31.41C63.14,59.55,62.64,60.05,62.04,60.05z"/>
          <path className="mlu" d="M28.72,58.12v-34.3c0-1.06,0.86-1.93,1.93-1.93h9.92c1.06,0,1.93,0.86,1.93,1.93v34.3
		c0,1.06-0.86,1.93-1.93,1.93h-9.92C29.58,60.05,28.72,59.19,28.72,58.12z"/>
          <path className="mlu" d="M59.61,58.19v-34.3c0-1.06,0.86-1.93,1.93-1.93h9.92c1.06,0,1.93,0.86,1.93,1.93v34.3
		c0,1.06-0.86,1.93-1.93,1.93h-9.92C60.48,60.12,59.61,59.25,59.61,58.19z"/>
          <path className="st0" d="M56.51,60.05H45.43V36.3c0-0.69,0.56-1.25,1.25-1.25h8.58c0.69,0,1.25,0.56,1.25,1.25V60.05z" />
          <rect x="32.86" y="46.73" className="st1" width="5.49" height="19.14" />
          <rect x="63.76" y="46.73" className="st1" width="5.49" height="19.14" />
          <path className="st0" d="M71.72,61.25H30.57c-1.02,0-1.85-0.83-1.85-1.85v-4.59h44.67v4.78C73.39,60.51,72.64,61.25,71.72,61.25z" />

          <rect x="30.99" y="77.52" transform="matrix(-1 -4.507962e-11 4.507962e-11 -1 64.1597 157.2233)" className="st1" width="2.18" height="2.18" />
          <rect x="139.01" y="38.11" className="st0" width="16.01" height="19.48" />
          <rect x="120.63" y="32.99" className="st0" width="26.62" height="24.6" />
          <rect x="106.71" y="43.24" className="st0" width="20.95" height="14.35" />
          <polygon className="st0" points="229.64,104.64 223.03,104.64 200.21,87.18 160.99,78.49 193.2,68.52 229.64,68.96 	" />
          <polygon className="st0" points="160.99,78.49 155.12,92.52 135.92,92.52 135.92,68.33 233.28,67.09 233.28,69.65 186.38,71.78 	" />

          <rect x="140.42" y="73.02" transform="matrix(-1 -4.480117e-11 4.480117e-11 -1 286.5154 161.4816)" className="dslim" width="5.68" height="15.44" />

          <rect x="146.1" y="75.23" transform="matrix(-1 -4.480117e-11 4.480117e-11 -1 297.8838 165.8947)" className="dslim" width="5.68" height="15.44" />

          <rect x="134.72" y="75.31" transform="matrix(-1 -4.480117e-11 4.480117e-11 -1 275.1263 166.0605)" className="dslim" width="5.68" height="15.44" />
          <polygon className="st0" points="33.17,104.31 39.78,104.31 62.6,86.85 101.82,78.17 69.61,68.19 33.17,68.63 	" />
          <polygon className="st0" points="102.35,78.49 108.05,92.52 126.66,92.52 126.66,68.33 28.78,67.44 28.78,70.08 77.74,71.78 	" />
          <rect x="121.97" y="75.23" className="dslim" width="5.68" height="15.44" />
          <rect x="116.28" y="72.94" className="dslim" width="5.68" height="15.44" />
          <rect x="110.59" y="75.23" className="dslim" width="5.68" height="15.44" />
        </g>
      </svg>
      </Stack>
    </Paper>
  );
}


export default StateVis;
