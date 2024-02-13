import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from "@mui/icons-material/Close";
import { styled } from "@mui/material/styles";
import { Button, Tooltip } from "@mui/material";

interface TraceSearchBarProps {
  onSearch: (value: string) => void;
}

const CustomTextField = styled(TextField)({
  flex: '1 1 auto',
  width: '0',
  visibility: 'hidden',
  opacity: 0,
  transition: 'width 0.3s ease-in-out, opacity 0.3s ease-in-out',
  '&.expanded': {
    width: '100%', 
    opacity: 1, 
    visibility: 'visible',
  },
  '& label': {
    color: '#00d6ba',
  },
  '& label.Mui-focused': {
    color: '#00d6ba',
  },
  '& .MuiInput-underline:after': {
    borderBottomColor: '#00d6ba',
  },
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: '#00d6ba',
    },
    '&:hover fieldset': {
      borderColor: '#00d6ba',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#00d6ba',
    },
    '& input': {
      color: '#FFFFFF',
      height: '30px',
      padding: '10px 14px',
    },
  },
});

function TraceSearchBar({ onSearch }: TraceSearchBarProps) {
  const [searchText, setSearchText] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchText(value);
    onSearch(value);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <CustomTextField
        className={isExpanded ? 'expanded' : ''}
        variant="outlined"
        value={searchText}
        onChange={handleSearchChange}
        placeholder="Search"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" />
          ),
          endAdornment: searchText && (
            <InputAdornment position="end">
              <IconButton onClick={() => {
                setSearchText('');
                onSearch('');
                }}>
                <CloseIcon style={{ color: '#FFFFFF' }} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <Tooltip title="Search for name or id">
        <Button onClick={() => setIsExpanded(prev => !prev)}>
          <SearchIcon style={{color: 'white'}} />
        </Button>
      </Tooltip>
    </div>
  );
}

export default TraceSearchBar;