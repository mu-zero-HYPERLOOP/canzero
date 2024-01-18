import { Box, Collapse, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, styled, Stack, Button, Tooltip } from "@mui/material";
import { AccessAlarm, ChangeHistory } from "@mui/icons-material";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import React, { useEffect, useState, useRef } from "react";
import FrameName from "./FrameName.tsx";
import FrameId from "./FrameId.tsx";
import FrameData from "./FrameData.tsx";
import FrameDlc from "./FrameDlc.tsx";
import FrameTime from "./FrameTime.tsx";
import { TraceObjectEvent } from "./types/TraceObjectEvent.ts";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DensityLargeIcon from '@mui/icons-material/DensityLarge';
import DensityMediumIcon from '@mui/icons-material/DensityMedium';
import DensitySmallIcon from '@mui/icons-material/DensitySmall';
import { TypeFrame } from "./types/TypeFrame.ts";
import TypeFrameDetail from "./TypeFrameDetail.tsx";
import { SignalFrame } from "./types/SignalFrame.ts";
import SignalFrameDetail from "./SignalFrameDetail.tsx";
import { UndefinedFrame } from "./types/UndefinedFrame.ts";
import { ErrorFrame } from "./types/ErrorFrame.ts";
import TraceSearchBar from "./TraceSearchBar.tsx";
import Fuse from 'fuse.js';

// Main Paper component with gradient background
const StyledPaper = styled(Paper)({
  background: 'black',
  color: '#FFFFFF',
  overflow: 'hidden',
});

const TableHeaderCell = styled(TableCell)({
  backgroundColor: 'gray', // Black background for header
  color: '#FFFFFF', // White text
  position: 'relative', // For positioning the sorting icons
  cursor: 'pointer', // Change cursor to pointer on hover
});

const SignalFrameCell = styled(TableCell)(({ theme }) =>
  theme.unstable_sx({
    color: 'primary',
    backgroundColor: "#D3D3D3",
  }),
);

const TypeFrameCell = styled(TableCell)(({ theme }) =>
  theme.unstable_sx({
    color: 'primary',
    backgroundColor: "#D3D3D3",
  }),
);

const UndefinedFrameCell = styled(TableCell)(({ theme }) =>
  theme.unstable_sx({
    color: "primary",
    backgroundColor: "yellow",
  }),
);

const ErrorFrameCell = styled(TableCell)(({ theme }) =>
  theme.unstable_sx({
    color: "primary",
    backgroundColor: "red",
  }),
);

const IconButtonStyled = styled(IconButton)({
  background: 'white',
  color: '#00d6ba',
});

type RowDensity = 'compact' | 'standard' | 'comfortable';
const rowDensities = {
  compact: { padding: '4px 10px' },
  standard: { padding: '10px 15px' },
  comfortable: { padding: '15px 20px' },
};


interface SignalFrameRowProps {
  frame: SignalFrame,
  timestamp: string,
  rowDensity: RowDensity,
}

function SignalFrameRow({ frame, timestamp, rowDensity }: SignalFrameRowProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset', ...rowDensities[rowDensity] } }}>
        <TableCell>
          <IconButtonStyled
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButtonStyled>
        </TableCell>
        <SignalFrameCell align="left"><FrameName frame={frame} /></SignalFrameCell>
        <SignalFrameCell align="left"><FrameId frame={frame} /></SignalFrameCell>
        <SignalFrameCell align="left"><FrameData frame={frame} /></SignalFrameCell>
        <SignalFrameCell align="left"><FrameDlc frame={frame} /></SignalFrameCell>
        <SignalFrameCell align="left"><FrameTime timestamp={timestamp} /></SignalFrameCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0, background: 'white' }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box component="form" sx={{ margin: 1 }}>
              <SignalFrameDetail frame={frame} />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

interface TypeFrameRowProps {
  frame: TypeFrame,
  timestamp: string,
  rowDensity: RowDensity,
}


