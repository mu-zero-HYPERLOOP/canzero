import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import '../styles.css'
import CustomTableCell from "./CustomTableCell.tsx";
import {NodeInformation} from "../nodes/types/NodeInformation.ts";

interface ValueTableprops {
    nodes: NodeInformation[];
    width: number;
    height: number
}

export default function ValueTable({nodes, width, height}: Readonly<ValueTableprops>) {
    return (
        <div className="ControlTable">
            <TableContainer component={Paper}>
                <Table sx={{width: {width}, height: height}} aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell align="center" colSpan={5}>
                                Current Pod Temperatures
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            {nodes.map((entry: NodeInformation) => {
                                if (entry.name === "secu")
                                    return (<>
                                            <CustomTableCell node={entry} name={"position"} min={20} max={47}/>
                                            <CustomTableCell node={entry} name={"pressure_sensor_0"} min={20} max={47}/>
                                            <CustomTableCell node={entry} name={"pressure_sensor_1"} min={20} max={47}/>
                                            <CustomTableCell node={entry} name={"pressure_sensor_2"} min={20} max={47}/>
                                            <CustomTableCell node={entry} name={"pressure_sensor_3"} min={20} max={47}/>
                                        </>
                                    )
                            })}
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
}
