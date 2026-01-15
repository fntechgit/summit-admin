import React, { useRef, useEffect } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { useFormikContext, getIn } from "formik";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Grid2,
  IconButton,
  Typography,
  MenuItem,
  InputLabel,
  Divider
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import MuiFormikTextField from "../../../components/mui/formik-inputs/mui-formik-textfield";
import MuiFormikSelect from "../../../components/mui/formik-inputs/mui-formik-select";
import MuiFormikDatepicker from "../../../components/mui/formik-inputs/mui-formik-datepicker";
import MuiFormikRadioGroup from "../../../components/mui/formik-inputs/mui-formik-radio-group";
import DragAndDropList from "../../../components/mui/dnd-list";
import showConfirmDialog from "../../../components/mui/showConfirmDialog";
import {
  PAGES_MODULE_KINDS,
  PAGE_MODULES_MEDIA_TYPES
} from "../../../utils/constants";
import FormikTextEditor from "../../../components/inputs/formik-text-editor";
import MuiFormikUpload from "../../../components/mui/formik-inputs/mui-formik-upload";

const InfoModule = ({ baseName, index }) => {
  const buildFieldName = (field) => `${baseName}[${index}].${field}`;

  return (
    <Grid2 container spacing={2} size={12}>
      <InputLabel htmlFor={buildFieldName("content")}>
        {T.translate("page_template_list.page_crud.info_content")}
      </InputLabel>
      <Grid2 size={12}>
        <Box width="100%">
          <FormikTextEditor
            name={buildFieldName("content")}
            fullWidth
            margin="none"
          />
        </Box>
      </Grid2>
    </Grid2>
  );
};

const DocumentDownloadModule = ({ baseName, index }) => {
  const buildFieldName = (field) => `${baseName}[${index}].${field}`;

  return (
    <Grid2 container spacing={2} size={12}>
      <InputLabel htmlFor={buildFieldName("name")}>
        {T.translate("page_template_list.page_crud.document_name")}
      </InputLabel>
      <Grid2 size={12}>
        <MuiFormikTextField
          name={buildFieldName("name")}
          fullWidth
          margin="none"
        />
      </Grid2>
      <InputLabel htmlFor={buildFieldName("description")}>
        {T.translate("page_template_list.page_crud.description")}
      </InputLabel>
      <Grid2 size={12}>
        <MuiFormikTextField
          name={buildFieldName("description")}
          fullWidth
          multiline
          rows={2}
          margin="none"
        />
      </Grid2>
      <InputLabel htmlFor={buildFieldName("external_url")}>
        {T.translate("page_template_list.page_crud.external_url")}
      </InputLabel>
      <Grid2 size={12}>
        <MuiFormikTextField
          name={buildFieldName("external_url")}
          placeholder="Link"
          fullWidth
          margin="none"
        />
      </Grid2>
      <Grid2 size={12}>
        <MuiFormikUpload
          id="document-module-upload"
          name={buildFieldName("file")}
          singleFile
        />
      </Grid2>
    </Grid2>
  );
};

const MediaRequestModule = ({ baseName, index }) => {
  const { values } = useFormikContext();
  const buildFieldName = (field) => `${baseName}[${index}].${field}`;

  const mediaType =
    getIn(values, buildFieldName("type")) || PAGE_MODULES_MEDIA_TYPES.FILE;

  const mediaTypeOptions = [
    {
      value: PAGE_MODULES_MEDIA_TYPES.FILE,
      label: T.translate("page_template_list.page_crud.upload_file")
    },
    {
      value: PAGE_MODULES_MEDIA_TYPES.TEXT,
      label: T.translate("page_template_list.page_crud.text_input")
    }
  ];

  return (
    <Grid2 container spacing={2} size={12}>
      <Grid2 size={12}>
        <MuiFormikRadioGroup
          name={buildFieldName("type")}
          options={mediaTypeOptions}
          row
          margin="none"
        />
      </Grid2>
      <Grid2 size={12}>
        <Divider sx={{ mx: -2 }} />
      </Grid2>
      <Grid2 size={6}>
        <InputLabel htmlFor={buildFieldName("name")}>
          {T.translate("page_template_list.page_crud.name")}
        </InputLabel>
        <MuiFormikTextField
          name={buildFieldName("name")}
          fullWidth
          margin="none"
        />
      </Grid2>
      <Grid2 size={6}>
        <InputLabel htmlFor={buildFieldName("upload_deadline")}>
          {T.translate("page_template_list.page_crud.upload_deadline")}
        </InputLabel>
        <MuiFormikDatepicker
          name={buildFieldName("upload_deadline")}
          margin="none"
        />
      </Grid2>

      {mediaType === PAGE_MODULES_MEDIA_TYPES.FILE && (
        <>
          <Grid2 size={6}>
            <InputLabel htmlFor={buildFieldName("max_file_size")}>
              {T.translate("page_template_list.page_crud.max_file_size")}
            </InputLabel>
            <MuiFormikTextField
              name={buildFieldName("max_file_size")}
              type="number"
              margin="none"
              fullWidth
            />
          </Grid2>
          <Grid2 size={6}>
            <InputLabel htmlFor={buildFieldName("max_file_size")}>
              {T.translate("page_template_list.page_crud.allowed_formats")}
            </InputLabel>
            <MuiFormikSelect
              name={buildFieldName("file_type_id")}
              margin="none"
              fullWidth
            >
              <MenuItem value={1}>PDF</MenuItem>
            </MuiFormikSelect>
          </Grid2>
        </>
      )}

      <Grid2 size={12}>
        <InputLabel htmlFor={buildFieldName("max_file_size")}>
          {T.translate("page_template_list.page_crud.description")}
        </InputLabel>
        <MuiFormikTextField
          name={buildFieldName("description")}
          fullWidth
          multiline
          margin="none"
          rows={2}
        />
      </Grid2>
    </Grid2>
  );
};

