

import {IconButton, SxProps, Theme} from "@mui/material";
import TimelineIcon from '@mui/icons-material/Timeline';

interface InterpolationModeButtonProps {
    sx? : SxProps<Theme>
}

function InterpolationModeButton({sx}: Readonly<InterpolationModeButtonProps>) {

    return <IconButton
        size="small"
        // onClick={handleRefreshClick}
        sx={sx}
        >
        <TimelineIcon fontSize="small"/>
    </IconButton>
}

export default InterpolationModeButton
