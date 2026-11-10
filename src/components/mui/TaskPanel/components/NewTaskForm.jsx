import React from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { useFormik, FormikProvider } from "formik";
import * as yup from "yup";
import { Box, Button, MenuItem } from "@mui/material";
import MuiFormikSelect from "openstack-uicore-foundation/lib/components/mui/formik-inputs/select";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import GUIDES from "../guides";

const guideName = (id) => T.translate(`task_panel.guides.${id}`);

const NewTaskForm = ({ onCreate, onCancel }) => {
  const formik = useFormik({
    initialValues: { guide: "", name: "" },
    validationSchema: yup.object({
      guide: yup.string().required(T.translate("validation.required")),
      name: yup
        .string(T.translate("validation.string"))
        .required(T.translate("validation.required"))
    }),
    onSubmit: onCreate,
    validateOnChange: false
  });

  return (
    <FormikProvider value={formik}>
      <Box
        component="form"
        onSubmit={formik.handleSubmit}
        noValidate
        autoComplete="off"
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        <MuiFormikSelect
          name="guide"
          size="small"
          placeholder={T.translate("task_panel.guide")}
          // the default shows the raw id, not the guide's name
          renderValue={(id) =>
            id ? (
              guideName(id)
            ) : (
              <Box component="span" sx={{ color: "text.disabled" }}>
                {T.translate("task_panel.guide")}
              </Box>
            )
          }
        >
          {GUIDES.map((guide) => (
            <MenuItem key={guide.id} value={guide.id}>
              {guideName(guide.id)}
            </MenuItem>
          ))}
        </MuiFormikSelect>
        <MuiFormikTextField
          name="name"
          fullWidth
          size="small"
          label={T.translate("task_panel.task_name")}
        />
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <Button onClick={onCancel}>{T.translate("general.cancel")}</Button>
          <Button type="submit" variant="contained">
            {T.translate("task_panel.create")}
          </Button>
        </Box>
      </Box>
    </FormikProvider>
  );
};

NewTaskForm.propTypes = {
  onCreate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default NewTaskForm;
