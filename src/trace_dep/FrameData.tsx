import { ErrorFrame } from "./types/ErrorFrame.ts";
import { SignalFrame } from "./types/SignalFrame.ts";
import { TypeFrame } from "./types/TypeFrame.ts";
import { UndefinedFrame } from "./types/UndefinedFrame.ts";



interface FrameDataProps {
  frame : UndefinedFrame | ErrorFrame | TypeFrame | SignalFrame;
}

function FrameData({frame} : FrameDataProps) {
  return (<p> 0x{frame.data.toString(16)} </p>)
}

export default FrameData;
