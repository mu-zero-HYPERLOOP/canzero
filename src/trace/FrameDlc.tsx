import { SignalFrame } from "./types/SignalFrame.ts";
import { TypeFrame } from "./types/TypeFrame.ts";
import { UndefinedFrame } from "./types/UndefinedFrame.ts";


interface FrameDlcProp {
  frame : TypeFrame | UndefinedFrame | SignalFrame,
}

function FrameDlc({frame} : FrameDlcProp) {
  return <p>{frame.dlc}</p>
}

export default FrameDlc;
