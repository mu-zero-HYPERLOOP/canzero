import { ErrorFrame } from "../types/ErrorFrame";
import { SignalFrame } from "../types/SignalFrame";
import { TypeFrame } from "../types/TypeFrame";


interface FrameNameProps {
  frame : SignalFrame | TypeFrame | ErrorFrame;
}

function FrameName({frame} : FrameNameProps) {
  return <p> {frame.name} </p>
}

export default FrameName;
