import React, { useState } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Dialog } from "@mui/material";
import SelectPageTemplateDialog from "../../../../../components/select-page-template-dialog";
import SelectSponsorshipsDialog from "../../../sponsor-forms-list-page/components/global-template/select-sponsorships-dialog";
import {
  cloneGlobalPage,
  getSponsorPages
} from "../../../../../actions/sponsor-pages-actions";

const GlobalPagePopup = ({
  open,
  onClose,
  cloneGlobalPage,
  getSponsorPages
}) => {
  const [stage, setStage] = useState("pages");
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const dialogSize = stage === "pages" ? "md" : "sm";

  const handleClose = () => {
    setSelectedTemplates([]);
    setStage("pages");
    onClose();
  };

  const handleOnSelectTemplates = (templates) => {
    setSelectedTemplates(templates);
    setStage("sponsorships");
  };

  const handleOnSave = (selectedTiers, allTiers) => {
    cloneGlobalPage(selectedTemplates, selectedTiers, allTiers).finally(() => {
      getSponsorPages();
      handleClose();
    });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth={dialogSize} fullWidth>
      {stage === "pages" && (
        <SelectPageTemplateDialog
          onSave={handleOnSelectTemplates}
          onClose={handleClose}
          isMulti
        />
      )}
      {stage === "sponsorships" && (
        <SelectSponsorshipsDialog onSave={handleOnSave} onClose={handleClose} />
      )}
    </Dialog>
  );
};

GlobalPagePopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

const mapStateToProps = () => ({});

export default connect(mapStateToProps, {
  cloneGlobalPage,
  getSponsorPages
})(GlobalPagePopup);
