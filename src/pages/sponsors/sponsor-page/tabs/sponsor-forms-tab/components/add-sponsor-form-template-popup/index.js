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
  Typography
} from "@mui/material";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import CloseIcon from "@mui/icons-material/Close";
import SearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";
import { FormikProvider, useFormik } from "formik";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import MenuButton from "../../../../../../../components/mui/menu-button";
import { querySponsorAddons } from "../../../../../../../actions/sponsor-actions";
import { getSponsorForms } from "../../../../../../../actions/sponsor-forms-actions";
import {
  DEFAULT_CURRENT_PAGE,
  FIVE_PER_PAGE
} from "../../../../../../../utils/constants";
import MuiFormikSelectGroup from "../../../../../../../components/mui/formik-inputs/mui-formik-select-group";

const AddSponsorFormTemplatePopup = ({
  onClose,
  onSubmit,
  sponsorForms,
  currentPage,
  perPage,
  order,
  orderDir,
  totalCount,
  term = "",
  getSponsorForms,
  sponsor,
  summitId
}) => {
  const [selectedForms, setSelectedForms] = useState([]);

  const sponsorshipIds = sponsor?.sponsorships?.map((e) => e.id) || [];

  const sponsorshipTypeIds = sponsor?.sponsorships?.map((e) => e.type.id) || [];

  const formik = useFormik({
    initialValues: {
      add_ons: []
    },
    onSubmit: async (values) => {
      const { add_ons } = values;
      const entity = {
        forms: selectedForms,
        add_ons
      };

      await onSubmit(entity);
    },
    enableReinitialize: true
  });

  useEffect(() => {
    getSponsorForms(
      term,
      currentPage,
      FIVE_PER_PAGE,
      order,
      orderDir,
      false,
      sponsorshipTypeIds
    );
    setSelectedForms([]);
    setSearchTerm("");
    formik.resetForm();
  }, []);

  const handlePageChange = (page) => {
    getSponsorForms(
      term,
      page,
      FIVE_PER_PAGE,
      order,
      orderDir,
      false,
      sponsorshipTypeIds
    );
  };

  const handleSort = (key, dir) => {
    getSponsorForms(
      term,
      currentPage,
      FIVE_PER_PAGE,
      key,
      dir,
      false,
      sponsorshipTypeIds
    );
  };

  const handleOnSearch = (searchTerm) => {
    getSponsorForms(
      searchTerm,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      false,
      sponsorshipTypeIds
    );
  };

  const handleSelected = (id, isSelected) => {
    if (isSelected) {
      setSelectedForms([...selectedForms, id]);
      return;
    }
    const updatedSelected = selectedForms.filter((e) => e !== id);
    setSelectedForms(updatedSelected);
  };

  const handleClose = () => {
    if (formik.isSubmitting) return;
    formik.resetForm();
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
    <Dialog
      open
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEnforceFocus
      disableAutoFocus
      disableRestoreFocus
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography fontSize="1.5rem">
          {T.translate("edit_sponsor.forms_tab.add_form_using_template")}
        </Typography>
        <IconButton
          size="small"
          onClick={() => handleClose()}
          disabled={formik.isSubmitting}
          sx={{ mr: 1 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <FormikProvider value={formik}>
        <Box
          component="form"
          onSubmit={formik.handleSubmit}
          noValidate
          autoComplete="off"
        >
          <DialogContent sx={{ p: 0 }}>
            <Grid2 container spacing={2} size={12} sx={{ p: 2 }}>
              <MuiFormikSelectGroup
                name="add_ons"
                formik={formik}
                queryFunction={querySponsorAddons}
                queryParams={[summitId, sponsor.id, sponsorshipIds]}
                showSelectAll
                getGroupId={(addon) => addon.sponsorship.type.id}
                getGroupLabel={(addon) => addon.sponsorship.type.type.name}
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
                    menuItems={[
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
                  <SearchInput
                    onSearch={handleOnSearch}
                    placeholder={T.translate(
                      "edit_sponsor.placeholders.search"
                    )}
                  />
                </Grid2>
              </Grid2>
            </Grid2>
            {Array.isArray(sponsorForms) && sponsorForms.length > 0 && (
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
                />
              </Box>
            )}
          </DialogContent>
          <Divider />
          <DialogActions>
            <Button
              type="submit"
              disabled={selectedForms.length === 0 || formik.isSubmitting}
              fullWidth
              variant="contained"
            >
              {T.translate("edit_sponsor.forms_tab.add_selected_form_template")}
            </Button>
          </DialogActions>
        </Box>
      </FormikProvider>
    </Dialog>
  );
};

AddSponsorFormTemplatePopup.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  sponsor: PropTypes.object.isRequired,
  summitId: PropTypes.number.isRequired
};

const mapStateToProps = ({ sponsorFormsListState }) => ({
  ...sponsorFormsListState
});

export default connect(mapStateToProps, {
  getSponsorForms
})(AddSponsorFormTemplatePopup);
