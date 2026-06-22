import React from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import Box from "@mui/material/Box";
import TableCell from "@mui/material/TableCell";
import TableSortLabel from "@mui/material/TableSortLabel";
import { visuallyHidden } from "@mui/utils";

const Heading = (props) => {
  const {
    editEnabled,
    sortable,
    sortDir,
    onSort,
    columnIndex,
    columnKey,
    width,
    children
  } = props;

  const handleSort = () => {
    if (!onSort || !sortable || editEnabled) return;

    onSort(columnIndex, columnKey, sortDir ? sortDir * -1 : 1);
  };

  const headerSx = width ? { width, minWidth: width, maxWidth: width } : {};

  if (!sortable || editEnabled) {
    return <TableCell sx={headerSx}>{children}</TableCell>;
  }

  return (
    <TableCell sx={headerSx}>
      <TableSortLabel
        active={!!sortDir}
        direction={sortDir === -1 ? "desc" : "asc"}
        onClick={handleSort}
      >
        {children}
        {sortDir ? (
          <Box component="span" sx={visuallyHidden}>
            {sortDir === -1
              ? T.translate("mui_table.sorted_desc")
              : T.translate("mui_table.sorted_asc")}
          </Box>
        ) : null}
      </TableSortLabel>
    </TableCell>
  );
};

Heading.propTypes = {
  editEnabled: PropTypes.bool,
  onSort: PropTypes.func,
  sortDir: PropTypes.number,
  columnIndex: PropTypes.number,
  columnKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sortable: PropTypes.bool,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  children: PropTypes.node
};

export default Heading;