const PageModules = ({ name = "modules" }) => {
  const { values, setFieldValue } = useFormikContext();
  const modules = getIn(values, name) || [];

  const bottomRef = useRef(null);
  const prevModulesLength = useRef(modules.length);

  // auto-scroll to new module
  useEffect(() => {
    if (modules.length > prevModulesLength.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevModulesLength.current = modules.length;
  }, [modules.length]);

  const getModuleTitle = (kind) => {
    switch (kind) {
      case PAGES_MODULE_KINDS.INFO:
        return T.translate("page_template_list.page_crud.info_module");
      case PAGES_MODULE_KINDS.DOCUMENT:
        return T.translate("page_template_list.page_crud.document_module");
      case PAGES_MODULE_KINDS.MEDIA:
        return T.translate("page_template_list.page_crud.media_module");
      default:
        return "Module";
    }
  };

  const handleDeleteModule = async (index, module) => {
    const moduleName = getModuleTitle(module.kind);

    const isConfirmed = await showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: T.translate("page_template_list.page_crud.module_remove_warning", {
        name: moduleName
      }),
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    });

    if (isConfirmed) {
      const updated = modules.filter((_, i) => i !== index);
      setFieldValue(name, updated);
    }
  };

  const handleReorderModules = (newModules) => {
    setFieldValue(name, newModules);
  };

  const renderModuleFields = (module, index) => {
    switch (module.kind) {
      case PAGES_MODULE_KINDS.INFO:
        return <InfoModule baseName={name} index={index} />;
      case PAGES_MODULE_KINDS.DOCUMENT:
        return <DocumentDownloadModule baseName={name} index={index} />;
      case PAGES_MODULE_KINDS.MEDIA:
        return <MediaRequestModule baseName={name} index={index} />;
      default:
        return null;
    }
  };

  const renderModule = (module, index) => (
    <Accordion
      defaultExpanded
      sx={{
        mb: 1,
        "&:before": { display: "none" },
        boxShadow: "none",
        border: "1px solid #e0e0e0",
        borderRadius: "0 !important",
        "&:first-of-type": { borderRadius: 0 },
        "&:last-of-type": { borderRadius: 0 }
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          backgroundColor: "#2196F31F",
          flexDirection: "row-reverse",
          "& .MuiAccordionSummary-expandIconWrapper": {
            marginRight: 1,
            marginLeft: 0
          }
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            justifyContent: "space-between"
          }}
        >
          <Typography>{getModuleTitle(module.kind)}</Typography>

          <Box
            sx={{ display: "flex", alignItems: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <UnfoldMoreIcon
              sx={{ mr: 1, color: "action.active", cursor: "grab" }}
            />
            <IconButton
              size="small"
              onClick={() => handleDeleteModule(index, module)}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 2 }}>
        {renderModuleFields(module, index)}
      </AccordionDetails>
    </Accordion>
  );

  return (
    <Box>
      {modules.length === 0 ? (
        <Typography
          variant="body2"
          color="#00000061"
          sx={{ textAlign: "center", py: 2 }}
        >
          {T.translate("page_template_list.page_crud.no_modules")}
        </Typography>
      ) : (
        <DragAndDropList
          items={modules}
          onReorder={handleReorderModules}
          renderItem={renderModule}
          idKey="_tempId"
          updateOrderKey="custom_order"
          droppableId="modules-list"
        />
      )}
      {/* mock element to scroll to latest module */}
      <div ref={bottomRef} />
    </Box>
  );
};

PageModules.propTypes = {
  name: PropTypes.string
};

export default PageModules;
