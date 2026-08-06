import React, { useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { Box, Button, InputAdornment, TextField } from "@mui/material";
import {
  MAX_MODULE_CLONE_COUNT,
  MIN_MODULE_CLONE_COUNT
} from "../../../../utils/constants";

const clampCloneCount = (value) => {
  if (Number.isNaN(value)) return MIN_MODULE_CLONE_COUNT;
  return Math.min(
    Math.max(value, MIN_MODULE_CLONE_COUNT),
    MAX_MODULE_CLONE_COUNT
  );
};

const ModuleCloneControl = ({ onClone }) => {
  const [count, setCount] = useState(MIN_MODULE_CLONE_COUNT);

  const handleCountChange = (e) => {
    setCount(clampCloneCount(parseInt(e.target.value, 10)));
  };

  const handleClone = () => {
    onClone(count);
    setCount(MIN_MODULE_CLONE_COUNT);
  };

  return (
    <Box
      sx={{ display: "flex", alignItems: "center", gap: 1, mr: 3 }}
      onClick={(e) => e.stopPropagation()}
    >
      <TextField
        type="number"
        size="small"
        value={count}
        onChange={handleCountChange}
        sx={{ width: 90 }}
        slotProps={{
          input: {
            startAdornment: <InputAdornment position="start">x</InputAdornment>
          },
          htmlInput: {
            min: MIN_MODULE_CLONE_COUNT,
            max: MAX_MODULE_CLONE_COUNT,
            "aria-label": T.translate(
              "page_template_list.page_crud.clone_count_label"
            ),
            "data-testid": "clone-count-input"
          }
        }}
      />
      <span>
        <Button
          size="small"
          variant="contained"
          aria-label={T.translate("page_template_list.page_crud.clone_module")}
          data-testid="clone-module-btn"
          onClick={handleClone}
        >
          {T.translate("page_template_list.page_crud.clone_module")}
        </Button>
      </span>
    </Box>
  );
};

ModuleCloneControl.propTypes = {
  onClone: PropTypes.func.isRequired
};

export default ModuleCloneControl;
