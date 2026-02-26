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
import { querySponsorAddons } from "../../../../../actions/sponsor-actions";
import { getShowPages } from "../../../../../actions/show-pages-actions";
import {
  DEFAULT_CURRENT_PAGE,
  FIVE_PER_PAGE
} from "../../../../../utils/constants";
import MuiFormikSelectGroup from "../../../../../components/mui/formik-inputs/mui-formik-select-group";

const AddSponsorPageTemplatePopup = ({
  onClose,
  onSubmit,
  showPages,
  currentPage,
  perPage,
  order,
  orderDir,
  totalCount,
  term = "",
  getShowPages,
  sponsor,
  summitId
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPages, setSelectedPages] = useState([]);

  const sponsorshipIds = sponsor.sponsorships.map((e) => e.id);

  const sponsorshipTypeIds = sponsor.sponsorships.map((e) => e.type.id);

  const formik = useFormik({
    initialValues: {
      add_ons: []
    },
    validationSchema: yup.object({
      add_ons: yup
        .array()
        .test(
          "add_ons-required",
          T.translate("validation.add_on_required"),
          (value) => value?.includes("all") || value?.length > 0
        )
    }),
    onSubmit: (values) => {
      const { add_ons } = values;
      const entity = {
        pages: selectedPages,
        add_ons
      };
      onSubmit(entity);
    },
    enableReinitialize: true
  });

  useEffect(() => {
    getShowPages(
      term,
      DEFAULT_CURRENT_PAGE,
      FIVE_PER_PAGE,
      order,
      orderDir,
      false,
      sponsorshipTypeIds
    );
  }, []);

  const handlePageChange = (page) => {
    getShowPages(
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
    getShowPages(
      term,
      DEFAULT_CURRENT_PAGE,
      FIVE_PER_PAGE,
      key,
      dir,
      false,
      sponsorshipTypeIds
    );
  };

  const handleOnSearch = (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      ev.stopPropagation();
      getShowPages(
        searchTerm,
        DEFAULT_CURRENT_PAGE,
        perPage,
        order,
        orderDir,
        false,
        sponsorshipTypeIds
      );
    }
  };

  const handleSelected = (id, isSelected) => {
    if (isSelected) {
      setSelectedPages([...selectedPages, id]);
      return;
    }
    const updatedSelected = selectedPages.filter((e) => e !== id);
    setSelectedPages(updatedSelected);
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
              checked={selectedPages.includes(row.id)}
              onChange={(ev) => handleSelected(row.id, ev.target.checked)}
            />
          }
        />
      )
    },
    {
      columnKey: "code",
      header: T.translate("edit_sponsor.pages_tab.code"),
      sortable: false
    },
    {
      columnKey: "name",
      header: T.translate("edit_sponsor.pages_tab.name"),
      sortable: false
    },
    {
      columnKey: "info_mod",
      header: T.translate("edit_sponsor.pages_tab.info_mod")
    },
    {
      columnKey: "upload_mod",
      header: T.translate("edit_sponsor.pages_tab.upload_mod")
    },
    {
      columnKey: "download_mod",
      header: T.translate("edit_sponsor.pages_tab.download_mod")
    }
  ];

  return (
    <Dialog open onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography fontSize="1.5rem">
          {T.translate("edit_sponsor.pages_tab.add_page_using_template")}
        </Typography>
        <IconButton size="small" onClick={() => handleClose()} sx={{ mr: 1 }}>
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
                // params for function, except input
                queryParams={[summitId, sponsor.id, sponsorshipIds]}
                showSelectAll
                getGroupId={(addon) => addon.sponsorship.type.id}
                getGroupLabel={(addon) => addon.sponsorship.type.type.name}
                noOptionsLabel={T.translate(
                  "edit_sponsor.pages_tab.no_add_ons"
                )}
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
                <Grid2 size={4}>{selectedPages.length} items selected</Grid2>
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
                    <SwapVertIcon fontSize="large" sx={{ mr: 1 }} /> sort by
                  </MenuButton>
                </Grid2>
                <Grid2 size={8}>
                  <TextField
                    variant="outlined"
                    value={searchTerm}
                    placeholder={T.translate(
                      "edit_sponsor.placeholders.search"
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

            {showPages.length > 0 && (
              <Box sx={{ p: 2 }}>
                <MuiTable
                  columns={columns}
                  data={showPages}
                  options={tableOptions}
                  currentPage={currentPage}
                  perPage={perPage}
                  totalRows={totalCount}
                  onSort={handleSort}
                  onPageChange={handlePageChange}
                />
              </Box>
            )}
            {showPages.length === 0 && (
              <Box sx={{ p: 2 }}>
                {T.translate("errors.pages_tab.no_pages")}
              </Box>
            )}
          </DialogContent>
          <Divider />
          <DialogActions>
            <Button
              type="submit"
              disabled={selectedPages.length === 0}
              fullWidth
              variant="contained"
            >
              {T.translate("edit_sponsor.pages_tab.add_selected_page_template")}
            </Button>
          </DialogActions>
        </Box>
      </FormikProvider>
    </Dialog>
  );
};

AddSponsorPageTemplatePopup.propTypes = {
  onClose: PropTypes.func.isRequired
};

const mapStateToProps = ({ showPagesListState }) => ({
  ...showPagesListState
});

export default connect(mapStateToProps, {
  getShowPages
})(AddSponsorPageTemplatePopup);
