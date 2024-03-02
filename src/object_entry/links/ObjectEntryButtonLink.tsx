import { IconButton, SxProps, Theme } from "@mui/material";
import TimelineIcon from '@mui/icons-material/Timeline';
import { useNavigate } from "react-router-dom";


interface ObjectEntryButtonLinkProps {
  nodeName: string,
  objectEntryName: string,
  sx?: SxProps<Theme>,
}




function ObjectEntryButtonLink({ nodeName, objectEntryName, sx }: Readonly<ObjectEntryButtonLinkProps>) {
  const nav = useNavigate();

  return (
    <IconButton 
      size="small"
      onClick={()=>nav(`/${nodeName}/${objectEntryName}`)}
      sx={sx}>
      <TimelineIcon fontSize="small" />
    </IconButton>
  )
}


export default ObjectEntryButtonLink;
