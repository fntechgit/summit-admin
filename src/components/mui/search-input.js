import React, { useCallback, useEffect, useState } from "react";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import _ from "lodash";
import { DEBOUNCE_WAIT } from "../../utils/constants";

const SearchInput = ({
  term,
  onSearch,
  placeholder = "Search...",
  debounced
}) => {
  const [searchTerm, setSearchTerm] = useState(term || "");

  useEffect(() => {
    setSearchTerm(term || "");
  }, [term]);

  const onSearchDebounced = useCallback(
    debounced ? _.debounce((value) => onSearch(value), DEBOUNCE_WAIT) : null,
    [onSearch, debounced]
  );

  useEffect(() => () => onSearchDebounced?.cancel(), [onSearchDebounced]);

  const handleChange = (value) => {
    setSearchTerm(value);
    if (debounced) onSearchDebounced(value);
  };

  const handleKeyDown = (ev) => {
    if (!debounced && ev.key === "Enter") {
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
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: "#0000008F" }} />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={handleClear}>
                <ClearIcon fontSize="small" sx={{ color: "#0000008F" }} />
              </IconButton>
            </InputAdornment>
          )
        }
      }}
      onChange={(ev) => handleChange(ev.target.value)}
      onKeyDown={handleKeyDown}
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
