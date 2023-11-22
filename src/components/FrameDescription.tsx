import { ErrorFrame } from "../types/ErrorFrame";
import { SignalFrame } from "../types/SignalFrame";
import { TypeFrame } from "../types/TypeFrame";


interface FrameDescriptionProps {
  frame : SignalFrame | TypeFrame | ErrorFrame;
}

function FrameDescription({frame} : FrameDescriptionProps) {
  return <p> {frame.description} </p>
}

export default FrameDescription;
