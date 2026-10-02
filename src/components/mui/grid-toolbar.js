import React from "react";
import PropTypes from "prop-types";
import { Grid2 } from "@mui/material";
import SearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";
import ArchiveToggle from "./archive-toggle";

const GridToolbar = ({
  searchProps,
  archiveToggleProps,
  filter,
  children,
  splitAt
}) => {
  const hasSearch = !!searchProps;
  // the archive toggle and a page's own filter share the same cell
  const hasFilter = !!archiveToggleProps || !!filter;

  let searchSize;
  let filterSize;
  let actionsSize;

  if (hasSearch && hasFilter) {
    // md gives the filter a third column (the archive toggle doesn't fit in two); from lg it fits again
    searchSize = { xs: 12, sm: 6, md: 3, lg: 4 };
    filterSize = { xs: 12, sm: 6, md: 3, lg: 2 };
    actionsSize = { xs: 12, md: 6 };
  } else if (hasSearch) {
    // has search but no filter
    searchSize = { xs: 12, [splitAt]: 4 };
    actionsSize = { xs: 12, [splitAt]: 8 };
  } else if (hasFilter) {
    // has filter but no search
    filterSize = { xs: 12, [splitAt]: 4 };
    actionsSize = { xs: 12, [splitAt]: 8 };
  } else {
    actionsSize = { xs: 12 };
  }

  // must match the breakpoint where actionsSize itself leaves its xs:12
  // (own full-width row) value — that's the point flexWrap needs to switch
  // to nowrap, so children don't get squeezed once actionsSize starts
  // sharing a row with a sibling
  const actionsWidthBreakpoint =
    hasSearch && hasFilter ? "md" : hasSearch || hasFilter ? splitAt : "xs";

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
      {hasFilter && (
        <Grid2 size={filterSize}>
          {archiveToggleProps ? (
            <ArchiveToggle {...archiveToggleProps} />
          ) : (
            filter
          )}
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
  // renders the Active/Archived segmented control
  archiveToggleProps: PropTypes.shape({
    showArchived: PropTypes.bool,
    onChange: PropTypes.func.isRequired
  }),
  // a page's own filter control, for one-offs (ignored when archiveToggleProps is set)
  filter: PropTypes.node,
  // breakpoint where search/filter split from the actions row into their
  // compact ratio — raise it (e.g. "lg") when actions holds a lot of children
  splitAt: PropTypes.oneOf(["xs", "sm", "md", "lg", "xl"])
};

GridToolbar.defaultProps = {
  searchProps: null,
  archiveToggleProps: null,
  filter: null,
  splitAt: "sm"
};

export default GridToolbar;
