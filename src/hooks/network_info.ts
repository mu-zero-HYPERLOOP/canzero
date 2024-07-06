import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api";
import { NetworkInformation } from "../nodes/types/NetworkInformation";



function useNetworkInfo() : NetworkInformation | undefined {
  const [info, setInfo] = useState<NetworkInformation>();
  useEffect(()=>{
    invoke<NetworkInformation>("network_information").then(setInfo).catch(console.error);
    return () => {
      setInfo(undefined);
    };
  }, []);
  return info;
}

export default useNetworkInfo;