function TypeFrameRow({ frame, timestamp, rowDensity }: TypeFrameRowProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset', ...rowDensities[rowDensity] } }}>
        <TypeFrameCell>
          <IconButtonStyled
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButtonStyled>
        </TypeFrameCell>
        <TypeFrameCell align="left"><FrameName frame={frame} /></TypeFrameCell>
        <TypeFrameCell align="left"><FrameId frame={frame} /></TypeFrameCell>
        <TypeFrameCell align="left"><FrameData frame={frame} /></TypeFrameCell>
        <TypeFrameCell align="left"><FrameDlc frame={frame} /></TypeFrameCell>
        <TypeFrameCell align="left"><FrameTime timestamp={timestamp} /></TypeFrameCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0,  background: 'white' }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box component="form" sx={{ margin: 1 }}>
              <TypeFrameDetail frame={frame} />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

interface UndefinedFrameRowProps {
  frame: UndefinedFrame
  timestamp: string,
  rowDensity: RowDensity,
}


function UndefinedFrameRow({ frame, timestamp, rowDensity }: UndefinedFrameRowProps) {
  return (
    <TableRow sx={{ '& > *': { borderBottom: 'unset', ...rowDensities[rowDensity] } }}>
      <UndefinedFrameCell>
        <IconButtonStyled
          aria-label="expand row"
          size="small"
        />
      </UndefinedFrameCell>
      <UndefinedFrameCell align="left" />
      <UndefinedFrameCell align="left"><FrameId frame={frame} /></UndefinedFrameCell>
      <UndefinedFrameCell align="left"><FrameData frame={frame} /></UndefinedFrameCell>
      <UndefinedFrameCell align="left"><FrameDlc frame={frame} /></UndefinedFrameCell>
      <UndefinedFrameCell align="left"><FrameTime timestamp={timestamp} /></UndefinedFrameCell>
    </TableRow>
  );
}

interface ErrorFrameRowProps {
  frame: ErrorFrame,
  timestamp: string,
  rowDensity: RowDensity,
}


function ErrorFrameRow({ frame, timestamp, rowDensity }: ErrorFrameRowProps) {
  return (
    <TableRow sx={{ '& > *': { borderBottom: 'unset', ...rowDensities[rowDensity] } }}>
      <ErrorFrameCell>
        <IconButtonStyled
          aria-label="expand row"
          size="small"
        />
      </ErrorFrameCell>
      <ErrorFrameCell align="left"><FrameName frame={frame} /></ErrorFrameCell>
      <ErrorFrameCell align="left" />
      <ErrorFrameCell align="left"><FrameData frame={frame} /></ErrorFrameCell>
      <ErrorFrameCell align="left" />
      <ErrorFrameCell align="left"><FrameTime timestamp={timestamp} /></ErrorFrameCell>
    </TableRow>
  );
}

interface RowProps {
  evt: TraceObjectEvent,
  timeAbsolute: string,
  rowDensity: RowDensity,
}

function Row({ evt, timeAbsolute, rowDensity }: RowProps) {
  if (evt.frame.TypeFrame != undefined) {
    return <TypeFrameRow frame={evt.frame.TypeFrame} timestamp={timeAbsolute} rowDensity={rowDensity} />
  } else if (evt.frame.SignalFrame != undefined) {
    return <SignalFrameRow frame={evt.frame.SignalFrame} timestamp={timeAbsolute} rowDensity={rowDensity} />
  } else if (evt.frame.UndefinedFrame != undefined) {
    return <UndefinedFrameRow frame={evt.frame.UndefinedFrame} timestamp={timeAbsolute} rowDensity={rowDensity} />
  } else if (evt.frame.ErrorFrame != undefined) {
    return <ErrorFrameRow frame={evt.frame.ErrorFrame} timestamp={timeAbsolute} rowDensity={rowDensity} />
  }
}

// Define a state to manage the sorting direction
const useSortState = () => {
  const [sortField, setSortField] = useState('Name');
  const [sortDirection, setSortDirection] = useState('asc');

  const toggleSortDirection = (field: React.SetStateAction<string>) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return { sortField, sortDirection, toggleSortDirection };
};


