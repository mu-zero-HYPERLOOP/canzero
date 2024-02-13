import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { SignalFrame } from "./types/SignalFrame.ts";


interface SignalFrameDetailProps {
  frame : SignalFrame,
}

function SignalFrameDetail({frame} : SignalFrameDetailProps) {
    return (
      <Table size="small" aria-label="purchases">
        <TableHead>
          <TableRow>
            <TableCell align="left">Attribute</TableCell>
            <TableCell align="left">Value</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {frame.signals.map((signal) => {
            return (
              <TableRow key={signal.name}>
                <TableCell>{signal.name}</TableCell>
                <TableCell component="th" scope="row">
                  {signal.value as (number | string)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
}

export default SignalFrameDetail;
