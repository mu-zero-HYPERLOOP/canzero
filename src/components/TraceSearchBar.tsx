import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";

interface TraceSearchBarProps {
  onSearch: (value: string) => void;
}

function TraceSearchBar({ onSearch }: TraceSearchBarProps) {
  const [searchText, setSearchText] = useState<string>("");
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchText(value);
    onSearch(value);
  };

  return (
    <TextField
      label="Search"
      variant="outlined"
      fullWidth
      value={searchText}
      onChange={handleSearchChange}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
      }}
    />
  );
}

export default TraceSearchBar;
