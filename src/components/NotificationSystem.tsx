import {useSnackbar} from "notistack";
import {useEffect} from "react";
import {listen} from "@tauri-apps/api/event";

function NotificationSystem() {
    const { enqueueSnackbar } = useSnackbar()

    useEffect(() => {
        let unsubscribe =  listen<Notification>("notification", (event) => {
            enqueueSnackbar(event.payload)
        });

        return () => {
            unsubscribe.then(f => f());
        };
    }, []);

}


export default NotificationSystem