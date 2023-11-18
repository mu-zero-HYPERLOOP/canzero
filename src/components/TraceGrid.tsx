// TraceGrid.tsx
import React, { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import Collapse from '@mui/material/Collapse';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const numberOfElements = 10;

interface TraceGridProps {
  // Add any additional props as needed
}

function TraceGrid({}: TraceGridProps) {
  const [rows, setRows] = useState<number[]>([]);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  useEffect(() => {
    let vec: number[] = [];

    const updateRows = (newVec: number[]) => {
      vec = newVec;
      setRows([...vec]);
    };

    const unsubscribe = listen<number>("random-integer", (event) => {
      let newVec = vec.slice(0, numberOfElements - 1);
      newVec.unshift(event.payload);
      updateRows(newVec);
    });

    return () => {
      unsubscribe.then(f => f());
    };
  }, []);

  const handleExpandRow = (rowIndex: number) => {
    setExpandedRow((prevRow) => (prevRow === rowIndex ? null : rowIndex));
  };

  return (
    <div style={{ margin: 'auto', padding: '10px', borderRadius: '8px', maxWidth: 'calc(100vw - 20px)' }}>
      <h2 style={{ textAlign: 'center' }}>Random Numbers Table</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>ID</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Random Number</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((number, index) => (
            <React.Fragment key={index}>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>{index + 1}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    {number}
                    <ExpandMoreIcon
                      onClick={() => handleExpandRow(index)}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                  <Collapse in={expandedRow === index} timeout="auto" unmountOnExit>
                    {/* Your content for the dropdown here */}
                    <div style={{ width: '90%', background: '#f0f0f0', padding: '10px' }}>
                      Additional content for row {index + 1}
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
