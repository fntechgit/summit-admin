import React, { useState } from "react";
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
import MuiFormikTextField from "../../inputs/mui-formik-textfield";
import SummitAddonSelect from "../../inputs/summit-addon-select";

const ManageTierAddonsPopup = ({
  sponsorship,
  open,
  onClose,
  onSubmit,
  summitId
}) => {
  const [editingRow, setEditingRow] = useState(null);
  const originalAddons = sponsorship.addons || [];

  const formik = useFormik({
    initialValues: {
      addons: originalAddons.map((a) => ({ ...a })),
      newAddon: { type: "", name: "" }
    },
    validationSchema: yup.object({
      addons: yup
        .array()
        .of(
          yup.object().shape({
            type: yup.number().required("Type is required"),
            name: yup.string().required()
          })
        )
        .min(1, "At least one addon is required")
    }),
    onSubmit,
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
                      <SummitAddonSelect
                        name="type"
                        formik={formik.values.addons[index]}
                        fullWidth
                        placeholder={T.translate(
                          "edit_sponsor.placeholders.select"
                        )}
                        summitId={summitId}
                        margin="none"
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
                      name="name"
                      formik={formik.values.addons[index]}
                      disabled
                      fullWidth
                      margin="none"
                      placeholder={T.translate("edit_sponsor.name")}
                    />
                  ) : (
                    <Typography>{`${formik.values.addons[index].name}`}</Typography>
                  )}
                </Grid2>
                <Grid2 container size={2} spacing={2} sx={{ display: "flex" }}>
                  {editingRow === index ? (
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
                      onClick={() => handleAddAddon}
                    >
                      <AddIcon />
                    </Button>
                  ) : (
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
                  <SummitAddonSelect
                    name="newAddon.type"
                    formik={formik}
                    fullWidth
                    placeholder={T.translate(
                      "edit_sponsor.placeholders.select"
                    )}
                    summitId={summitId}
                    margin="none"
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
            </Grid2>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2 }}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={
                !formik.values.company ||
                formik.values.sponsorships.length === 0
              }
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
  summitId: PropTypes.number.isRequired
};

export default ManageTierAddonsPopup;
