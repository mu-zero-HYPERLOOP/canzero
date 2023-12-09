import {closeSnackbar, useSnackbar} from "notistack";
import {useEffect} from "react";
import {listen} from "@tauri-apps/api/event";
import {Button} from "@mui/material";

const action = (snackbarId: any) => (
    <Button onClick={() => {
        closeSnackbar(snackbarId)
    }}>
        Dismiss
    </Button>
);

function NotificationSystem() {
    const {enqueueSnackbar} = useSnackbar()

    useEffect(() => {
        let unsubscribe = listen<Notification>("notification", (event) => {
            let notification = event.payload

            switch (notification.level) {
                case "info" : {
                    enqueueSnackbar(notification.message, {autoHideDuration: 2000, preventDuplicate: true, variant: "info"})
                    break
                }
                case "debug": {
                    enqueueSnackbar(notification.message, {autoHideDuration: 3000, preventDuplicate: true, variant: "default"})
                    break
                }
                case "warning": {
                    enqueueSnackbar(notification.message, {autoHideDuration: 5000, preventDuplicate: true, variant: "warning"})
                    break
                }
                case "error": {
                    enqueueSnackbar(notification.message, {action, preventDuplicate: true, variant: "error"})
                    break
                }
            }
        });

        return () => {
            unsubscribe.then(f => f());
        };
    }, []);

    return (<></>)
}

export default NotificationSystem