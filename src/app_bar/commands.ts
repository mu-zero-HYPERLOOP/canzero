import { invoke } from "@tauri-apps/api";
import { Value } from "../object_entry/types/Value";


const COMMAND_OE_NODE_NAME = "master";
const COMMAND_OE_NAME = "command";

const EMERGENCY: Value = "EMERGENCY";
const PRECHARGE: Value = "PRECHARGE";
const DISCONNECT: Value = "DISCONNECT";
const START_LEVITATION : Value = "START_LEVITATION";
const START_PROPULSION : Value = "START_PROPULSION";
const STOP_PROPULSION : Value = "STOP_PROPULSION";
const STOP_LEVITATION : Value = "STOP_LEVITATION";
const ABORT : Value = "ABORT";
const MANUAL : Value  = "MANUAL_CONTROL";

export function sendEmergencyCommand() {
  invoke("set_object_entry_value", {
    nodeName: COMMAND_OE_NODE_NAME, objectEntryName: COMMAND_OE_NAME,
    newValueJson: JSON.stringify(EMERGENCY)
  });
}

export function sendPrechargeCommand() {
  console.log("send precharge command");
  invoke("set_object_entry_value", {
    nodeName: COMMAND_OE_NODE_NAME, objectEntryName: COMMAND_OE_NAME,
    newValueJson: JSON.stringify(PRECHARGE)
  });
}

export function sendDisconnectCommand() {
  invoke("set_object_entry_value", {
    nodeName: COMMAND_OE_NODE_NAME, objectEntryName: COMMAND_OE_NAME,
    newValueJson: JSON.stringify(DISCONNECT)
  });
}

export function sendStartLevitationCommand() {
  invoke("set_object_entry_value", {
    nodeName: COMMAND_OE_NODE_NAME, objectEntryName: COMMAND_OE_NAME,
    newValueJson: JSON.stringify(START_LEVITATION)
  });
}

export function sendStopLevitationCommand() {
  invoke("set_object_entry_value", {
    nodeName: COMMAND_OE_NODE_NAME, objectEntryName: COMMAND_OE_NAME,
    newValueJson: JSON.stringify(STOP_LEVITATION)
  });
}


export function sendStartPropulsionCommand() {
  invoke("set_object_entry_value", {
    nodeName: COMMAND_OE_NODE_NAME, objectEntryName: COMMAND_OE_NAME,
    newValueJson: JSON.stringify(START_PROPULSION)
  });
}

export function sendStopPropulsionCommand() {
  invoke("set_object_entry_value", {
    nodeName: COMMAND_OE_NODE_NAME, objectEntryName: COMMAND_OE_NAME,
    newValueJson: JSON.stringify(STOP_PROPULSION)
  });
}

export function sendAbortCommand() {
  invoke("set_object_entry_value", {
    nodeName: COMMAND_OE_NODE_NAME, objectEntryName: COMMAND_OE_NAME,
    newValueJson: JSON.stringify(ABORT)
  });
}

export function sendManualControlCommand() {
  invoke("set_object_entry_value", {
    nodeName: COMMAND_OE_NODE_NAME, objectEntryName: COMMAND_OE_NAME,
    newValueJson: JSON.stringify(MANUAL)
  });
}
