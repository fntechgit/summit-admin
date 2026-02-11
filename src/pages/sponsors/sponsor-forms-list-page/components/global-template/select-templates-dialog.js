import React, { useEffect, useState } from "react";
import T from "i18n-react/dist/i18n-react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import {
  Box,
  Button,
  Checkbox,
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
import SearchInput from "../../../../../components/mui/search-input";
import { getGlobalTemplates } from "../../../../../actions/sponsor-forms-actions";
import { DEFAULT_PER_PAGE } from "../../../../../utils/constants";
import MuiInfiniteTable from "../../../../../components/mui/infinite-table";

const SelectTemplatesDialog = ({
  globalTemplates,
  onSave,
  onClose,
  getGlobalTemplates
}) => {
  const { items, currentPage, term, order, orderDir, total } = globalTemplates;
  const [selectedRows, setSelectedRows] = useState([]);

  useEffect(() => {
    getGlobalTemplates("", 1, DEFAULT_PER_PAGE, "id", 1);
  }, []);

  const handleSort = (key, dir) => {
    getGlobalTemplates(term, 1, DEFAULT_PER_PAGE, key, dir);
  };

  const handleLoadMore = () => {
    if (total > items.length) {
      getGlobalTemplates(
        term,
        currentPage + 1,
        DEFAULT_PER_PAGE,
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
    if (checked) {
      setSelectedRows([...selectedRows, rowId]);
    } else {
      setSelectedRows(selectedRows.filter((r) => r !== rowId));
    }
  };

  const handleOnSearch = (searchTerm) => {
    getGlobalTemplates(searchTerm, 1, DEFAULT_PER_PAGE, "id", 1);
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
      header: T.translate("sponsor_forms.global_template_popup.code"),
      sortable: true
    },
    {
      columnKey: "name",
      header: T.translate("sponsor_forms.global_template_popup.name"),
      sortable: true
    },
    {
      columnKey: "items_qty",
      header: T.translate("sponsor_forms.global_template_popup.items"),
      sortable: false
    }
  ];

  return (
    <>
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between" }}
        component="div"
      >
        <Typography variant="h5">
          {T.translate("sponsor_forms.global_template_popup.title")}
        </Typography>
        <IconButton size="large" sx={{ p: 0 }} onClick={() => handleClose()}>
          <CloseIcon fontSize="large" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 0 }}>
        <Grid2 container spacing={2} size={12} sx={{ p: 2 }}>
          <Grid2 size={4} sx={{ mt: 1 }}>
            {selectedRows.length} items selected
          </Grid2>
          <Grid2 size={6} offset={2}>
            <SearchInput
              onSearch={handleOnSearch}
              term={term}
              placeholder={T.translate("sponsor_forms.placeholders.search")}
            />
          </Grid2>
        </Grid2>

        {items.length > 0 && (
          <Box sx={{ p: 2 }}>
            <MuiInfiniteTable
              columns={columns}
              data={items}
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
          {T.translate("sponsor_forms.global_template_popup.add_selected")}
        </Button>
      </DialogActions>
    </>
  );
};

SelectTemplatesDialog.propTypes = {
  globalTemplates: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

const mapStateToProps = ({ sponsorFormsListState }) => ({
  globalTemplates: sponsorFormsListState.globalTemplates
});

export default connect(mapStateToProps, {
  getGlobalTemplates
})(SelectTemplatesDialog);
