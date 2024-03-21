import { TableCell, TableRow, styled } from "@mui/material";
import { TraceEvent } from "./types/TraceEvent";


const StyledTableRow = styled(TableRow)(({theme}) => ({
  backgroundColor: theme.palette.background.warn,
  // hide last border
}));


interface UndefinedRowProps {
  event: TraceEvent,
  useAbsoluteTime: boolean,
}

function UndefinedRow({ useAbsoluteTime, event }: UndefinedRowProps) {
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
