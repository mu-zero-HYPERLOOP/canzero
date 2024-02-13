import { Frame } from "./Frame.ts";

export interface TraceObjectEvent {
  frame: Frame,
  timestamp: string,
  delta_time: string,
}
