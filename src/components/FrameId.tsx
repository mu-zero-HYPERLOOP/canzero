import { SignalFrame } from "../types/SignalFrame";
import { UndefinedFrame } from "../types/UndefinedFrame";
import { TypeFrame } from "../types/TypeFrame";



interface FrameIdProps {
  frame : TypeFrame | UndefinedFrame | SignalFrame,
}

function FrameId({frame} : FrameIdProps) {
  return <p> 0x{frame.id.toString(16)}{frame.ide?"x":""} </p>
}

export default FrameId;
