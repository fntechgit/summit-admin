import React, { useEffect, useState } from "react";
import T from "i18n-react/dist/i18n-react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid2,
  IconButton,
  Radio,
  Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchInput from "../../../../../components/mui/search-input";
import { getSponsorFormsForCart } from "../../../../../actions/sponsor-cart-actions";
import MuiInfiniteTable from "../../../../../components/mui/infinite-table";
import SponsorAddonSelect from "../../../../../components/mui/sponsor-addon-select";

const SelectFormDialog = ({
  availableForms,
  summitId,
  sponsor,
  open,
  onSave,
  onClose,
  getSponsorFormsForCart
}) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedAddon, setSelectedAddon] = useState(null);
  const { forms, currentPage, term, order, orderDir, total } = availableForms;

  useEffect(() => {
    getSponsorFormsForCart();
  }, []);

  const handleSort = (key, dir) => {
    getSponsorFormsForCart(term, 1, key, dir);
  };

  const handleLoadMore = () => {
    if (total > forms.length) {
      getSponsorFormsForCart(
        term,
        currentPage + 1,
        order,
        orderDir
      );
    }
  };

  const handleClose = () => {
    setSelectedRows([]);
    onClose();
  };

  const handleOnCheck = (rowId, checked) => {
    setSelectedRows(checked ? [rowId] : []);
  };

  const handleOnSearch = (searchTerm) => {
    getSponsorFormsForCart(searchTerm);
  };

  const handleOnSave = () => {
    const form = forms.find((f) => f.id === selectedRows[0]);
    onSave(form, selectedAddon);
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
            <Radio
              checked={selectedRows.includes(row.id)}
              onChange={(ev) => handleOnCheck(row.id, ev.target.checked)}
            />
          }
        />
      )
    },
    {
      columnKey: "code",
      header: T.translate("edit_sponsor.cart_tab.code"),
      sortable: true
    },
    {
      columnKey: "name",
      header: T.translate("edit_sponsor.cart_tab.name"),
      sortable: true
    },
    {
      columnKey: "items",
      header: T.translate("edit_sponsor.cart_tab.items"),
      sortable: false
    }
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between" }}
        component="div"
      >
        <Typography variant="h5">
          {T.translate("edit_sponsor.cart_tab.add_form_to_cart")}
        </Typography>
        <IconButton size="large" sx={{ p: 0 }} onClick={() => handleClose()}>
          <CloseIcon fontSize="large" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 0 }}>
        <Grid2 container spacing={2} size={12} sx={{ p: 2 }}>
          <SponsorAddonSelect
            value={selectedAddon || null}
            summitId={summitId}
            sponsor={sponsor}
            onChange={setSelectedAddon}
            placeholder={T.translate("edit_sponsor.cart_tab.select_addon")}
          />
        </Grid2>
        <Grid2 container spacing={2} size={12} sx={{ p: 2 }}>
          <Grid2 size={4} sx={{ mt: 1 }}>
            {selectedRows.length} items selected
          </Grid2>
          <Grid2 size={6} offset={2}>
            <SearchInput
              onSearch={handleOnSearch}
              term={term}
            />
          </Grid2>
        </Grid2>

        {forms.length > 0 && (
          <Box sx={{ p: 2 }}>
            <MuiInfiniteTable
              columns={columns}
              data={forms}
              options={{ sortCol: order, sortDir: orderDir }}
              loadMoreData={handleLoadMore}
              onSort={handleSort}
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
          {T.translate("edit_sponsor.cart_tab.add_selected_form")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

SelectFormDialog.propTypes = {
  summitId: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

const mapStateToProps = ({ sponsorPageCartListState }) => ({
  availableForms: sponsorPageCartListState.availableForms,
});

export default connect(mapStateToProps, {
  getSponsorFormsForCart
})(SelectFormDialog);
