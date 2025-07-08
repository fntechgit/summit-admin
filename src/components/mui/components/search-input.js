import React, { useState } from "react";
import { TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

const SearchInput = ({ term, onSearch, placeholder = "Search" }) => {
  const [searchTerm, setSearchTerm] = useState(term);

  const handleSearch = (ev) => {
    if (ev.key === "Enter") {
      onSearch(searchTerm);
    }
  };

  return (
    <TextField
      variant="outlined"
      value={searchTerm}
      placeholder={placeholder}
      slotProps={{
        input: {
          endAdornment: (
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
