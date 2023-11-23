import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import '../styles.css'
import interpolate from 'color-interpolate';

function createData(
    sensor1: number,
    sensor2: number,
    sensor3: number,
    sensor4: number,
    sensor5: number,
    sensor6: number,
    sensor7: number,
    sensor8: number,
    sensor9: number,
    sensor10: number,
) {
    return { sensor1, sensor2, sensor3, sensor4, sensor5, sensor6, sensor7, sensor8, sensor9, sensor10 };
}

const rows = [
    createData(20, 23, 26, 29, 32, 35, 38, 41, 44, 47),
    createData(20, 23, 26, 29, 32, 35, 38, 41, 44, 47),
    createData(20, 23, 26, 29, 32, 35, 38, 41, 44, 47),
    createData(20, 23, 26, 29, 32, 35, 38, 41, 44, 47),
    createData(20, 23, 26, 29, 32, 35, 38, 41, 44, 47),
];

function getColor(value:number) {
    let colormap = interpolate(['#2e7e31', '#d2302e']);
    let percent = (value - 20) / (47 - 20)
    return colormap(percent)
}
export default function ControlTable() {
    return (
        <div className="ControlTable">
        <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                    <TableRow>
                        <TableCell align="center" colSpan={10}>
                            Current Pod Temperatures
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((row) => (
                        <TableRow>
                            <TableCell align="center" style={{backgroundColor:getColor(row.sensor1)}}>{row.sensor1} </TableCell>
                            <TableCell align="center" style={{backgroundColor:getColor(row.sensor2)}}>{row.sensor2}</TableCell>
                            <TableCell align="center" style={{backgroundColor:getColor(row.sensor3)}}>{row.sensor3}</TableCell>
                            <TableCell align="center" style={{backgroundColor:getColor(row.sensor4)}}>{row.sensor4}</TableCell>
                            <TableCell align="center" style={{backgroundColor:getColor(row.sensor5)}}>{row.sensor5}</TableCell>
                            <TableCell align="center" style={{backgroundColor:getColor(row.sensor6)}}>{row.sensor6}</TableCell>
                            <TableCell align="center" style={{backgroundColor:getColor(row.sensor7)}}>{row.sensor7}</TableCell>
                            <TableCell align="center" style={{backgroundColor:getColor(row.sensor8)}}>{row.sensor8}</TableCell>
                            <TableCell align="center" style={{backgroundColor:getColor(row.sensor9)}}>{row.sensor9}</TableCell>
                            <TableCell align="center" style={{backgroundColor:getColor(row.sensor10)}}>{row.sensor10}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
        </div>
    );
}
