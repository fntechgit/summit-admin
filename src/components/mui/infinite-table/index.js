import * as React from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { visuallyHidden } from "@mui/utils";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableSortLabel from "@mui/material/TableSortLabel";
import Paper from "@mui/material/Paper";
import TableRow from "@mui/material/TableRow";
import styles from "./styles.module.less";
import { MILLISECONDS_TO_SECONDS } from "../../../utils/constants";

const MuiInfiniteTable = ({
  boxHeight = "400px",
  columns = [],
  data = [],
  loadMoreData,
  onRowEdit,
  onSort,
  options = { sortCol: "", sortDir: "" }
}) => {
  const { sortCol, sortDir } = options;

  const isLoadingRef = React.useRef(false);

  const handleScroll = (event) => {
    if (isLoadingRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = event.target;
    // eslint-disable-next-line no-magic-numbers
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      isLoadingRef.current = true;
      loadMoreData();

      setTimeout(() => {
        isLoadingRef.current = false;
      }, MILLISECONDS_TO_SECONDS);
    }
  };

  return (
    <Box
      sx={{ width: "100%", height: boxHeight, overflow: "auto" }}
      onScroll={handleScroll}
    >
      <Paper elevation={0} sx={{ width: "100%", mb: 2 }}>
        <TableContainer
          component={Paper}
          sx={{ borderRadius: 0, boxShadow: "none" }}
        >
          <Table>
            {/* TABLE HEADER */}
            <TableHead sx={{ backgroundColor: "#EAEAEA" }}>
              <TableRow>
                {columns.map((col) => (
                  <TableCell
                    key={col.columnKey}
                    sx={{
                      width: col.width,
                      minWidth: col.width,
                      maxWidth: col.width
                    }}
                    align={col.align ?? "left"}
                  >
                    {col.sortable ? (
                      <TableSortLabel
                        active={sortCol === col.columnKey}
                        direction={
                          sortCol === col.columnKey && sortDir === 1
                            ? "asc"
                            : "desc"
                        }
                        onClick={() => onSort(col.columnKey, sortDir * -1)}
                      >
                        {col.header}
                        {sortCol === col.columnKey ? (
                          <Box component="span" sx={visuallyHidden}>
                            {sortDir === "-1"
                              ? T.translate("mui_table.sorted_desc")
                              : T.translate("mui_table.sorted_asc")}
                          </Box>
                        ) : null}
                      </TableSortLabel>
                    ) : (
                      col.header
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            {/* TABLE BODY */}
            <TableBody>
              {data.map((row, rowIndex) => (
                <TableRow key={row.id || rowIndex}>
                  {columns.map((col) => {
                    const cellContent = col.render
                      ? col.render(row, { onRowEdit })
                      : row[col.columnKey];

                    const cellClassName = col.className
                      ? styles[col.className] || col.className
                      : "";

                    return (
                      <TableCell
                        key={col.columnKey}
                        align={col.align ?? "left"}
                        className={cellClassName}
                      >
                        {cellContent}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}

              {/* No items */}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">
                    {T.translate("mui_table.no_data")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

MuiInfiniteTable.propTypes = {
  boxHeight: PropTypes.string,
  columns: PropTypes.array,
  data: PropTypes.array,
  loadMoreData: PropTypes.func,
  onRowEdit: PropTypes.func,
  onSort: PropTypes.func,
  options: PropTypes.object
};

export default MuiInfiniteTable;
