import { useEffect, useState } from "react";
import { ObjectEntryInformation } from "../object_entry/types/ObjectEntryInformation";
import { invoke } from "@tauri-apps/api";


function useObjectEntryInfo(nodeName: string, objectEntryName: string): ObjectEntryInformation | undefined {
  const [info, setInfo] = useState<ObjectEntryInformation>();

  useEffect(() => {
    invoke<ObjectEntryInformation>("object_entry_information", { nodeName, objectEntryName }).then(setInfo).catch(console.error);
    return () => {
      setInfo(undefined);
    };
  }, [nodeName, objectEntryName]);

  return info;
}

export default useObjectEntryInfo;
