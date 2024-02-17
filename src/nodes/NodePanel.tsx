import { Paper, Skeleton, Table, TableBody, TableContainer, TableHead, TableRow, Typography, styled } from "@mui/material";
import { NodeInformation } from "./types/NodeInformation.ts";
import { useEffect, useState } from "react";
import { ObjectEntryEvent } from "../object_entry/types/events/ObjectEntryEvent.tsx";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import { NodeEvent } from "./types/NodeEvent.ts";
import ObjectEntryRow from "./ObjectEntryRow.tsx";
import { TableComponents, TableVirtuoso } from "react-virtuoso";
import React from "react";


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

  let [rowData, setRowData] = useState<(RowData)[]>([]);

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
    setRowData([]);
    let asyncCleanup = asyncSetup();
    return () => {
      asyncCleanup.then(f => f()).catch(console.error);
    };
  }, [node.name]);

  function rowContent(_index: number, row: RowData) {
    return <ObjectEntryRow nodeName={node.name} objectEntryName={row?.objectEntryName} value={row.value?.value} />
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
          style = {{
            height : "100%",
            width: "100%",
          }}
          data={rowData}
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
