import { ErrorFrame } from "./ErrorFrame.ts";
import { SignalFrame } from "./SignalFrame.ts";
import { TypeFrame } from "./TypeFrame.ts";
import { UndefinedFrame } from "./UndefinedFrame.ts";


export interface Frame {
  SignalFrame?: SignalFrame;
  TypeFrame?: TypeFrame;
  UndefinedFrame?: UndefinedFrame;
  ErrorFrame?: ErrorFrame;
}

export default Frame;

