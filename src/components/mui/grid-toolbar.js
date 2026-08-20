import React from "react";
import PropTypes from "prop-types";
import { Checkbox, FormControlLabel, FormGroup, Grid2 } from "@mui/material";
import SearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";

const GridToolbar = ({ searchProps, checkboxProps, children, splitAt }) => {
  const hasSearch = !!searchProps;
  const hasCheckbox = !!checkboxProps;

  let searchSize;
  let checkboxSize;
  let actionsSize;

  if (hasSearch && hasCheckbox) {
    searchSize = { xs: 12, sm: 6, md: 4 };
    checkboxSize = { xs: 12, sm: 6, md: 2 };
    actionsSize = { xs: 12, md: 6 };
  } else if (hasSearch) {
    // has search but no checkbox
    searchSize = { xs: 12, [splitAt]: 4 };
    actionsSize = { xs: 12, [splitAt]: 8 };
  } else if (hasCheckbox) {
    // has checkbox but no search
    checkboxSize = { xs: 12, [splitAt]: 4 };
    actionsSize = { xs: 12, [splitAt]: 8 };
  } else {
    actionsSize = { xs: 12 };
  }

  // must match the breakpoint where actionsSize itself leaves its xs:12
  // (own full-width row) value — that's the point flexWrap needs to switch
  // to nowrap, so children don't get squeezed once actionsSize starts
  // sharing a row with a sibling
  const actionsWidthBreakpoint =
    hasSearch && hasCheckbox ? "md" : hasSearch || hasCheckbox ? splitAt : "xs";

  // children go natural (auto) width starting at actionsWidthBreakpoint,
  // never earlier than sm; between sm and that point (only a real window
  // when actionsWidthBreakpoint is md) they fill the row evenly instead
  const actionsAutoBreakpoint =
    actionsWidthBreakpoint === "xs" ? "sm" : actionsWidthBreakpoint;
  const hasFillTier = actionsAutoBreakpoint !== "sm";

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
                  checked={checkboxProps.checked}
                  onChange={checkboxProps.onChange}
                  inputProps={{
                    "aria-label": checkboxProps.ariaLabel ?? checkboxProps.label
                  }}
                />
              }
              label={checkboxProps.label}
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
          flexWrap: { xs: "wrap", [actionsWidthBreakpoint]: "nowrap" },
          gap: 2
        }}
      >
        {/* xs: stacked full width. sm through actionsAutoBreakpoint (only a
            real window when that's md): fill the row evenly via flexGrow.
            From actionsAutoBreakpoint on: natural/auto width. */}
        {React.Children.map(children, (child) =>
          child
            ? React.cloneElement(child, {
                sx: {
                  width: { xs: "100%", [actionsAutoBreakpoint]: "auto" },
                  ...(hasFillTier && {
                    flexGrow: { sm: 1, [actionsAutoBreakpoint]: 0 },
                    flexBasis: { sm: 0, [actionsAutoBreakpoint]: "auto" }
                  }),
                  ...child.props.sx
                }
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
  checkboxProps: PropTypes.shape({
    checked: PropTypes.bool,
    onChange: PropTypes.func,
    label: PropTypes.node,
    ariaLabel: PropTypes.string
  }),
  // breakpoint where search/checkbox split from the actions row into their
  // compact ratio — raise it (e.g. "lg") when actions holds a lot of children
  splitAt: PropTypes.oneOf(["xs", "sm", "md", "lg", "xl"])
};

GridToolbar.defaultProps = {
  searchProps: null,
  checkboxProps: null,
  splitAt: "sm"
};

export default GridToolbar;
