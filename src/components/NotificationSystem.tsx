import {useSnackbar} from "notistack";
import {Button} from "@mui/material";

function NotificationSystem() {
    return <MyButton/>
}

const MyButton = () => {
    const { enqueueSnackbar } = useSnackbar()
    return (
        <Button onClick={() => enqueueSnackbar('Test')}>
            Show snackbar
        </Button>
    )
}

export default NotificationSystem