function TraceGrid() {

  const rowsRef = useRef<TraceObjectEvent[]>([]);
  const [filteredRows, setFilteredRows] = useState<TraceObjectEvent[]>([]);
  const { sortField, sortDirection, toggleSortDirection } = useSortState();
  const searchStringRef = useRef("");
  const [timeAbsolute, setTimeAbsolute] = useState(false);
  const [rowDensity, setRowDensity] = useState<RowDensity>('standard');

  function handle_event(event: TraceObjectEvent) {
    let index = rowsRef.current.findIndex((f) => {
      if (f.frame.TypeFrame != undefined && event.frame.TypeFrame != undefined) {
        return f.frame.TypeFrame.id === event.frame.TypeFrame.id &&
          f.frame.TypeFrame.ide === event.frame.TypeFrame.ide;
      } else if (f.frame.SignalFrame != undefined && event.frame.SignalFrame) {
        return f.frame.SignalFrame.id === event.frame.SignalFrame.id &&
          f.frame.SignalFrame.ide === event.frame.SignalFrame.ide;
      } else if (f.frame.UndefinedFrame != undefined && event.frame.UndefinedFrame != undefined) {
        return f.frame.UndefinedFrame.id === event.frame.UndefinedFrame.id &&
          f.frame.UndefinedFrame.ide === event.frame.UndefinedFrame.ide;
      } else if (f.frame.ErrorFrame != undefined && event.frame.ErrorFrame != undefined) {
        return f.frame.ErrorFrame.data === event.frame.ErrorFrame.data;
      } else {
        return false;
      }
    });
    if (index == -1) {
      rowsRef.current.push(event);
    } else {
      rowsRef.current[index] = event;
    }
  }

  useEffect(() => {
    invoke<TraceObjectEvent[]>("listen_to_trace").then((traceObjectEvents) => {
      for (let traceObjectEvent of traceObjectEvents) {
        console.log("initial frame: " + traceObjectEvent.frame);
        handle_event(traceObjectEvent);
      }
      // Apply the filter first
      const updatedRows = filterRows(searchStringRef.current);
      // Then sort the data
      const sortedRows = sortData(updatedRows, sortField, sortDirection);
      // Update state with sorted data
      setFilteredRows(sortedRows);
    });
  
    let trace_event_listener = listen<TraceObjectEvent[]>("trace", (event) => {
      console.log("trace listener triggered with:");
      console.log(event.payload);
      for (let traceObjectEvent of event.payload) {
        console.log(traceObjectEvent);
        handle_event(traceObjectEvent);
      }
      // Apply the filter first
      const updatedRows = filterRows(searchStringRef.current);
      // Then sort the data
      const sortedRows = sortData(updatedRows, sortField, sortDirection);
      // Update state with sorted data
      setFilteredRows(sortedRows);
    });
  
    return () => {
      invoke("unlisten_to_trace");
      trace_event_listener.then((f) => f());
    };
  }, [sortField, sortDirection]);
  
  const toggleRowDensity = () => {
    setRowDensity(prevDensity => {
      switch (prevDensity) {
        case 'compact':
          return 'standard';
        case 'standard':
          return 'comfortable';
        case 'comfortable':
          return 'compact';
        default:
          return 'standard';
      }
    });
  };

  const filterRows = (searchText: string) => {
    searchStringRef.current = searchText;
    if (searchStringRef.current === "") {
      return rowsRef.current.slice();
    } else {
      // Check if the search is for a hexadecimal ID
      if (searchText.toLowerCase().startsWith('0x')) {
        const hexSearch = searchText.toLowerCase().substring(2);
        return rowsRef.current.filter((event) => {
          const frameIdHex = event.frame.TypeFrame?.id.toString(16) || 
                             event.frame.SignalFrame?.id.toString(16) ||
                             event.frame.UndefinedFrame?.id.toString(16);
          return frameIdHex?.toLowerCase().startsWith(hexSearch);
        });
      } else {
        // Regular search using Fuse.js
        const fuseOptions = {
          keys: ['frame.TypeFrame.name', 'frame.SignalFrame.name', 'frame.ErrorFrame.name', 'frame.TypeFrame.id', 'frame.SignalFrame.id', 'frame.UndefinedFrame.id'],
          includeScore: true,
          includeMatches: true,
        };
        const fuse = new Fuse(rowsRef.current, fuseOptions);
        return fuse.search(searchText).map(({ item }) => item);
      }
    }
  };
  

  const sortData = (data: TraceObjectEvent[], sortField: string, sortDirection: string) => {
    return data.sort((a, b) => {
      let fieldA, fieldB;
      switch (sortField) {
        case 'Name':
          fieldA = a.frame.TypeFrame?.name || a.frame.SignalFrame?.name || '';
          fieldB = b.frame.TypeFrame?.name || b.frame.SignalFrame?.name || '';
          break;
        case 'Id':
          fieldA = a.frame.TypeFrame?.id || a.frame.SignalFrame?.id || '';
          fieldB = b.frame.TypeFrame?.id || b.frame.SignalFrame?.id || '';
          break;
        case 'Dlc':
          fieldA = a.frame.TypeFrame?.dlc || a.frame.SignalFrame?.dlc || '';
          fieldB = b.frame.TypeFrame?.dlc || b.frame.SignalFrame?.dlc || '';
          break;
        case 'Time':
          fieldA = a.timestamp || a.delta_time || '';
          fieldB = b.timestamp || b.delta_time || '';
          break;
        default:
          return 0;
      }
  
      if (fieldA < fieldB) return sortDirection === 'asc' ? -1 : 1;
      if (fieldA > fieldB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  return (
    <StyledPaper sx={{ width: '100%' }}>
      <TableContainer sx={{ maxHeight: 800 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Box component="form" sx={{ margin: "2%", textAlign: "center", width: '50%' }}>
            <TraceSearchBar onSearch={filterRows} />
          </Box>
          <Tooltip title="Toggle Density">
            <Button onClick={toggleRowDensity}>
              {rowDensity === 'compact' && <DensitySmallIcon style={{ color: 'white' }} />}
              {rowDensity === 'standard' && <DensityMediumIcon style={{ color: 'white' }} />}
              {rowDensity === 'comfortable' && <DensityLargeIcon style={{ color: 'white' }} />}
            </Button>
          </Tooltip>
        </div>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow >
              <TableHeaderCell />
              <TableHeaderCell align="left" onClick={() => toggleSortDirection('Name')}>
                <div style={{ display: 'flex', alignItems: 'center', columnGap: '5px', minWidth: '50px' }}>
                  Name 
                  {sortField === 'Name' && (sortDirection === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />)}
                </div>
              </TableHeaderCell>
              <TableHeaderCell align="left" onClick={() => toggleSortDirection('Id')}>
                <div style={{ display: 'flex', alignItems: 'center', columnGap: '5px', minWidth: '50px' }}>
                  Id 
                  {sortField === 'Id' && (sortDirection === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />)}
                </div>
              </TableHeaderCell>
              <TableHeaderCell align="left">
                Data
              </TableHeaderCell>
              <TableHeaderCell align="left" onClick={() => toggleSortDirection('Dlc')}>
                <div style={{ display: 'flex', alignItems: 'center', columnGap: '5px', minWidth: '60px' }}>
                  Dlc 
                  {sortField === 'Dlc' && (sortDirection === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />)}
                </div>
              </TableHeaderCell>
              <TableHeaderCell align="left" onClick={() => toggleSortDirection('Time')}>
                <div style={{ display: 'flex', alignItems: 'center', columnGap: '5px', minWidth: '120px' }}>
                  <Stack direction="row" spacing={1} alignItems="center"> 
                    <Button startIcon={timeAbsolute ? (
                      <AccessAlarm fontSize="small"/>
                      ):(
                      <ChangeHistory fontSize="small"/>)} 
                        onClick={(evt) => {
                          setTimeAbsolute((t) => !t);
                          evt.stopPropagation();
                        }} sx={{color:"white"}}>
                      Time
                    </Button>
                  </Stack>               
                  {sortField === 'Time' && (sortDirection === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />)}
                </div>
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows.map((evt, index) => {
              return <Row evt={evt} timeAbsolute={timeAbsolute ? evt.timestamp : evt.delta_time} rowDensity={rowDensity} key={index}/> 
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </StyledPaper>
  );
}

export default TraceGrid;
