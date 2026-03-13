import React, { useState } from "react";
import T from "i18n-react/dist/i18n-react";
import PropTypes from "prop-types";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid2,
  IconButton,
  TextField,
  Typography
} from "@mui/material";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import MuiTable from "../../../components/mui/table/mui-table";
import MenuButton from "../../../components/mui/menu-button";

const FormTemplateFromDuplicateDialog = ({
  open,
  options,
  onClose,
  onDuplicate,
  onSearch,
  onSort,
  formTemplates,
  perPage,
  currentPage,
  totalRows,
  onPageChange,
  onPerPageChange
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);

  const handleSort = (key, dir) => {
    onSort(_, key, dir);
  };

  const handleClose = () => {
    setSelectedRow(null);
    onClose();
  };

  const handleOnCheck = (rowId) => {
    const newSelectedRow = selectedRow !== rowId ? rowId : null;
    setSelectedRow(newSelectedRow);
  };

  const handleOnDuplicate = () => {
    onDuplicate(selectedRow);
  };

  const handleOnSearch = (ev) => {
    if (ev.key === "Enter") onSearch(searchTerm);
  };

  const columns = [
    {
      columnKey: "select",
      header: "",
      width: 30,
      align: "center",
      render: (row) => (
        <FormControlLabel
          control={
            <Checkbox
              checked={selectedRow === row.id}
              onChange={() => handleOnCheck(row.id)}
            />
          }
        />
      )
    },
    {
      columnKey: "code",
      header: T.translate("form_template_list.code_column_label"),
      sortable: true
    },
    {
      columnKey: "name",
      header: T.translate("form_template_list.name_column_label"),
      sortable: true
    },
    {
      columnKey: "items_qty",
      header: T.translate("form_template_list.items_column_label"),
      sortable: false
    }
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography fontSize="1.5rem">
          {T.translate("form_template_from_duplicate_dialog.duplicate_form")}
        </Typography>
        <IconButton size="small" onClick={() => handleClose()} sx={{ mr: 1 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 0 }}>
        <Grid2 container spacing={2} size={12} sx={{ p: 2 }}>
          <Grid2 container spacing={2} size={6} sx={{ alignItems: "baseline" }}>
            <Grid2 size={4}>{selectedRow ? "1" : "0"} items selected</Grid2>
          </Grid2>
          <Grid2 container spacing={2} size={6}>
            <Grid2 size={4}>
              <MenuButton
                buttonId="sort-button"
                menuId="sort-menu"
                buttonSx={{ color: "#000" }}
                menuItems={[
                  // { label: "Newest", onClick: () => handleSort("+date") },
                  {
                    label: T.translate("general.sort_asc_label"),
                    onClick: () => handleSort("name", 1)
                  },
                  {
                    label: T.translate("general.sort_desc_label"),
                    onClick: () => handleSort("name", 0)
                  }
                ]}
              >
                <SwapVertIcon fontSize="large" sx={{ mr: 1 }} />{" "}
                {T.translate("general.sort_by")}
              </MenuButton>
            </Grid2>
            <Grid2 size={8}>
              <TextField
                variant="outlined"
                value={searchTerm}
                placeholder={T.translate(
                  "inventory_item_list.placeholders.search_inventory_items"
                )}
                slotProps={{
                  input: {
                    startAdornment: <SearchIcon sx={{ mr: 1 }} />
                  }
                }}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={handleOnSearch}
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: "36px"
                  }
                }}
              />
            </Grid2>
          </Grid2>
        </Grid2>

        {formTemplates.length > 0 && (
          <Box sx={{ p: 2 }}>
            <MuiTable
              columns={columns}
              data={formTemplates}
              options={options}
              onSort={handleSort}
              perPage={perPage}
              currentPage={currentPage}
              totalRows={totalRows}
              onPageChange={onPageChange}
              onPerPageChange={onPerPageChange}
            />
          </Box>
        )}
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button
          onClick={handleOnDuplicate}
          disabled={!selectedRow}
          fullWidth
          variant="contained"
        >
          {T.translate(
            "form_template_from_duplicate_dialog.duplicate_selected"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

FormTemplateFromDuplicateDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onDuplicate: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired,
  onSort: PropTypes.func.isRequired,
  options: PropTypes.object.isRequired,
  formTemplates: PropTypes.array.isRequired
};

export default FormTemplateFromDuplicateDialog;
