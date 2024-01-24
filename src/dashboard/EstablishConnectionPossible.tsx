import {useEffect} from "react";
import {listen} from "@tauri-apps/api/event";

interface EstablishConnectionPossibleProps {
    setConnectingPossible: (isConnecting: boolean) => void;
}

function EstablishConnectionPossible({ setConnectingPossible }: Readonly<EstablishConnectionPossibleProps>) {
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

export default EstablishConnectionPossible