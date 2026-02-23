import React, { useEffect, useState } from "react";
import T from "i18n-react/dist/i18n-react";
import { connect } from "react-redux";
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
import ImageIcon from "@mui/icons-material/Image";
import MuiTable from "../../../components/mui/table/mui-table";
import MenuButton from "../../../components/mui/menu-button";
import {
  clearAllSelectedInventoryItems,
  getInventoryItems,
  selectInventoryItem,
  setSelectedAll,
  unSelectInventoryItem
} from "../../../actions/inventory-item-actions";
import { DECIMAL_DIGITS, DEFAULT_CURRENT_PAGE } from "../../../utils/constants";

const AddFormTemplateItemDialog = ({
  onClose,
  onAddItems,
  clearAllSelectedInventoryItems,
  getInventoryItems,
  selectInventoryItem,
  unSelectInventoryItem,
  inventoryItems,
  totalInventoryItems,
  currentPage,
  perPage,
  order,
  orderDir,
  selectedCount,
  selectedIds,
  term = ""
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getInventoryItems(term, currentPage, perPage, order, orderDir);
  }, []);

  const handlePageChange = (page) => {
    getInventoryItems(term, page, perPage, order, orderDir);
  };

  const handlePerPageChange = (newPerPage) => {
    getInventoryItems(term, DEFAULT_CURRENT_PAGE, newPerPage, order, orderDir);
  };

  const handleSort = (key, dir) => {
    getInventoryItems(term, currentPage, perPage, key, dir);
  };

  const handleOnSearch = (ev) => {
    if (ev.key === "Enter")
      getInventoryItems(searchTerm, currentPage, perPage, order, orderDir);
  };

  const handleSelected = (id, isSelected) => {
    if (isSelected) {
      selectInventoryItem(id);
      return;
    }
    unSelectInventoryItem(id);
  };

  const handleonAddItems = () => {
    onAddItems(selectedIds);
    clearAllSelectedInventoryItems();
  };

  const handleClose = () => {
    onClose();
    clearAllSelectedInventoryItems();
  };

  const tableOptions = {
    sortCol: order,
    sortDir: orderDir
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
              checked={selectedIds.includes(row.id)}
              onChange={(ev) => handleSelected(row.id, ev.target.checked)}
            />
          }
        />
      )
    },
    {
      columnKey: "code",
      header: T.translate("inventory_items_list_modal.code_column_label"),
      sortable: false
    },
    {
      columnKey: "name",
      header: T.translate("inventory_items_list_modal.name_column_label"),
      sortable: false
    },
    {
      columnKey: "early_bird_rate",
      header: T.translate(
        "inventory_items_list_modal.early_bid_rate_column_label"
      ),
      sortable: false,
      render: (row) => `$ ${row.early_bird_rate?.toFixed(DECIMAL_DIGITS)}`
    },
    {
      columnKey: "standard_rate",
      header: T.translate(
        "inventory_items_list_modal.standard_rate_column_label"
      ),
      sortable: false,
      render: (row) => `$ ${row.standard_rate?.toFixed(DECIMAL_DIGITS)}`
    },
    {
      columnKey: "onsite_rate",
      header: T.translate(
        "inventory_items_list_modal.onsite_rate_column_label"
      ),
      sortable: false,
      render: (row) => `$ ${row.onsite_rate?.toFixed(DECIMAL_DIGITS)}`
    },
    {
      columnKey: "default_quantity",
      header: T.translate("inventory_items_list_modal.quantity_column_label"),
      sortable: false
    },
    {
      columnKey: "hasImage",
      header: "",
      width: 40,
      align: "center",
      render: (row) =>
        row.images.length > 0 ? (
          <IconButton size="small">
            <ImageIcon
              fontSize="small"
              onClick={() =>
                window.open(
                  row.images[0].file_url,
                  "_blank",
                  "noopener,noreferrer"
                )
              }
            />
          </IconButton>
        ) : null
    }
  ];

  return (
    <Dialog open onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography fontSize="1.5rem">
          {T.translate("inventory_items_list_modal.select_items")}
        </Typography>
        <IconButton size="small" onClick={() => handleClose()} sx={{ mr: 1 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 0 }}>
        <Grid2 container spacing={2} size={12} sx={{ p: 2 }}>
          <Grid2 container spacing={2} size={6} sx={{ alignItems: "baseline" }}>
            <Grid2 size={4}>{selectedCount} items selected</Grid2>
          </Grid2>
          <Grid2 container spacing={2} size={6}>
            <Grid2 size={4}>
              <MenuButton
                buttonId="sort-button"
                menuId="sort-menu"
                buttonSx={{ color: "#000" }}
                menuItems={[
                  // {
                  //   label: "Price: Low to High",
                  //   onClick: () => handleSort("date", "+")
                  // },
                  // {
                  //   label: "Price: High to Low",
                  //   onClick: () => handleSort("date", "+")
                  // },
                  // { label: "Newest", onClick: () => handleSort("date", "+") },
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
                  "inventory_items_list_modal.placeholders.search_inventory_items"
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

        {inventoryItems.length > 0 && (
          <Box sx={{ p: 2 }}>
            <MuiTable
              columns={columns}
              data={inventoryItems}
              options={tableOptions}
              currentPage={currentPage}
              perPage={perPage}
              totalRows={totalInventoryItems}
              onSort={handleSort}
              onPageChange={handlePageChange}
              onPerPageChange={handlePerPageChange}
            />
          </Box>
        )}
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button
          onClick={handleonAddItems}
          disabled={selectedIds.length === 0}
          fullWidth
          variant="contained"
        >
          {T.translate("inventory_items_list_modal.add_selected")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

AddFormTemplateItemDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  onAddItems: PropTypes.func.isRequired
};

const mapStateToProps = ({ currentInventoryItemListState }) => ({
  ...currentInventoryItemListState
});

export default connect(mapStateToProps, {
  getInventoryItems,
  clearAllSelectedInventoryItems,
  setSelectedAll,
  selectInventoryItem,
  unSelectInventoryItem
})(AddFormTemplateItemDialog);
