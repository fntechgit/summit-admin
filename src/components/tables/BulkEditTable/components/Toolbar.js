import React from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

const Toolbar = ({ editEnabled, hasSelection, onEdit, onApply, onCancel }) => (
  <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
    {editEnabled ? (
      <>
        <Button variant="contained" onClick={onApply}>
          {T.translate("bulk_actions_page.btn_apply_changes")}
        </Button>
        <Button variant="outlined" onClick={onCancel}>
          {T.translate("general.cancel")}
        </Button>
      </>
    ) : (
      <Button variant="contained" onClick={onEdit} disabled={!hasSelection}>
        {T.translate("event_list.edit_selected")}
      </Button>
    )}
  </Box>
);

Toolbar.propTypes = {
  editEnabled: PropTypes.bool,
  hasSelection: PropTypes.bool,
  onEdit: PropTypes.func,
  onApply: PropTypes.func,
  onCancel: PropTypes.func
};

export default Toolbar;
