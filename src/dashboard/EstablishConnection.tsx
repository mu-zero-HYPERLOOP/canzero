import {useEffect} from "react";
import {listen} from "@tauri-apps/api/event";

enum ConnectionStates {
    // in this state the CNL is connected to a CAN bus, but no heartbeats are
    // received from the system.
    CanConnected,

    // Here it is connected to the CAN buses and heartbeats are received
    NetworkConnected,

    // Here the CAN is disconnected this can basically only happen if
    // the program panics during initalization of the CAN modules
    CanDisconnected,
}

interface EstablishConnectionPossibleProps {
    setConnectingPossible: (isConnecting: boolean) => void;
}

function EstablishConnection({ setConnectingPossible }: Readonly<EstablishConnectionPossibleProps>) {
    async function asyncConnect() {
        return await listen<string>("connection-status", (event) => {
            console.log(event.payload)
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