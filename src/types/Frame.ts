import { ErrorFrame } from "./ErrorFrame";
import { SignalFrame } from "./SignalFrame";
import { TypeFrame } from "./TypeFrame";
import { UndefinedFrame } from "./UndefinedFrame";


export interface Frame {
  SignalFrame?: SignalFrame;
  TypeFrame?: TypeFrame;
  UndefinedFrame?: UndefinedFrame;
  ErrorFrame?: ErrorFrame;
}

export default Frame;

