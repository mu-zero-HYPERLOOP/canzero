import { SignalFrame } from "../types/SignalFrame";
import { TypeFrame } from "../types/TypeFrame";
import { UndefinedFrame } from "../types/UndefinedFrame";


interface FrameDlcProp {
  frame : TypeFrame | UndefinedFrame | SignalFrame,
}

function FrameDlc({frame} : FrameDlcProp) {
  return <p>{frame.dlc}</p>
}

export default FrameDlc;
