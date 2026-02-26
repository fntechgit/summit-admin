import React from "react";
import T from "i18n-react/dist/i18n-react";
import PropTypes from "prop-types";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid2,
  IconButton,
  Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { FormikProvider, useFormik } from "formik";
import * as yup from "yup";
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import MuiFormikTextField from "../../../../components/mui/formik-inputs/mui-formik-textfield";
import PageModules from "./page-template-modules-form";
import {
  BYTES_PER_MB,
  COLUMN_4,
  COLUMN_8,
  PAGES_MODULE_KINDS,
  PAGE_MODULES_MEDIA_TYPES
} from "../../../../utils/constants";
import DropdownCheckbox from "../../../../components/mui/dropdown-checkbox";

const normalizeModules = (modules = [], summitTZ = "UTC") =>
  modules.map((m) => {
    if (m.kind === PAGES_MODULE_KINDS.MEDIA) {
      const normalizeModule = { ...m };
      if (m.upload_deadline) {
        normalizeModule.upload_deadline = epochToMomentTimeZone(
          m.upload_deadline,
          summitTZ
        );
      }
      if (m.file_type) {
        normalizeModule.file_type_id = {
          value: m.file_type.id,
          label: `${m.file_type.name} (${m.file_type.allowed_extensions})`
        };
      }
      return normalizeModule;
    }
    return m;
  });

const PageTemplatePopup = ({
  pageTemplate,
  onClose,
  onSave,
  summitTZ,
  sponsorships
}) => {
  const showSponsorships =
    Array.isArray(sponsorships) && sponsorships.length > 0;

  const handleClose = () => {
    onClose();
  };

  const addModule = (moduleData) => {
    const modules = formik.values.modules || [];
    const newModule = {
      ...moduleData,
      _tempId: `temp-${Date.now()}`,
      custom_order: modules.length
    };
    formik.setFieldValue("modules", [...modules, newModule]);
  };

  const handleAddInfo = () => {
    addModule({
      kind: PAGES_MODULE_KINDS.INFO,
      content: ""
    });
  };

  const handleAddDocument = () => {
    addModule({
      kind: PAGES_MODULE_KINDS.DOCUMENT,
      name: "",
      description: "",
      external_url: "",
      file: []
    });
  };

  const handleAddMedia = () => {
    addModule({
      kind: PAGES_MODULE_KINDS.MEDIA,
      type: PAGE_MODULES_MEDIA_TYPES.FILE,
      name: "",
      description: "",
      upload_deadline: null,
      max_file_size: 0,
      file_type_id: null
    });
  };

  const infoModuleSchema = yup.object().shape({
    kind: yup.string().equals([PAGES_MODULE_KINDS.INFO]),
    content: yup.string().required(T.translate("validation.required"))
  });

  const documentModuleSchema = yup.object().shape({
    kind: yup.string().equals([PAGES_MODULE_KINDS.DOCUMENT]),
    name: yup.string().required(T.translate("validation.required")),
    description: yup.string().required(T.translate("validation.required")),
    external_url: yup.string(),
    file: yup.array().min(1, T.translate("validation.file_required"))
  });

  const mediaModuleSchema = yup.object().shape({
    kind: yup.string().equals([PAGES_MODULE_KINDS.MEDIA]),
    name: yup.string().required(T.translate("validation.required")),
    type: yup.string().required(T.translate("validation.required")),
    upload_deadline: yup.date().required(T.translate("validation.required")),
    description: yup.string().required(T.translate("validation.required")),
    max_file_size: yup.number().when("type", {
      is: PAGE_MODULES_MEDIA_TYPES.FILE,
      then: (schema) =>
        schema
          .min(BYTES_PER_MB, T.translate("validation.number_positive"))
          .required(T.translate("validation.required"))
          .test(
            "mib-aligned",
            T.translate("validation.mib_aligned"),
            (value) => value == null || value % BYTES_PER_MB === 0
          ),
      otherwise: (schema) => schema.nullable()
    }),
    file_type_id: yup.object().when("type", {
      is: PAGE_MODULES_MEDIA_TYPES.FILE,
      then: (schema) => schema.required(T.translate("validation.required")),
      otherwise: (schema) => schema.nullable()
    })
  });

  const moduleSchema = yup.lazy((value) => {
    switch (value?.kind) {
      case PAGES_MODULE_KINDS.INFO:
        return infoModuleSchema;
      case PAGES_MODULE_KINDS.DOCUMENT:
        return documentModuleSchema;
      case PAGES_MODULE_KINDS.MEDIA:
        return mediaModuleSchema;
      default:
        return yup.object();
    }
  });

  const formik = useFormik({
    initialValues: {
      ...pageTemplate,
      modules: normalizeModules(pageTemplate?.modules, summitTZ) || []
    },
    validationSchema: yup.object().shape({
      code: yup.string().required(T.translate("validation.required")),
      name: yup.string().required(T.translate("validation.required")),
      modules: yup.array().of(moduleSchema)
    }),
    enableReinitialize: true,
    onSubmit: (values) => {
      const modulesWithOrder = values.modules.map((m, idx) => ({
        ...m,
        custom_order: idx
      }));
      onSave({ ...values, modules: modulesWithOrder });
    }
  });

  return (
    <Dialog open onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography fontSize="1.5rem">
          {T.translate("page_template_list.page_crud.title")}
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
              <Grid2 spacing={2} size={4}>
                <MuiFormikTextField
                  name="code"
                  label={T.translate("page_template_list.code")}
                  fullWidth
                />
              </Grid2>
              <Grid2 spacing={2} size={showSponsorships ? COLUMN_4 : COLUMN_8}>
                <MuiFormikTextField
                  name="name"
                  label={T.translate("page_template_list.name")}
                  fullWidth
                />
              </Grid2>
              {showSponsorships && (
                <Grid2 spacing={2} size={4}>
                  <DropdownCheckbox
                    name="sponsorship_types"
                    label={T.translate("page_template_list.sponsorship")}
                    allLabel={T.translate("page_template_list.all_tiers")}
                    value={formik.values.sponsorship_types}
                    options={sponsorships}
                    onChange={formik.handleChange}
                  />
                </Grid2>
              )}
            </Grid2>
            <Divider gutterBottom />
            <Grid2 container spacing={2} size={12} sx={{ p: 2 }}>
              <Grid2 spacing={2} size={4}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleAddInfo()}
                  startIcon={<AddIcon />}
                >
                  {T.translate("page_template_list.page_crud.add_info")}
                </Button>
              </Grid2>
              <Grid2 spacing={2} size={4}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleAddDocument()}
                  startIcon={<AddIcon />}
                >
                  {T.translate("page_template_list.page_crud.add_doc")}
                </Button>
              </Grid2>
              <Grid2 spacing={2} size={4}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleAddMedia()}
                  startIcon={<AddIcon />}
                >
                  {T.translate("page_template_list.page_crud.add_media")}
                </Button>
              </Grid2>
            </Grid2>
            <Divider gutterBottom />
            <Box sx={{ py: 2 }}>
              <PageModules name="modules" />
            </Box>
          </DialogContent>
          <Divider />
          <DialogActions>
            <Button type="submit" fullWidth variant="contained">
              {T.translate("page_template_list.page_crud.save")}
            </Button>
          </DialogActions>
        </Box>
      </FormikProvider>
    </Dialog>
  );
};

PageTemplatePopup.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  summitTZ: PropTypes.string,
  sponsorships: PropTypes.array
};

export default PageTemplatePopup;
