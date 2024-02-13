import { Box, Collapse, IconButton, Table, TableBody, TableCell, TableRow, styled } from "@mui/material";
import { TraceEvent } from "./types/TraceEvent";

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';


const StyledTableRow = styled(TableRow)(() => ({

  backgroundColor: "#f2e9ce",
  // hide last border
}));


interface UndefinedRowProps {
  open: { [key: number]: boolean },
  setOpen: React.Dispatch<React.SetStateAction<{ [key: number]: boolean }>>
  event: TraceEvent,
  useAbsoluteTime: boolean,
}

function UndefinedRow({ useAbsoluteTime, open, setOpen, event }: UndefinedRowProps) {
  return (<>
    <StyledTableRow>
      <TableCell sx={{ padding: 0, textAlign: "center", lineHeight: "100%" }}>
      </TableCell>
      <TableCell>
        {useAbsoluteTime ? `${event.absoluteTime}s` : `${event.deltaTime}ms`}
      </TableCell>
      <TableCell>
        {event.frame.id}
      </TableCell>
      <TableCell>
        {event.frame.name}
      </TableCell>
      <TableCell>
        {event.bus}
      </TableCell>
      <TableCell>
        {event.frame.dlc}
      </TableCell>
    </StyledTableRow></>);

}
export default UndefinedRow;
