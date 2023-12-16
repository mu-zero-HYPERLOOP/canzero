import {useEffect} from "react";
import {listen} from "@tauri-apps/api/event";

interface EstablishConnectionProps {
    setConnectingPossible: (isConnecting: boolean) => void;
}

function EstablishConnection({ setConnectingPossible }: Readonly<EstablishConnectionProps>) {
    async function asyncConnect() {
        return await listen("connecting_to_pod_possible", () => {
            setConnectingPossible(true)
        })
    }

    useEffect(() => {
        let unlisten = asyncConnect();

        return () => {
            unlisten.then(f => f()).catch(console.error);
        }
    }, []);

    return <></>
}

export default EstablishConnection