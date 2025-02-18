import React, { useState } from "react";
import T from "i18n-react/dist/i18n-react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  Box,
  IconButton,
  Divider,
  Grid2,
  Typography
} from "@mui/material";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import MuiTable from "../../../components/mui/table/mui-table";
import MenuButton from "../../../components/mui/components/menu-button";

const FormTemplateFromDuplicateDialog = ({
  open,
  options,
  onClose,
  onDuplicate,
  onSearch,
  onSort,
  formTemplates
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);

  const handleSort = (key, dir) => {
    onSort(_, key, dir);
  };

  const handleOnCheck = (rowId) => {
    setSelectedRows((prevSelectedRows) =>
      prevSelectedRows.includes(rowId)
        ? prevSelectedRows.filter((id) => id !== rowId)
        : [...prevSelectedRows, rowId]
    );
  };

  const handleOnDuplicate = () => {
    onDuplicate(selectedRows);
  };

  const handleOnSearch = (ev) => {
    console.log("CHECL ev", ev);
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
              checked={selectedRows.includes(row.id)}
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography fontSize="1.5rem">
          {T.translate("form_template_from_duplicate_dialog.duplicate_form")}
        </Typography>
        <IconButton size="small" onClick={() => onClose()} sx={{ mr: 1 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 0 }}>
        <Grid2 container spacing={2} size={12} sx={{ p: 2 }}>
          <Grid2 container spacing={2} size={6} sx={{ alignItems: "baseline" }}>
            <Grid2 size={4}>{selectedRows.length} items selected</Grid2>
          </Grid2>
          <Grid2 container spacing={2} size={6}>
            <Grid2 size={4}>
              <MenuButton
                buttonId="sort-button"
                menuId="sort-menu"
                buttonSx={{ color: "#000" }}
                menuItems={[
                  // { label: "Newest", onClick: () => handleSort("+date") },
                  { label: "A-Z", onClick: () => handleSort("name", 1) },
                  { label: "Z-A", onClick: () => handleSort("name", 0) }
                ]}
              >
                <SwapVertIcon fontSize="large" sx={{ mr: 1 }} /> sort by
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
            />
          </Box>
        )}
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button
          onClick={handleOnDuplicate}
          disabled={selectedRows.length === 0}
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
