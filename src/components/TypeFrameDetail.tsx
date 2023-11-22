import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { TypeFrame } from "../types/TypeFrame";


interface TypeFrameDetailProps {
  frame : TypeFrame,
}

function TypeFrameDetail({frame} : TypeFrameDetailProps) {
    return (
      <Table size="small" aria-label="purchases">
        <TableHead>
          <TableRow>
            <TableCell align="left">Attribute</TableCell>
            <TableCell align="left">Value</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {frame.attributes.map((attribute) => {
            return (
              <TableRow key={attribute.name}>
                <TableCell>{attribute.name}</TableCell>
                <TableCell component="th" scope="row">
                  {attribute.value as (number | string)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
}

export default TypeFrameDetail;
