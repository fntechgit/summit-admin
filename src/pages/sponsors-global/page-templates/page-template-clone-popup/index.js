import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Dialog } from "@mui/material";
import SelectPageTemplateDialog from "../../../../components/select-page-template-dialog";
import { clonePageTemplate } from "../../../../actions/page-template-actions";

const PageTemplateClonePopup = ({ open, onClose, clonePageTemplate }) => {
  const handleOnSave = (template) => {
    clonePageTemplate(template).finally(() => {
      onClose();
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <SelectPageTemplateDialog onSave={handleOnSave} onClose={onClose} />
    </Dialog>
  );
};

PageTemplateClonePopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

const mapStateToProps = () => ({});

export default connect(mapStateToProps, {
  clonePageTemplate
})(PageTemplateClonePopup);
