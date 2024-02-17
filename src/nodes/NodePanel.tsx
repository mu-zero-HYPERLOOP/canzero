import { InputAdornment, Paper, Skeleton, Table, TableBody, TableContainer, TableHead, TableRow, TextField, Typography, styled } from "@mui/material";
import { NodeInformation } from "./types/NodeInformation.ts";
import { useEffect, useRef, useState } from "react";
import { ObjectEntryEvent } from "../object_entry/types/events/ObjectEntryEvent.tsx";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import { NodeEvent } from "./types/NodeEvent.ts";
import ObjectEntryRow from "./ObjectEntryRow.tsx";
import { TableComponents, TableVirtuoso } from "react-virtuoso";
import React from "react";
import SearchIcon from '@mui/icons-material/Search';
import useFocusOnCtrlShortcut from "../trace2/FocusOnKey.tsx";


interface NodePanelProps {
  node: NodeInformation
}

interface RowData {
  objectEntryName: string,
  value: ObjectEntryEvent | null,
}


const StyledTableRow = styled(TableRow)(() => ({
  backgroundColor: "#f0f1f5",
  // hide last border
}));

const VirtuosoTableComponents: TableComponents<RowData> = {
  Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
    <TableContainer component={Paper} {...props} ref={ref} />
  )),
  Table: (props) => (
    <Table {...props} size="small" sx={{ borderCollapse: 'separate', tableLayout: 'fixed' }} />
  ),
  TableHead,
  TableRow: ({ item: _item, ...props }) => <StyledTableRow {...props} />,
  TableBody: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
    <TableBody {...props} ref={ref} />
  )),
};


function NodePanel({ node }: NodePanelProps) {

  const [rowData, setRowData] = useState<(RowData)[]>([]);
  const [filter, setFilter] = useState<number[]>(node.object_entries.map((_,i) => i));
  const [searchString, setSearchString] = useState<string>("");


  // register listener
  useEffect(() => {
    async function asyncSetup() {
      const event_name = await invoke<string>("listen_to_node_latest", { nodeName: node.name });
      const unlistenJs = await listen<NodeEvent>(event_name, event => {
        const rowData = event.payload.object_entry_values.map((value, index) => {
          return {
            objectEntryName: node.object_entries[index],
            value,
          };
        });
        setRowData(rowData);
      });

      return () => {
        unlistenJs();
        invoke("unlisten_from_node_latest", { nodeName: node.name }).catch(console.error);
      };
    }
    // init!
    setRowData([]);
    setFilter(node.object_entries.map((_,i) => i));
    setSearchString("");
    let asyncCleanup = asyncSetup();
    return () => {
      asyncCleanup.then(f => f()).catch(console.error);
    };
  }, [node.name]);

  function rowContent(_index: number, row: RowData) {
    return <ObjectEntryRow nodeName={node.name} objectEntryName={row?.objectEntryName} value={row.value?.value} />
  }

  const searchFieldRef = useRef() as any;

  useFocusOnCtrlShortcut("f", searchFieldRef)

  function updateFilter(filter_string : string) {
    const filter = [];
    for (let oe_index = 0; oe_index < node.object_entries.length; oe_index++) {
      if (node.object_entries[oe_index].startsWith(filter_string)) {
          filter.push(oe_index);
      }
    }
    setFilter(filter);
  }

  return (
    <Paper sx={{
      marginTop: "30px",
      marginLeft: "8px",
      marginRight: "10px",
      paddingLeft: "12px",
      paddingRight: "12px",
      width: "calc(100% - 16px)",
      height: "calc(100vh - 95px)",
      paddingTop: "45px",
      paddingBottom: "20px",
      position: "relative"
    }}>
      <Typography sx={{
        position: "absolute",
        top: "-12px",
        left: "12px",
        padding: "1px",

      }} variant="h5">{node.name}
      </Typography>

      {node.description ? <Typography sx={{
        position: "absolute",
        top: "18px",
        left: "20px",
        padding: "1px",

      }} variant="subtitle2">{node.description}</Typography>
        : <></>}

      <TextField
        inputRef={searchFieldRef}
        value={searchString}
        sx={{
          position: "absolute",
          top: "5px",
          right : "20px",
          width: "50%",
          maxWidth: "400px",
        }}
        variant="standard"
        inputProps={{
          style: {
            boxShadow: "none"
          }
        }}
        onChange={event => {
          setSearchString(event.target.value);
          updateFilter(event.target.value);
        }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
        }}
      >
      </TextField>
      {rowData.length == 0 ? <Skeleton

        variant="rounded"
        animation="wave"
        sx={{
          padding: 0,
          margin: 0,
          height: "100%",
        }}
      />
        :
        <TableVirtuoso
          style={{
            height: "100%",
            width: "100%",
          }}
          data={filter.map(i => rowData[i])}
          components={VirtuosoTableComponents}
          itemContent={rowContent}
        >
        </TableVirtuoso>
      }

    </Paper >
  );
}

// <Table 
//   size="small"
// >
//   <TableBody>
//     {rows}
//   </TableBody>
// </Table>

export default NodePanel
