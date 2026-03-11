import React, { useState } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Dialog } from "@mui/material";
import { cloneGlobalTemplate } from "../../../../../actions/sponsor-forms-actions";
import SelectTemplatesDialog from "./select-templates-dialog";
import SelectSponsorshipsDialog from "./select-sponsorships-dialog";

const GlobalTemplatePopup = ({ open, onClose, cloneGlobalTemplate }) => {
  const [stage, setStage] = useState("templates");
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const dialogSize = stage === "templates" ? "md" : "sm";

  const handleClose = () => {
    if (isSaving) return;
    setSelectedTemplates([]);
    setStage("templates");
    onClose();
  };

  const handleDismiss = () => {
    if (isSaving) return;
    onClose();
  };

  const handleOnSelectTemplates = (templates) => {
    setSelectedTemplates(templates);
    setStage("sponsorships");
  };

  const handleOnSave = (selectedTiers, allTiers) => {
    if (isSaving) return;

    setIsSaving(true);

    cloneGlobalTemplate(selectedTemplates, selectedTiers, allTiers)
      .then(() => {
        setSelectedTemplates([]);
        setStage("templates");
        onClose();
      })
      .catch(() => {
        // keep dialog open on save error to preserve user progress
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <Dialog
      open={open}
      onClose={handleDismiss}
      maxWidth={dialogSize}
      fullWidth
      disableEscapeKeyDown={isSaving}
    >
      {stage === "templates" && (
        <SelectTemplatesDialog
          onSave={handleOnSelectTemplates}
          onClose={handleClose}
        />
      )}
      {stage === "sponsorships" && (
        <SelectSponsorshipsDialog
          onSave={handleOnSave}
          onClose={handleClose}
          isSaving={isSaving}
        />
      )}
    </Dialog>
  );
};

GlobalTemplatePopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

const mapStateToProps = () => ({});

export default connect(mapStateToProps, {
  cloneGlobalTemplate
})(GlobalTemplatePopup);
