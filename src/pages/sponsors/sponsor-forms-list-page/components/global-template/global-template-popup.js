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
    cloneGlobalTemplate(selectedTemplates, selectedTiers, allTiers).finally(
      () => {
        handleClose();
      }
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth={dialogSize} fullWidth>
      {stage === "templates" && (
        <SelectTemplatesDialog
          onSave={handleOnSelectTemplates}
          onClose={handleClose}
        />
      )}
      {stage === "sponsorships" && (
        <SelectSponsorshipsDialog onSave={handleOnSave} onClose={handleClose} />
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
