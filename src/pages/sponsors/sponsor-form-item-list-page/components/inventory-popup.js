import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { connect } from "react-redux";
import {
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
  Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Tooltip from "@mui/material/Tooltip";
import ImageIcon from "@mui/icons-material/Image";
import Box from "@mui/material/Box";
import SearchInput from "../../../../components/mui/search-input";
import MuiTable from "../../../../components/mui/table/mui-table";
import { addInventoryItems } from "../../../../actions/sponsor-forms-actions";
import { getInventoryItems } from "../../../../actions/inventory-item-actions";
import { DEFAULT_CURRENT_PAGE } from "../../../../utils/constants";

const InventoryPopup = ({
  formId,
  open,
  onClose,
  addInventoryItems,
  getInventoryItems,
  inventoryItems
}) => {
  const {
    inventoryItems: items,
    term,
    order,
    orderDir,
    currentPage,
    perPage,
    totalInventoryItems: total
  } = inventoryItems;
  const [selectedRows, setSelectedRows] = useState([]);

  const handleClose = () => {
    onClose();
  };

  const handleOnAdd = () => {
    addInventoryItems(formId, selectedRows).finally(() => {
      handleClose();
    });
  };

  const handleOnCheck = (rowId, checked) => {
    if (checked) {
      setSelectedRows([...selectedRows, rowId]);
    } else {
      setSelectedRows(selectedRows.filter((r) => r !== rowId));
    }
  };

  const handleSort = (key, dir) => {
    getInventoryItems(term, 1, perPage, key, dir);
  };

  const handleSearch = (searchTerm) => {
    getInventoryItems(searchTerm, 1, perPage, order, orderDir);
  };

  const handlePageChange = (page) => {
    getInventoryItems(term, page, perPage, order, orderDir);
  };

  const handlePerPageChange = (newPerPage) => {
    getInventoryItems(term, DEFAULT_CURRENT_PAGE, newPerPage, order, orderDir);
  };

  useEffect(() => {
    getInventoryItems();
  }, []);

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
      header: T.translate("sponsor_form_item_list.add_from_inventory.code"),
      sortable: true
    },
    {
      columnKey: "name",
      header: T.translate("sponsor_form_item_list.add_from_inventory.name"),
      sortable: true
    },
    {
      columnKey: "early_bird_rate",
      header: T.translate(
        "sponsor_form_item_list.add_from_inventory.early_bird_rate"
      ),
      sortable: false
    },
    {
      columnKey: "standard_rate",
      header: T.translate(
        "sponsor_form_item_list.add_from_inventory.standard_rate"
      ),
      sortable: false
    },
    {
      columnKey: "onsite_rate",
      header: T.translate(
        "sponsor_form_item_list.add_from_inventory.onsite_rate"
      ),
      sortable: false
    },
    {
      columnKey: "hasImage",
      header: "",
      width: 40,
      align: "center",
      render: (row) =>
        row.images?.length > 0 ? (
          <Tooltip title={row.images[0].file_url} placement="top" arrow>
            <IconButton size="large">
              <ImageIcon
                fontSize="large"
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between" }}
        component="div"
      >
        <Typography variant="h5">
          {T.translate("sponsor_form_item_list.add_from_inventory.title")}
        </Typography>
        <IconButton size="large" sx={{ p: 0 }} onClick={handleClose}>
          <CloseIcon fontSize="large" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 3 }}>
        <Grid2
          container
          spacing={2}
          sx={{
            justifyContent: "center",
            alignItems: "center",
            mb: 2
          }}
        >
          <Grid2 size={2}>
            <Box component="span">{selectedRows.length} items selected</Box>
          </Grid2>
          <Grid2 size={3} offset={7}>
            <SearchInput term={term} onSearch={handleSearch} />
          </Grid2>
        </Grid2>
        {items.length > 0 && (
          <div>
            <MuiTable
              columns={columns}
              data={items}
              options={tableOptions}
              perPage={perPage}
              currentPage={currentPage}
              totalRows={total}
              onPageChange={handlePageChange}
              onPerPageChange={handlePerPageChange}
              onSort={handleSort}
            />
          </div>
        )}
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button
          fullWidth
          variant="contained"
          disabled={selectedRows.length === 0}
          onClick={handleOnAdd}
        >
          {T.translate("sponsor_form_item_list.add_from_inventory.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

InventoryPopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

const mapStateToProps = ({ currentInventoryItemListState }) => ({
  inventoryItems: currentInventoryItemListState
});

export default connect(mapStateToProps, {
  addInventoryItems,
  getInventoryItems
})(InventoryPopup);
