import { ErrorFrame } from "../types/ErrorFrame";
import { SignalFrame } from "../types/SignalFrame";
import { TypeFrame } from "../types/TypeFrame";
import { UndefinedFrame } from "../types/UndefinedFrame";



interface FrameDataProps {
  frame : UndefinedFrame | ErrorFrame | TypeFrame | SignalFrame;
}

function FrameData({frame} : FrameDataProps) {
  return (<p> 0x{frame.data.toString(16)} </p>)
}

export default FrameData;
