import {useEffect} from "react";
import {invoke} from "@tauri-apps/api";

interface EstablishConnectionProps {
    setIsConnecting: (isConnecting: boolean) => void;
    setConnectionSuccess: (isConnecting: boolean) => void;
}

function EstablishConnection({ setIsConnecting, setConnectionSuccess }: Readonly<EstablishConnectionProps>) {
    async function asyncConnect() {
        try {
            await invoke("connect_pod");
            setConnectionSuccess(true)
        } catch(error) {
            // Success in false on default. Nothing to do.
        } finally {
            setIsConnecting(false)
        }
    }

    useEffect(() => {
        asyncConnect();
    }, []);

    return <></>
}

export default EstablishConnection