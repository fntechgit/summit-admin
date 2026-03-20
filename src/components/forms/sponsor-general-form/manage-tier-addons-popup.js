import React, { useState, useEffect } from "react";
import T from "i18n-react/dist/i18n-react";
import { FormikProvider, useFormik } from "formik";
import * as yup from "yup";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  IconButton,
  Divider,
  Grid2,
  Typography,
  InputLabel,
  Box
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

import useScrollToError from "../../../hooks/useScrollToError";
import MuiFormikTextField from "../../mui/formik-inputs/mui-formik-textfield";
import MuiFormikSummitAddonSelect from "../../mui/formik-inputs/mui-formik-summit-addon-select";

const ManageTierAddonsPopup = ({
  sponsorship,
  open,
  onClose,
  onSubmit,
  summitId,
  onSponsorshipAddonRemove
}) => {
  const [editingRow, setEditingRow] = useState(null);
  const originalAddons = sponsorship.add_ons || [];

  const formik = useFormik({
    initialValues: {
      addons: originalAddons,
      newAddon: { type: "", name: "" }
    },
    validationSchema: yup.object({
      addons: yup
        .array()
        .of(
          yup.object().shape({
            type: yup.string().required("Type is required"),
            name: yup.string().required("Name is required")
          })
        )
        .test(
          "no-duplicate-addon",
          "Addon with same type and name already exists",
          (addons = []) => {
            const { newAddon } = formik.values;
            const all = [...addons];

            if (newAddon?.type && newAddon?.name) {
              all.push({ type: newAddon.type, name: newAddon.name });
            }

            const seen = new Set();

            const isValid = all.every((addon) => {
              const key = `${addon.type?.trim()}${addon.name?.trim()}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
            return isValid;
          }
        ),
      newAddon: yup
        .object()
        .shape({
          type: yup.string(),
          name: yup.string()
        })
        .test(
          "newAddon-required-if-any-filled",
          "Both type and name are required",
          (value) => {
            if (!value) return true;
            const { type, name } = value;

            const oneIsFilled = type?.trim() || name?.trim();
            const bothAreFilled = type?.trim() && name?.trim();

            return !oneIsFilled || bothAreFilled;
          }
        )
    }),
    onSubmit: (values) => {
      const { newAddon, addons: currentAddons } = values;
      const initialAddons = formik.initialValues.addons;

      const isAddonModified = (addon, original) =>
        addon.type !== original.type || addon.name !== original.name;

      // only send edited addons
      const modifiedAddons = currentAddons.filter((addon, index) => {
        const original = initialAddons[index];
        return !original || isAddonModified(addon, original);
      });

      const shouldIncludeNewAddon =
        newAddon.type?.trim() && newAddon.name?.trim();

      const valuesToSave = {
        ...(modifiedAddons.length > 0 && { addons: modifiedAddons }),
        ...(shouldIncludeNewAddon && { newAddon })
      };

      onSubmit(valuesToSave, sponsorship.id);
    },
    validateOnBlur: false,
    validateOnChange: false,
    enableReinitialize: true
  });

  // SCROLL TO ERROR
  useScrollToError(formik);

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  const handleAddAddon = () => {
    const { type, name } = formik.values.newAddon;
    if (!type || !name) return;

    const updatedAddons = [...formik.values.addons, { type, name }];
    formik.setFieldValue("addons", updatedAddons);
    formik.setFieldValue("newAddon", { type: "", name: "" });
  };

  const handleEditAddon = (index) => {
    setEditingRow(index);
  };

  const handleDeleteAddon = async (addon) => {
    if (addon.id) {
      try {
        await onSponsorshipAddonRemove(addon.id, sponsorship.id);
      } catch (error) {
        console.error("Error deleting addon:", error);
        return;
      }
    }

    const updated = formik.values.addons.filter((a) => a !== addon);
    formik.setFieldValue("addons", updated);
  };

  useEffect(() => {
    if (Object.keys(formik.errors).length > 0) {
      console.log("Validation errors:", formik.errors);
    }
  }, [formik.errors]);

  useEffect(() => {
    if (Object.keys(formik.values).length > 0) {
      console.log("Validation values:", formik.values);
    }
  }, [formik.values]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography fontSize="2.4rem">
          {T.translate("edit_sponsor.manage_addons")}
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
          <DialogContent sx={{ p: 2 }}>
            <Typography
              sx={{
                py: 2,
                fontSize: "2rem",
                fontWeight: "500",
                lineHeight: "1.6rem",
                letterSpacing: "0.15px"
              }}
            >
              {`${sponsorship.tier} ${T.translate("edit_sponsor.sponsorship")}`}
            </Typography>
            {formik.values.addons.map((addon, index) => (
              <Grid2
                key={addon?.id || index}
                container
                spacing={3}
                size={12}
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: "4px",
                  border: "1px solid rgba(0, 0, 0, 0.12)"
                }}
              >
                <Grid2
                  container
                  spacing={2}
                  rowSpacing={editingRow === index ? "14px" : "6px"}
                  size={5}
                  sx={{ alignItems: "baseline", flexDirection: "column" }}
                >
                  <InputLabel htmlFor="type">
                    {T.translate("edit_sponsor.addon_type")}
                  </InputLabel>
                  {editingRow === index ? (
                    <Box width="100%">
                      <MuiFormikSummitAddonSelect
                        name={`addons[${index}].type`}
                        placeholder={T.translate(
                          "edit_sponsor.placeholders.select"
                        )}
                        summitId={summitId}
                        inputProps={{
                          fullWidth: true,
                          margin: "none"
                        }}
                      />
                    </Box>
                  ) : (
                    <Typography>{`${formik.values.addons[index].type}`}</Typography>
                  )}
                </Grid2>
                <Grid2
                  container
                  spacing={2}
                  rowSpacing={editingRow === index ? "14px" : "6px"}
                  size={5}
                  sx={{ alignItems: "baseline", flexDirection: "column" }}
                >
                  <InputLabel htmlFor="name">
                    {T.translate("edit_sponsor.addon_name")}
                  </InputLabel>
                  {editingRow === index ? (
                    <MuiFormikTextField
                      name={`addons[${index}].name`}
                      fullWidth
                      margin="none"
                      placeholder={T.translate("edit_sponsor.name")}
                    />
                  ) : (
                    <Typography>{`${formik.values.addons[index].name}`}</Typography>
                  )}
                </Grid2>
                <Grid2 container size={2} spacing={2} sx={{ display: "flex" }}>
                  {editingRow !== index && (
                    <>
                      <Grid2
                        className="dottedBorderLeft"
                        size={6}
                        sx={{ alignContent: "center" }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => handleEditAddon(index)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Grid2>
                      <Grid2
                        className="dottedBorderLeft"
                        size={6}
                        sx={{ alignContent: "center" }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteAddon(addon)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid2>
                    </>
                  )}
                </Grid2>
              </Grid2>
            ))}
            {!formik.errors.addons &&
              typeof formik.errors.addons === "string" && (
                <Box mb={2} pl={2}>
                  <Typography color="error" sx={{ fontSize: "12px" }}>
                    {formik.errors.addons}
                  </Typography>
                </Box>
              )}
            <Grid2
              container
              spacing={3}
              size={12}
              sx={{
                p: 2,
                borderRadius: "4px",
                border: "1px solid rgba(0, 0, 0, 0.12)"
              }}
            >
              <Grid2
                container
                spacing={2}
                size={5}
                sx={{ alignItems: "baseline" }}
              >
                <InputLabel htmlFor="newAddon.type">
                  {T.translate("edit_sponsor.addon_type")}
                </InputLabel>
                <Box width="100%">
                  <MuiFormikSummitAddonSelect
                    name="newAddon.type"
                    placeholder={T.translate(
                      "edit_sponsor.placeholders.select"
                    )}
                    summitId={summitId}
                    inputProps={{
                      fullWidth: true,
                      margin: "none"
                    }}
                  />
                </Box>
              </Grid2>
              <Grid2
                container
                spacing={2}
                size={5}
                sx={{ alignItems: "baseline" }}
              >
                <InputLabel htmlFor="newAddon.name">
                  {T.translate("edit_sponsor.addon_name")}
                </InputLabel>
                <MuiFormikTextField
                  name="newAddon.name"
                  formik={formik}
                  fullWidth
                  margin="none"
                  placeholder={T.translate("edit_sponsor.name")}
                />
              </Grid2>
              <Grid2 size={2} sx={{ display: "flex" }}>
                <Button
                  variant="contained"
                  aria-label="add"
                  sx={{
                    width: 40,
                    height: 40,
                    minWidth: "auto",
                    borderRadius: "50%",
                    padding: 0,
                    alignSelf: "end",
                    mb: "10px"
                  }}
                  onClick={handleAddAddon}
                >
                  <AddIcon />
                </Button>
              </Grid2>
              {formik.errors.newAddon &&
                typeof formik.errors.newAddon === "string" && (
                  <Box mb={2} pl={2}>
                    <Typography color="error" sx={{ fontSize: "12px" }}>
                      {formik.errors.newAddon}
                    </Typography>
                  </Box>
                )}
            </Grid2>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2 }}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={!formik.dirty}
            >
              {T.translate("edit_sponsor.save_changes")}
            </Button>
          </DialogActions>
        </Box>
      </FormikProvider>
    </Dialog>
  );
};

ManageTierAddonsPopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onSponsorshipAddonRemove: PropTypes.func.isRequired,
  summitId: PropTypes.number.isRequired
};

export default ManageTierAddonsPopup;
