import React, { useState } from "react";
import { TextField, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

const SearchInput = ({ term, onSearch, placeholder = "Search..." }) => {
  const [searchTerm, setSearchTerm] = useState(term);

  const handleSearch = (ev) => {
    if (ev.key === "Enter") {
      onSearch(searchTerm);
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    onSearch("");
  };

  return (
    <TextField
      variant="outlined"
      value={searchTerm}
      placeholder={placeholder}
      slotProps={{
        input: {
          endAdornment: term ? (
            <IconButton
              size="small"
              onClick={handleClear}
              sx={{ position: "absolute", right: 0 }}
            >
              <ClearIcon sx={{ color: "#0000008F" }} />
            </IconButton>
          ) : (
            <SearchIcon
              sx={{ mr: 1, color: "#0000008F", position: "absolute", right: 0 }}
            />
          )
        }
      }}
      onChange={(event) => setSearchTerm(event.target.value)}
      onKeyDown={handleSearch}
      fullWidth
      sx={{
        "& .MuiOutlinedInput-root": {
          height: "36px"
        }
      }}
    />
  );
};

export default SearchInput;
