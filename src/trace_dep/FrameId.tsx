import { SignalFrame } from "./types/SignalFrame.ts";
import { UndefinedFrame } from "./types/UndefinedFrame.ts";
import { TypeFrame } from "./types/TypeFrame.ts";



interface FrameIdProps {
  frame : TypeFrame | UndefinedFrame | SignalFrame,
}

function FrameId({frame} : FrameIdProps) {
  return <p> 0x{frame.id.toString(16)}{frame.ide?"x":""} </p>
}

export default FrameId;
