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
  Radio,
  Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchInput from "../mui/search-input";
import { getPageTemplates } from "../../actions/page-template-actions";
import { DEFAULT_PER_PAGE } from "../../utils/constants";
import MuiInfiniteTable from "../mui/infinite-table";

const SelectPageTemplateDialog = ({
  pageTemplates,
  currentPage,
  term,
  order,
  orderDir,
  total,
  onSave,
  onClose,
  isMulti = false,
  getPageTemplates
}) => {
  const [selectedRows, setSelectedRows] = useState([]);

  useEffect(() => {
    getPageTemplates("", 1, DEFAULT_PER_PAGE, "id", 1, true);
  }, []);

  const handleSort = (key, dir) => {
    getPageTemplates(term, 1, DEFAULT_PER_PAGE, key, dir, true);
  };

  const handleLoadMore = () => {
    if (total > pageTemplates.length) {
      getPageTemplates(
        term,
        currentPage + 1,
        DEFAULT_PER_PAGE,
        order,
        orderDir,
        true
      );
    }
  };

  const handleClose = () => {
    setSelectedRows([]);
    onClose();
  };

  const handleOnCheck = (rowId, checked) => {
    if (isMulti) {
      if (checked) {
        setSelectedRows([...selectedRows, rowId]);
      } else {
        setSelectedRows(selectedRows.filter((r) => r !== rowId));
      }
    } else {
      // For single selection (radio), always set to the selected row
      setSelectedRows(checked ? [rowId] : []);
    }
  };

  const handleOnSearch = (searchTerm) => {
    getPageTemplates(searchTerm, 1, DEFAULT_PER_PAGE, "id", 1, true);
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
      render: (row) =>
        isMulti ? (
          <FormControlLabel
            label=""
            control={
              <Checkbox
                checked={selectedRows.includes(row.id)}
                onChange={(ev) => handleOnCheck(row.id, ev.target.checked)}
              />
            }
          />
        ) : (
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
      header: T.translate("sponsor_pages.global_page_popup.code"),
      sortable: true
    },
    {
      columnKey: "name",
      header: T.translate("sponsor_pages.global_page_popup.name"),
      sortable: true
    },
    {
      columnKey: "info_mod",
      header: T.translate("sponsor_pages.global_page_popup.info_mod"),
      sortable: false
    },
    {
      columnKey: "download_mod",
      header: T.translate("sponsor_pages.global_page_popup.download_mod"),
      sortable: false
    },
    {
      columnKey: "upload_mod",
      header: T.translate("sponsor_pages.global_page_popup.upload_mod"),
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
          {T.translate("sponsor_pages.global_page_popup.title")}
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
              placeholder={T.translate("sponsor_pages.placeholders.search")}
            />
          </Grid2>
        </Grid2>

        {pageTemplates.length > 0 && (
          <Box sx={{ p: 2 }}>
            <MuiInfiniteTable
              columns={columns}
              data={pageTemplates}
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
          {T.translate("sponsor_pages.global_page_popup.add_selected")}
        </Button>
      </DialogActions>
    </>
  );
};

SelectPageTemplateDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

const mapStateToProps = ({ pageTemplateListState }) => ({
  ...pageTemplateListState
});

export default connect(mapStateToProps, {
  getPageTemplates
})(SelectPageTemplateDialog);
