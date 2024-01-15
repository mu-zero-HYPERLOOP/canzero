import {useState} from "react";
import {invoke} from "@tauri-apps/api";
import {CircularProgress, IconButton} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

interface RefreshButtonProps {
    nodeName: string,
    objectEntryName: string,
}

function RefreshButton({nodeName, objectEntryName}: Readonly<RefreshButtonProps>) {
    const [getReqInProgess, setGetReqInProgess] = useState(false);

    function handleRefreshClick() {
        setGetReqInProgess(true);
        invoke("request_object_entry_value",
            {nodeName, objectEntryName}).then(() => {
            setGetReqInProgess(false);
        }).catch(() => {
            setGetReqInProgess(false);
        });
    }

    return <IconButton
        size="small"
        onClick={handleRefreshClick}
        sx={{
            position: "absolute",
            top: "7px",
            left: "calc(100% - 50px)",
        }}>
        {getReqInProgess ?
            <CircularProgress size={15} sx={{color: "grey"}}/> :
            <RefreshIcon fontSize="small"/>}
    </IconButton>
}

export default RefreshButton