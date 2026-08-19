import React from "react";
import PropTypes from "prop-types";
import { Checkbox, FormControlLabel, FormGroup, Grid2 } from "@mui/material";
import SearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";

const GridToolbar = ({ searchProps, checkbox, children }) => {
  const hasSearch = !!searchProps;
  const hasCheckbox = !!checkbox;

  let searchSize;
  let checkboxSize;
  let actionsSize;

  if (hasSearch && hasCheckbox) {
    searchSize = { xs: 12, sm: 6, md: 4 };
    checkboxSize = { xs: 12, sm: 6, md: 2 };
    actionsSize = { xs: 12, md: 6 };
  } else if (hasSearch) {
    searchSize = { xs: 12, md: 6 };
    actionsSize = { xs: 12, md: 6 };
  } else if (hasCheckbox) {
    checkboxSize = { xs: 12, md: 2 };
    actionsSize = { xs: 12, md: 10 };
  } else {
    actionsSize = { xs: 12, md: 12 };
  }

  return (
    <Grid2 container spacing={2} sx={{ mb: 3 }}>
      {hasSearch && (
        <Grid2 size={searchSize}>
          <SearchInput {...searchProps} />
        </Grid2>
      )}
      {hasCheckbox && (
        <Grid2 size={checkboxSize}>
          <FormGroup sx={{ flexShrink: 0 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={checkbox.checked}
                  onChange={checkbox.onChange}
                  inputProps={{
                    "aria-label": checkbox.ariaLabel ?? checkbox.label
                  }}
                />
              }
              label={checkbox.label}
              sx={{ whiteSpace: "nowrap" }}
            />
          </FormGroup>
        </Grid2>
      )}
      <Grid2
        size={actionsSize}
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          flexWrap: { xs: "wrap", sm: "nowrap" },
          gap: 2
        }}
      >
        {/* children are expected to be Button-like elements accepting `sx` */}
        {React.Children.map(children, (child) =>
          child
            ? React.cloneElement(child, {
                sx: { width: { xs: "100%", md: "auto" }, ...child.props.sx }
              })
            : child
        )}
      </Grid2>
    </Grid2>
  );
};

GridToolbar.propTypes = {
  searchProps: PropTypes.shape({
    term: PropTypes.string,
    onSearch: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    debounced: PropTypes.bool
  }),
  checkbox: PropTypes.shape({
    checked: PropTypes.bool,
    onChange: PropTypes.func,
    label: PropTypes.node,
    ariaLabel: PropTypes.string
  })
};

GridToolbar.defaultProps = {
  searchProps: null,
  checkbox: null
};

export default GridToolbar;
