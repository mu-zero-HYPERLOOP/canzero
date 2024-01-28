import {useEffect} from "react";
import {listen} from "@tauri-apps/api/event";
import {invoke} from "@tauri-apps/api";

enum ConnectionStates {
    // in this state the CNL is connected to a CAN bus, but no heartbeats are
    // received from the system.
    CanConnected = "can-connected",

    // Here it is connected to the CAN buses and heartbeats are received
    NetworkConnected = "network-connected",

    // Here the CAN is disconnected this can basically only happen if
    // the program panics during initalization of the CAN modules
    CanDisconnected = "can-disconnected",
}

function handleConnectionStatus(event: string, setConnectingPossible: (isConnecting: boolean) => void, setConnectionSuccess: (isConnecting: boolean) => void) {
    if (event === ConnectionStates.CanConnected) {
        setConnectingPossible(true)
    } else if (event === ConnectionStates.NetworkConnected) {
        setConnectionSuccess(true)
    } else if (event === ConnectionStates.CanDisconnected) {
        setConnectingPossible(false)
        setConnectionSuccess(false)
    }
}

interface EstablishConnectionPossibleProps {
    setConnectingPossible: (isConnecting: boolean) => void;
    setConnectionSuccess: (isConnecting: boolean) => void;
}

function EstablishConnection({ setConnectingPossible, setConnectionSuccess }: Readonly<EstablishConnectionPossibleProps>) {
    async function asyncConnectListener() {
        return await listen<string>("connection-status", (event) => {
            console.log(event.payload)
            handleConnectionStatus(event.payload, setConnectingPossible, setConnectionSuccess)

        })
    }

     async function asyncGetConnection() {
        await invoke<string>("get_connection_status").then((event) => {
            console.log(event)
            handleConnectionStatus(event, setConnectingPossible, setConnectionSuccess)
        })
    }

    useEffect(() => {
        let unlisten = asyncConnectListener();
        asyncGetConnection();

        return () => {
            unlisten.then(f => f()).catch(console.error);
        }
    }, []);

    return <></>
}

export default EstablishConnection