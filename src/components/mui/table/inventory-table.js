import * as React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import EditIcon from "@mui/icons-material/Edit";
import ImageIcon from "@mui/icons-material/Image";
import { visuallyHidden } from "@mui/utils";
import {
  DEFAULT_PER_PAGE,
  FIFTY_PER_PAGE,
  TWENTY_PER_PAGE
} from "../../../utils/constants";

const headCells = [
  {
    id: "name",
    numeric: false,
    disablePadding: true,
    label: "Dessert (100g serving)"
  },
  {
    id: "calories",
    numeric: true,
    disablePadding: false,
    label: "Calories"
  },
  {
    id: "fat",
    numeric: true,
    disablePadding: false,
    label: "Fat (g)"
  },
  {
    id: "carbs",
    numeric: true,
    disablePadding: false,
    label: "Carbs (g)"
  },
  {
    id: "protein",
    numeric: true,
    disablePadding: false,
    label: "Protein (g)"
  }
];

function EnhancedTableHead(props) {
  const { order, orderBy, onRequestSort } = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? "right" : "left"}
            padding={headCell.disablePadding ? "none" : "normal"}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : "asc"}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === "desc" ? "sorted descending" : "sorted ascending"}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  onRequestSort: PropTypes.func.isRequired,
  order: PropTypes.oneOf(["asc", "desc"]).isRequired,
  orderBy: PropTypes.string.isRequired
};

const InventoryTable = ({
  // eslint-disable-next-line
  columns,
  data,
  // eslint-disable-next-line
  options,
  perPage,
  currentPage,
  onRowEdit,
  onPageChange,
  // eslint-disable-next-line
  onSort
}) => {
  const handleChangePage = (event, newPage) => {
    onPageChange(newPage);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Paper elevation={0} sx={{ width: "100%", mb: 2 }}>
        <TableContainer
          component={Paper}
          sx={{ borderRadius: 0, boxShadow: "none" }}
        >
          <Table>
            <TableHead sx={{ backgroundColor: "#EAEAEA" }}>
              <TableRow>
                <TableCell sx={{ width: 120 }}>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell align="center" sx={{ width: 40 }} />
                <TableCell align="center" sx={{ width: 40 }} />
                <TableCell align="center" sx={{ width: 70 }} />
                <TableCell align="center" sx={{ width: 40 }} />
              </TableRow>
            </TableHead>

            <TableBody>
              {data.map((row) => (
                <TableRow key={row.code}>
                  <TableCell>{row.code}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell align="center">
                    {row.hasImage && (
                      <IconButton size="small" sx={{ mr: 1 }}>
                        <ImageIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      position: "relative",
                      borderLeft: "none",
                      "&::before": {
                        // eslint-disable-next-line
                        content: '""',
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: 0,
                        borderLeft: "1px dashed #E0E0E0",
                        height: "3em",
                        marginTop: "2em"
                      }
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => onRowEdit(row)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      position: "relative",
                      borderLeft: "none",
                      "&::before": {
                        // eslint-disable-next-line
                        content: '""',
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: 0,
                        borderLeft: "1px dashed #E0E0E0",
                        height: "3em",
                        marginTop: "2em"
                      }
                    }}
                  >
                    {/* Archive Action */}
                    <IconButton
                      size="small"
                      onClick={() => console.log("Archive", row.code)}
                    >
                      Archive
                    </IconButton>
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      position: "relative",
                      borderLeft: "none",
                      "&::before": {
                        // eslint-disable-next-line
                        content: '""',
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: 0,
                        borderLeft: "1px dashed #E0E0E0",
                        height: "3em",
                        marginTop: "2em"
                      }
                    }}
                  >
                    <IconButton size="small" sx={{ mr: 1 }}>
                      <UnfoldMoreIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    No items found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={data.length}
          rowsPerPageOptions={[
            DEFAULT_PER_PAGE,
            TWENTY_PER_PAGE,
            FIFTY_PER_PAGE
          ]}
          rowsPerPage={perPage}
          page={currentPage}
          onPageChange={handleChangePage}
          labelRowsPerPage="Rows per page"
          sx={{
            ".MuiTablePagination-toolbar": {
              alignItems: "baseline",
              marginTop: "1.6rem"
            },
            ".MuiTablePagination-spacer": {
              display: "none"
            },
            ".MuiTablePagination-displayedRows": {
              marginLeft: "auto"
            }
          }}
        />
      </Paper>
    </Box>
  );
};

export default InventoryTable;
