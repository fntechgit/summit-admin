import React, { useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { Box, Button, InputAdornment, TextField, Tooltip } from "@mui/material";
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

const ModuleCloneControl = ({
  onClone,
  disabled = false,
  disabledReason = ""
}) => {
  const [count, setCount] = useState(String(MIN_MODULE_CLONE_COUNT));

  const handleCountChange = (e) => {
    setCount(e.target.value);
  };

  const handleCountBlur = () => {
    setCount(String(clampCloneCount(parseInt(count, 10))));
  };

  const handleClone = () => {
    onClone(clampCloneCount(parseInt(count, 10)));
    setCount(String(MIN_MODULE_CLONE_COUNT));
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
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleClone();
          }
        }}
        onBlur={handleCountBlur}
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
      <Tooltip
        title={disabled ? disabledReason : ""}
        arrow
        componentsProps={{ tooltip: { sx: { fontSize: "1rem" } } }}
      >
        <span>
          <Button
            size="small"
            variant="contained"
            aria-label={T.translate(
              "page_template_list.page_crud.clone_module"
            )}
            data-testid="clone-module-btn"
            onClick={handleClone}
            disabled={disabled}
          >
            {T.translate("page_template_list.page_crud.clone_module")}
          </Button>
        </span>
      </Tooltip>
    </Box>
  );
};

ModuleCloneControl.propTypes = {
  onClone: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  disabledReason: PropTypes.string
};

export default ModuleCloneControl;
