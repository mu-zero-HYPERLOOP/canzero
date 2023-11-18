// TraceGrid.tsx
import React, { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import Collapse from "@mui/material/Collapse";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import Button from "@mui/material/Button";

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
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [subscriptionActive, setSubscriptionActive] = useState(false); // Change initial state to false

  useEffect(() => {
    let vec: SerializedFrame[] = [];

    const updateRows = (newVec: SerializedFrame[]) => {
      vec = newVec;
      setRows([...vec]);
    };

    const handleRxFrame = (event: any) => {
      if (subscriptionActive) {
        let newVec = vec.slice(0, numberOfElements - 1);
        newVec.unshift(event.payload);
        updateRows(newVec);
      }
    };

    if (subscriptionActive) {
      const unsubscribe = listen<SerializedFrame>("rx-frame", handleRxFrame);

      return () => {
        unsubscribe.then((f) => f());
      };
    }
  }, [subscriptionActive]); // Include subscriptionActive in the dependency array

  const handleExpandRow = (rowIndex: number) => {
    setExpandedRow((prevRow) => (prevRow === rowIndex ? null : rowIndex));
  };

  const handleSort = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const handleToggleSubscription = () => {
    setSubscriptionActive(!subscriptionActive);
  };

  const handleStopStartText = subscriptionActive ? "Stop" : "Start";
  const buttonColor = subscriptionActive ? "secondary" : "success"; // Change color to green when starting

  const sortedRows = [...rows].sort((a, b) => {
    if (sortOrder === "asc") {
      return (a.SignalFrame?.id || 0) - (b.SignalFrame?.id || 0);
    } else {
      return (b.SignalFrame?.id || 0) - (a.SignalFrame?.id || 0);
    }
  });

  return (
    <div style={{ margin: "auto", padding: "10px", borderRadius: "8px", maxWidth: "calc(100vw - 20px)" }}>
      <h2 style={{ textAlign: "center" }}>Serialized Frames Table</h2>
      <div style={{ marginBottom: "10px" }}>
        <Button variant="contained" color={buttonColor} onClick={handleToggleSubscription}>
          {handleStopStartText}
        </Button>
      </div>
      <div style={{ maxHeight: "500px", overflowY: "auto" }}> {/* Set your preferred max height */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left", cursor: "pointer" }} onClick={handleSort}>
                ID
                {sortOrder === "asc" ? <ArrowDropDownIcon /> : <ArrowDropUpIcon />}
              </th>
              <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Frame Data</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((frame, index) => (
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
    </div>
  );
}

export default TraceGrid;
