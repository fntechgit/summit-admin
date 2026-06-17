import React, { useRef, useEffect, useState } from "react";
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
import { connect } from "react-redux";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import DragAndDropList from "../../../../components/mui/dnd-list";
import showConfirmDialog from "../../../../components/mui/showConfirmDialog";
import {
  DEBOUNCE_WAIT_150,
  PAGES_MODULE_KINDS
} from "../../../../utils/constants";
import InfoModule from "./modules/page-template-info-module";
import DocumentDownloadModule from "./modules/page-template-document-download-module";
import MediaRequestModule from "./modules/page-template-media-request-module";
import { getAllMediaFileTypes } from "../../../../actions/media-file-type-actions";

const PageModules = ({ name = "modules", getAllMediaFileTypes, isGlobal }) => {
  const { values, setFieldValue, errors, submitCount } = useFormikContext();
  const modules = getIn(values, name) || [];
  const moduleErrors = getIn(errors, name);

  const bottomRef = useRef(null);
  const prevModulesLength = useRef(modules.length);
  const moduleRefMap = useRef(new Map());

  const [collapsedModules, setCollapsedModules] = useState(new Set());

  const getModuleId = (module) => module._tempId || module.id;

  // auto-scroll to new module
  useEffect(() => {
    if (modules.length > prevModulesLength.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevModulesLength.current = modules.length;
  }, [modules.length]);

  // on submit with errors, expand collapsed modules that have errors and scroll to the first
  useEffect(() => {
    if (submitCount === 0 || !Array.isArray(moduleErrors)) return;

    const errorIds = moduleErrors
      .map((err, i) => err && getModuleId(modules[i]))
      .filter(Boolean);

    if (errorIds.length === 0) return;

    setCollapsedModules((prev) => {
      const next = new Set(prev);
      errorIds.forEach((id) => next.delete(id));
      return next;
    });

    setTimeout(() => {
      moduleRefMap.current
        .get(errorIds[0])
        ?.scrollIntoView({ behavior: "smooth" });
    }, DEBOUNCE_WAIT_150);
  }, [submitCount]);

  useEffect(() => {
    getAllMediaFileTypes();
  }, []);

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
      confirmButtonColor: "error",
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

  const handleToggle = (moduleId) => (_, isExpanded) => {
    setCollapsedModules((prev) => {
      const next = new Set(prev);
      if (isExpanded) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const renderModuleFields = (module, index) => {
    switch (module.kind) {
      case PAGES_MODULE_KINDS.INFO:
        return <InfoModule baseName={name} index={index} />;
      case PAGES_MODULE_KINDS.DOCUMENT:
        return <DocumentDownloadModule baseName={name} index={index} />;
      case PAGES_MODULE_KINDS.MEDIA:
        return (
          <MediaRequestModule
            baseName={name}
            index={index}
            isGlobal={isGlobal}
          />
        );
      default:
        return null;
    }
  };

  const renderModule = (module, index) => (
    <Accordion
      expanded={!collapsedModules.has(getModuleId(module))}
      onChange={handleToggle(getModuleId(module))}
      ref={(el) => {
        moduleRefMap.current.set(getModuleId(module), el);
      }}
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
              data-testid="delete-module-btn"
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
  name: PropTypes.string,
  isGlobal: PropTypes.bool
};

const mapStateToProps = () => ({});

export default connect(mapStateToProps, { getAllMediaFileTypes })(PageModules);
