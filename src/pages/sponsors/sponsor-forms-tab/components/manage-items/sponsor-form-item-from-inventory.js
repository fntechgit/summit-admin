import React, { useEffect, useState } from "react";
import T from "i18n-react/dist/i18n-react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
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
  Tooltip,
  Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ImageIcon from "@mui/icons-material/Image";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import SearchInput from "../../../../../components/mui/search-input";
import {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_PER_PAGE
} from "../../../../../utils/constants";

import { getInventoryItems } from "../../../../../actions/inventory-item-actions";
import MuiTable from "../../../../../components/mui/table/mui-table";
import { amountFromCents } from "../../../../../utils/currency";
import MenuButton from "../../../../../components/mui/menu-button";

const SponsorFormItemFromInventoryPopup = ({
  open,
  inventoryItems,
  term,
  order,
  perPage,
  orderDir,
  currentPage,
  totalInventoryItems,
  onSave,
  onClose,
  getInventoryItems
}) => {
  const [selectedRows, setSelectedRows] = useState([]);

  useEffect(() => {
    getInventoryItems("", 1, DEFAULT_PER_PAGE, "id", 1);
  }, []);

  const handleSort = (key, dir) => {
    getInventoryItems(term, 1, DEFAULT_PER_PAGE, key, dir);
  };

  const handlePageChange = (page) => {
    getInventoryItems(term, page, perPage, order, orderDir);
  };

  const handlePerPageChange = (newPerPage) => {
    getInventoryItems(term, DEFAULT_CURRENT_PAGE, newPerPage, order, orderDir);
  };

  const handleClose = () => {
    setSelectedRows([]);
    onClose();
  };

  const handleOnCheck = (rowId, checked) => {
    if (checked) {
      setSelectedRows([...selectedRows, rowId]);
    } else {
      setSelectedRows(selectedRows.filter((r) => r !== rowId));
    }
  };

  const handleOnSearch = (searchTerm) => {
    getInventoryItems(searchTerm, 1, DEFAULT_PER_PAGE, "id", 1);
  };

  const handleOnSave = () => {
    onSave(selectedRows);
  };

  const columns = [
    {
      columnKey: "select",
      header: "",
      width: 30,
      align: "center",
      render: (row) => (
        <FormControlLabel
          label=""
          control={
            <Checkbox
              checked={selectedRows.includes(row.id)}
              onChange={(ev) => handleOnCheck(row.id, ev.target.checked)}
            />
          }
        />
      )
    },
    {
      columnKey: "code",
      header: T.translate("edit_sponsor.forms_tab.form_manage_items.code"),
      sortable: false
    },
    {
      columnKey: "name",
      header: T.translate("edit_sponsor.forms_tab.form_manage_items.name"),
      sortable: false
    },
    {
      columnKey: "early_bird_rate",
      header: T.translate(
        "edit_sponsor.forms_tab.form_manage_items.early_bird_rate"
      ),
      sortable: false,
      render: (row) => `$ ${amountFromCents(row.early_bird_rate)}`
    },
    {
      columnKey: "standard_rate",
      header: T.translate(
        "edit_sponsor.forms_tab.form_manage_items.standard_rate"
      ),
      sortable: false,
      render: (row) => `$ ${amountFromCents(row.standard_rate)}`
    },
    {
      columnKey: "onsite_rate",
      header: T.translate(
        "edit_sponsor.forms_tab.form_manage_items.onsite_rate"
      ),
      sortable: false,
      render: (row) => `$ ${amountFromCents(row.onsite_rate)}`
    },
    {
      columnKey: "default_quantity",
      header: T.translate(
        "edit_sponsor.forms_tab.form_manage_items.default_quantity"
      ),
      sortable: false
    },
    {
      columnKey: "images",
      header: "",
      width: 40,
      align: "center",
      render: (row) =>
        row.images?.length > 0 ? (
          <Tooltip title={row.images[0].file_url} placement="top" arrow>
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
          </Tooltip>
        ) : null
    }
  ];

  const tableOptions = {
    sortCol: order,
    sortDir: orderDir
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEnforceFocus
      disableAutoFocus
      disableRestoreFocus
    >
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between" }}
        component="div"
      >
        <Typography variant="h5">
          {T.translate(
            "edit_sponsor.forms_tab.form_manage_items.add_item_inventory"
          )}
        </Typography>
        <IconButton size="large" sx={{ p: 0 }} onClick={() => handleClose()}>
          <CloseIcon fontSize="large" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 0 }}>
        <Grid2 container spacing={2} size={12} sx={{ p: 2 }}>
          <Grid2 container spacing={2} size={4} sx={{ alignItems: "baseline" }}>
            {selectedRows.length} items selected
          </Grid2>
          <Grid2 container spacing={2} size={8}>
            <Grid2 size={3}>
              <MenuButton
                buttonId="sort-button"
                menuId="sort-menu"
                menuItems={[
                  { label: "A-Z", onClick: () => handleSort("name", 1) },
                  { label: "Z-A", onClick: () => handleSort("name", 0) }
                ]}
              >
                <SwapVertIcon fontSize="large" sx={{ mr: 1 }} /> sort by
              </MenuButton>
            </Grid2>
            <Grid2 size={6}>
              <SearchInput
                onSearch={handleOnSearch}
                term={term}
                placeholder={T.translate(
                  "edit_sponsor.forms_tab.placeholders.search"
                )}
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
          onClick={handleOnSave}
          disabled={selectedRows.length === 0}
          fullWidth
          variant="contained"
        >
          {T.translate("edit_sponsor.forms_tab.form_manage_items.add_selected")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

SponsorFormItemFromInventoryPopup.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

const mapStateToProps = ({ currentInventoryItemListState }) => ({
  ...currentInventoryItemListState
});

export default connect(mapStateToProps, {
  getInventoryItems
})(SponsorFormItemFromInventoryPopup);
