import React, { useRef, useEffect } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { useFormikContext, getIn } from "formik";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  IconButton,
  Typography
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import DragAndDropList from "../../../../components/mui/dnd-list";
import showConfirmDialog from "../../../../components/mui/showConfirmDialog";
import { PAGES_MODULE_KINDS } from "../../../../utils/constants";
import InfoModule from "./modules/page-template-info-module";
import DocumentDownloadModule from "./modules/page-template-document-download-module";
import MediaRequestModule from "./modules/page-template-media-request-module";

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
      key={module._tempId || `module-${index}`}
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
              aria-label={T.translate("general.delete")}
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
