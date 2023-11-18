// TraceGrid.tsx
import React, { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import Collapse from "@mui/material/Collapse";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const numberOfElements = 10;

interface TraceGridProps {
  // Add any additional props as needed
}

interface SerializedSignalFrame {
  id: number;
  ide: boolean;
  rtr: boolean;
  dlc: number;
  signals: SerializedSignal[];
}

interface SerializedSignal {
  name: string;
  value: string;
}

interface SerializedTypeFrame {
  id: number;
  ide: boolean;
  rtr: boolean;
  dlc: number;
  attributes: SerializedAttribute[];
}

interface SerializedAttribute {
  name: string;
  value: number | string | SerializedAttribute[];
}

interface SerializedFrame {
  SignalFrame?: SerializedSignalFrame;
  TypeFrame?: SerializedTypeFrame;
  UndefinedFrame?: undefined;
  //ErrorFrame?: ErrorFrame;
}

function TraceGrid({}: TraceGridProps) {
  const [rows, setRows] = useState<SerializedFrame[]>([]);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  useEffect(() => {
    let vec: SerializedFrame[] = [];

    const updateRows = (newVec: SerializedFrame[]) => {
      vec = newVec;
      setRows([...vec]);
    };

    const unsubscribe = listen<SerializedFrame>("rx-frame", (event) => {
      let newVec = vec.slice(0, numberOfElements - 1);
      newVec.unshift(event.payload);
      updateRows(newVec);
    });

    return () => {
      unsubscribe.then((f) => f());
    };
  }, []);

  const handleExpandRow = (rowIndex: number) => {
    setExpandedRow((prevRow) => (prevRow === rowIndex ? null : rowIndex));
  };

  return (
    <div style={{ margin: "auto", padding: "10px", borderRadius: "8px", maxWidth: "calc(100vw - 20px)" }}>
      <h2 style={{ textAlign: "center" }}>Serialized Frames Table</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>ID</th>
            <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Frame Data</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((frame, index) => (
            <React.Fragment key={index}>
              <tr>
                <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>
                  {/* Display the ID of each frame */}
                  {frame.SignalFrame && frame.SignalFrame.id}
                  {frame.TypeFrame && frame.TypeFrame.id}
                  {/* Add similar blocks for other frame types (UndefinedFrame, ErrorFrame) */}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    {/* Display relevant information based on frame type */}
                    {frame.SignalFrame && (
                      <div>
                        <p>ID: {frame.SignalFrame.id}</p>
                        <p>IDE: {frame.SignalFrame.ide.toString()}</p>
                        {/* Add more fields as needed */}
                      </div>
                    )}
                    {/* Add similar blocks for other frame types (TypeFrame, UndefinedFrame, ErrorFrame) */}
                    <ExpandMoreIcon onClick={() => handleExpandRow(index)} style={{ cursor: "pointer" }} />
                  </div>
                  <Collapse in={expandedRow === index} timeout="auto" unmountOnExit>
                    {/* Your content for the dropdown here */}
                    <div style={{ width: "90%", background: "#f0f0f0", padding: "10px" }}>
                      {/* Display additional content for the selected row */}
                      {frame.TypeFrame && (
                        <div>
                          <p>ID: {frame.TypeFrame.id}</p>
                          {/* Add more fields as needed */}
                        </div>
                      )}
                      {/* Add similar blocks for other frame types (UndefinedFrame, ErrorFrame) */}
                    </div>
                  </Collapse>
                </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TraceGrid;
