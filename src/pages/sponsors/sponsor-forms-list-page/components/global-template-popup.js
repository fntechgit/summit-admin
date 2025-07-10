import React, { useState } from "react";
import PropTypes from "prop-types";
import { Dialog } from "@mui/material";
import SelectTemplatesDialog from "./select-templates-dialog";
import SelectSponsorshipsDialog from "./select-sponsorships-dialog";

const GlobalTemplatePopup = ({ open, onClose }) => {
  const [stage, setStage] = useState("templates");
  const [selectedTemplates, setSelectedTemplates] = useState([]);

  const handleClose = () => {
    setSelectedTemplates([]);
    onClose();
  }

  const handleOnSelectTemplates = (templates) => {
    setSelectedTemplates(templates);
    setStage("sponsorships");
  }

  const handleOnSave = (selectedTiers, allTiers) => {
    console.log(selectedTemplates, selectedTiers, allTiers);
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      {stage === "templates" &&
      <SelectTemplatesDialog onSave={handleOnSelectTemplates} onClose={handleClose} />
      }
      {stage === "sponsorships" &&
        <SelectSponsorshipsDialog onSave={handleOnSave} onClose={handleClose} />
      }
    </Dialog>
  );
};

GlobalTemplatePopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default GlobalTemplatePopup;
