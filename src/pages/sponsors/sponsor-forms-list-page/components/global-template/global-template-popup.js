import React, { useState } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Dialog } from "@mui/material";
import SelectTemplatesDialog from "./select-templates-dialog";
import SelectSponsorshipsDialog from "./select-sponsorships-dialog";
import { cloneGlobalTemplate } from "../../../../../actions/sponsor-forms-actions";

const GlobalTemplatePopup = ({ open, onClose, cloneGlobalTemplate }) => {
  const [stage, setStage] = useState("templates");
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const dialogSize = stage === "templates" ? "md" : "sm";

  const handleClose = () => {
    setSelectedTemplates([]);
    setStage("templates");
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
        handleClose();
      })
      .catch(() => {
        // keep dialog open on save error to preserve user progress
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth={dialogSize} fullWidth>
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
