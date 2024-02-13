import { ErrorFrame } from "./types/ErrorFrame.ts";
import { SignalFrame } from "./types/SignalFrame.ts";
import { TypeFrame } from "./types/TypeFrame.ts";


interface FrameNameProps {
  frame : SignalFrame | TypeFrame | ErrorFrame;
}

function FrameName({frame} : FrameNameProps) {
  return <p> {frame.name} </p>
}

export default FrameName;
