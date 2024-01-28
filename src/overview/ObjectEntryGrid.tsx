import {ObjectEntryGridInformation} from "./types/ObjectEntryGridInformation.tsx";
import ObjectEntryField from "./ObjectEntryField.tsx";
import { Box } from "@mui/material";

interface ObjectEntryGridProps {
    entries: ObjectEntryGridInformation[];
    width: number;
}

function ObjectEntryGrid({entries, width}: Readonly<ObjectEntryGridProps>) {
    return (
        <Box
            component="form"
            sx={{
                '& > :not(style)': { m: 0.7, width: width },
            }}
            noValidate
            autoComplete="off"
        >
            {
                entries.map((entry, index) => <ObjectEntryField
                    key={index}
                    node={entry.node}
                    name={entry.entry}
                    min={entry.min}
                    max={entry.max}/>)
            }
        </Box>
    );
}

export default ObjectEntryGrid