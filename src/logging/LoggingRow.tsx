import {Checkbox, TableCell, TableRow, Typography} from "@mui/material";
import {index} from "d3";

interface ObjectEntryRowProps {
    nodeName: string,
    objectEntryName: string,
    handleClick: (id: [string, string]) => void,
    isSelected: (id: [string, string]) => boolean,
}

function ObjectEntryRow({nodeName, objectEntryName, handleClick, isSelected}: Readonly<ObjectEntryRowProps>) {
    const id: [string, string] = [nodeName, objectEntryName]
    const isItemSelected = isSelected(id);
    const labelId = `enhanced-table-checkbox-${index}`;

    return (
        <TableRow
            hover
            role="checkbox"
            onClick={() => handleClick(id)}
            aria-checked={isItemSelected}
            selected={isItemSelected}
            key={nodeName + "/" + objectEntryName}
        >
            <TableCell
                padding="checkbox"
            >
                <Checkbox
                color="primary"
                checked={isItemSelected}
                inputProps={{
                    'aria-labelledby': labelId,
                }}
            />
            </TableCell>
            <TableCell
                component="th"
                id={labelId}
                scope="row"
                padding="none"
                sx={{
                    width: "100%",
                    overflow: "clip",
                }}>
                <Typography variant="inherit" sx={{ marginLeft: "10px", width: "100%" }}>
                    {nodeName}: {objectEntryName}
                </Typography>
            </TableCell>


        </TableRow>);

}

export default ObjectEntryRow;
