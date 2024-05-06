import {Checkbox, TableCell, TableRow} from "@mui/material";
import {index} from "d3";

interface ObjectEntryRowProps {
    nodeName: string,
    objectEntryName: string,
    handleClick: (id: string) => void,
    isSelected: (id: string) => boolean,
}

function ObjectEntryRow({nodeName, objectEntryName, handleClick, isSelected}: ObjectEntryRowProps) {
    const id = nodeName + "/" + objectEntryName
    const isItemSelected = isSelected(id);
    const labelId = `enhanced-table-checkbox-${index}`;

    return (
        <TableRow
            hover
            role="checkbox"
            onClick={() => handleClick(id)}
            aria-checked={isItemSelected}
            selected={isItemSelected}
            key={id}
        >
            <TableCell
                sx={{
                    minWidth: "100vw",
                    maxWidth: "100vw",
                    overflow: "clip",
                }}
            >
                <Checkbox
                    color="primary"
                    checked={isItemSelected}
                    inputProps={{
                        'aria-labelledby': labelId,
                    }}
                />
                {nodeName}: {objectEntryName}
            </TableCell>

        </TableRow>);

}

export default ObjectEntryRow;
