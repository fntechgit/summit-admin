/**
 * Copyright 2026 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * */

import React, { useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { FormikProvider, useFormik } from "formik";
import * as yup from "yup";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  TextField
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import DeleteIcon from "@mui/icons-material/Delete";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import MuiFormikRadioGroup from "openstack-uicore-foundation/lib/components/mui/formik-inputs/radio-group";
import showConfirmDialog from "../../mui/showConfirmDialog";
import { queryFilterCriterias } from "../../../actions/filter-criteria-actions";
import {
  VISIBILITY_OPTION_EVERYONE,
  VISIBILITY_OPTION_ME
} from "../../../utils/filter-criteria-constants";

const SaveViewDialog = ({ selectedView, onSave, onClose }) => {
  const formik = useFormik({
    initialValues: {
      name: selectedView?.name ?? "",
      visibility: selectedView?.visibility ?? ""
    },
    validationSchema: yup.object({
      name: yup.string().trim().required(T.translate("validation.required")),
      visibility: yup.string().required(T.translate("validation.required"))
    }),
    // keeps the id of the active view so saving updates it instead of
    // creating a new one
    onSubmit: (values) =>
      onSave({ id: selectedView?.id, ...values })
        .then(() => onClose())
        // the action's error handler reports the failure; keep the dialog
        // open so the user can retry
        .catch(() => {})
  });

  const handleClose = () => {
    if (formik.isSubmitting) return;
    onClose();
  };

  return (
    <Dialog
      open
      onClose={handleClose}
      disableEscapeKeyDown={formik.isSubmitting}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>{T.translate("saved_views.save_current")}</DialogTitle>
      <FormikProvider value={formik}>
        <Box
          component="form"
          onSubmit={formik.handleSubmit}
          noValidate
          autoComplete="off"
        >
          <DialogContent>
            <MuiFormikTextField
              name="name"
              label={T.translate("saved_views.name")}
              fullWidth
              autoFocus
            />
            <MuiFormikRadioGroup
              name="visibility"
              label={T.translate("save_filter_criteria.visible_to")}
              row
              options={[
                {
                  value: VISIBILITY_OPTION_ME,
                  label: T.translate("save_filter_criteria.me")
                },
                {
                  value: VISIBILITY_OPTION_EVERYONE,
                  label: T.translate("save_filter_criteria.everyone")
                }
              ]}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} disabled={formik.isSubmitting}>
              {T.translate("general.cancel")}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={formik.isSubmitting}
            >
              {T.translate("general.save")}
            </Button>
          </DialogActions>
        </Box>
      </FormikProvider>
    </Dialog>
  );
};

SaveViewDialog.propTypes = {
  selectedView: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    visibility: PropTypes.string
  }),
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

SaveViewDialog.defaultProps = {
  selectedView: null
};

// Saved filter criteria as a toolbar dropdown: pick a view to apply it,
// delete one, clear the active one, or save the current filters as a view.
const SavedViews = ({
  summitId,
  context,
  selectedView,
  onChange,
  onSave,
  onDelete
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [views, setViews] = useState([]);
  const [search, setSearch] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const loadViews = (input) =>
    queryFilterCriterias(summitId, context, input, setViews);

  const handleOpen = (ev) => {
    setAnchorEl(ev.currentTarget);
    setSearch("");
    loadViews("");
  };

  const handleClose = () => setAnchorEl(null);

  const handleSearch = (ev) => {
    setSearch(ev.target.value);
    loadViews(ev.target.value);
  };

  const handleSelect = (view) => {
    onChange(view);
    handleClose();
  };

  const handleDelete = async (ev, view) => {
    ev.stopPropagation();
    const isConfirmed = await showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate(
        "select_filter_criteria.remove_filter_criteria_warning"
      )}"${view.name}"`,
      iconType: "warning",
      confirmButtonColor: "error",
      confirmButtonText: T.translate("general.yes_delete")
    });

    if (!isConfirmed) return;

    Promise.resolve(onDelete(view.id))
      .then(() =>
        setViews((current) => current.filter((v) => v.id !== view.id))
      )
      .catch(() => {});
  };

  const handleOpenSaveDialog = () => {
    handleClose();
    setShowSaveDialog(true);
  };

  return (
    <>
      <Button
        size="small"
        endIcon={<ArrowDropDownIcon />}
        onClick={handleOpen}
        aria-haspopup="true"
        aria-expanded={anchorEl ? "true" : undefined}
      >
        {selectedView?.name ?? T.translate("saved_views.title")}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        autoFocus={false}
        slotProps={{ paper: { sx: { minWidth: 280 } } }}
      >
        <Box sx={{ px: 2, pb: 1 }}>
          <TextField
            size="small"
            fullWidth
            value={search}
            onChange={handleSearch}
            placeholder={T.translate("general.placeholders.search")}
            // the menu otherwise treats typing as item navigation
            onKeyDown={(ev) => ev.stopPropagation()}
            inputProps={{ "aria-label": T.translate("general.search") }}
          />
        </Box>
        {views.length === 0 && (
          <MenuItem disabled>{T.translate("saved_views.no_views")}</MenuItem>
        )}
        {views.map((view) => (
          <MenuItem
            key={view.id}
            selected={view.id === selectedView?.id}
            onClick={() => handleSelect(view)}
          >
            <ListItemText primary={view.name} />
            <IconButton
              size="small"
              edge="end"
              aria-label={`${T.translate("general.delete")} ${view.name}`}
              onClick={(ev) => handleDelete(ev, view)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </MenuItem>
        ))}
        <Divider />
        {selectedView && (
          <MenuItem onClick={() => handleSelect(null)}>
            {T.translate("saved_views.clear")}
          </MenuItem>
        )}
        <MenuItem onClick={handleOpenSaveDialog}>
          <AddIcon fontSize="small" sx={{ mr: 1 }} />
          {T.translate("saved_views.save_current")}
        </MenuItem>
      </Menu>
      {showSaveDialog && (
        <SaveViewDialog
          selectedView={selectedView}
          onSave={onSave}
          onClose={() => setShowSaveDialog(false)}
        />
      )}
    </>
  );
};

SavedViews.propTypes = {
  summitId: PropTypes.number.isRequired,
  context: PropTypes.string.isRequired,
  selectedView: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    visibility: PropTypes.string
  }),
  onChange: PropTypes.func.isRequired,
  // must return a promise; the save dialog closes once it resolves
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

SavedViews.defaultProps = {
  selectedView: null
};

export default SavedViews;
