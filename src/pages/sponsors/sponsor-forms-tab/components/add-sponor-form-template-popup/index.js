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
import * as yup from "yup";
import { FormikProvider, useFormik } from "formik";
import MuiTable from "../../../../../components/mui/table/mui-table";
import MenuButton from "../../../../../components/mui/menu-button";
import MuiFormikAsyncSelect from "../../../../../components/mui/formik-inputs/mui-formik-async-select";
import { querySponsorAddons } from "../../../../../actions/sponsor-actions";
import { getSponsorForms } from "../../../../../actions/sponsor-forms-actions";
import { FIVE_PER_PAGE } from "../../../../../utils/constants";

const AddSponsorFormTemplatePopup = ({
  open,
  onClose,
  sponsorForms,
  currentPage,
  perPage,
  order,
  orderDir,
  totalCount,
  term = "",
  getSponsorForms
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedForms, setSelectedForms] = useState([]);

  const formik = useFormik({
    initialValues: {
      add_ons: null
    },
    validationSchema: yup.object({
      add_ons: yup.number()
    }),
    onSubmit: console.log("SUBMIT"),
    enableReinitialize: true
  });

  useEffect(() => {
    getSponsorForms(term, currentPage, FIVE_PER_PAGE, order, orderDir);
  }, []);

  const handlePageChange = (page) => {
    getSponsorForms(term, page, FIVE_PER_PAGE, order, orderDir);
  };

  // const handlePerPageChange = (newPerPage) => {
  //   getSponsorForms(term, currentPage, newPerPage, order, orderDir);
  // };

  const handleSort = (key, dir) => {
    getSponsorForms(term, currentPage, FIVE_PER_PAGE, key, dir);
  };

  const handleOnSearch = (ev) => {
    if (ev.key === "Enter")
      getSponsorForms(searchTerm, currentPage, perPage, order, orderDir);
  };

  const handleSelected = (id, isSelected) => {
    if (isSelected) {
      setSelectedForms([...selectedForms, id]);
      return;
    }
    const updatedSelected = selectedForms.filter((e) => e !== id);
    setSelectedForms(updatedSelected);
  };

  const handleAddFormTemplate = () => {
    console.log("SAVE", selectedForms);
  };

  const handleClose = () => {
    onClose();
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
              checked={selectedForms.includes(row.id)}
              onChange={(ev) => handleSelected(row.id, ev.target.checked)}
            />
          }
        />
      )
    },
    {
      columnKey: "code",
      header: T.translate("edit_sponsor.forms_tab.code"),
      sortable: false
    },
    {
      columnKey: "name",
      header: T.translate("edit_sponsor.forms_tab.name"),
      sortable: false
    },

    {
      columnKey: "items_qty",
      header: T.translate("edit_sponsor.forms_tab.items"),
      sortable: false
    }
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography fontSize="1.5rem">
          {T.translate("edit_sponsor.forms_tab.add_form_using_template")}
        </Typography>
        <IconButton size="small" onClick={() => handleClose()} sx={{ mr: 1 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <FormikProvider value={formik}>
        <DialogContent sx={{ p: 0 }}>
          <Grid2 container spacing={2} size={12} sx={{ p: 2 }}>
            <MuiFormikAsyncSelect
              name="add_ons"
              queryFunction={querySponsorAddons}
              // params for function, except input
              queryParams={[1, 1, 1]}
              placeholder={T.translate(
                "edit_sponsor.placeholders.select_add_ons"
              )}
            />
          </Grid2>
          <Grid2 container spacing={2} size={12} sx={{ p: 2 }}>
            <Grid2
              container
              spacing={2}
              size={6}
              sx={{ alignItems: "baseline" }}
            >
              <Grid2 size={4}>{selectedForms.length} items selected</Grid2>
            </Grid2>
            <Grid2 container spacing={2} size={6}>
              <Grid2 size={4}>
                <MenuButton
                  buttonId="sort-button"
                  menuId="sort-menu"
                  buttonSx={{ color: "#000" }}
                  menuItems={[
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
                  placeholder={T.translate("edit_sponsor.placeholders.search")}
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

          {sponsorForms.length > 0 && (
            <Box sx={{ p: 2 }}>
              <MuiTable
                columns={columns}
                data={sponsorForms}
                options={tableOptions}
                currentPage={currentPage}
                perPage={perPage}
                totalRows={totalCount}
                onSort={handleSort}
                onPageChange={handlePageChange}
                // onPerPageChange={handlePerPageChange}
              />
            </Box>
          )}
        </DialogContent>
      </FormikProvider>
      <Divider />
      <DialogActions>
        <Button
          onClick={handleAddFormTemplate}
          disabled={selectedForms.length === 0}
          fullWidth
          variant="contained"
        >
          {T.translate("edit_sponsor.forms_tab.add_selected_form_template")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

AddSponsorFormTemplatePopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

const mapStateToProps = ({ sponsorFormsListState }) => ({
  ...sponsorFormsListState
});

export default connect(mapStateToProps, {
  getSponsorForms
})(AddSponsorFormTemplatePopup);
