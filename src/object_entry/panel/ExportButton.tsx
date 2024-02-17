
import {IconButton, SxProps, Theme} from "@mui/material";
import SaveIcon from '@mui/icons-material/Save';

interface ExportButtonProps {
    nodeName: string,
    objectEntryName: string,
    sx? : SxProps<Theme>
}

function ExportButton({sx}: Readonly<ExportButtonProps>) {

    return <IconButton
        size="small"
        // onClick={handleRefreshClick}
        sx={sx}
        >
        <SaveIcon fontSize="small"/>
    </IconButton>
}

export default ExportButton
