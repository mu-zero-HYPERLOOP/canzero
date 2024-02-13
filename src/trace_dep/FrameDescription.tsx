import { ErrorFrame } from "./types/ErrorFrame.ts";
import { SignalFrame } from "./types/SignalFrame.ts";
import { TypeFrame } from "./types/TypeFrame.ts";


interface FrameDescriptionProps {
  frame : SignalFrame | TypeFrame | ErrorFrame;
}

function FrameDescription({frame} : FrameDescriptionProps) {
  return <p> {frame.description} </p>
}

export default FrameDescription;
