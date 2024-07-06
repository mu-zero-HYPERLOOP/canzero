import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api";
import { NodeInformation } from "../nodes/types/NodeInformation";

function useNodeInfo(nodeName : string) : NodeInformation | undefined {
  const [info, setInfo] = useState<NodeInformation>();

  useEffect(()=> {
    invoke<NodeInformation>("node_information", {nodeName}).then(setInfo).catch(console.error);
    return () =>{
      setInfo(undefined);
    }
  }, [nodeName]);

  return info;
}

export default useNodeInfo;
