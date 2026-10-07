import React from "react";
import PropTypes from "prop-types";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import T from "i18n-react/dist/i18n-react";

const ACTIVE = "active";
const ARCHIVED = "archived";

// segmented control: a grid shows either its active or its archived rows, never both
const ArchiveToggle = ({ showArchived, onChange }) => (
  <ToggleButtonGroup
    exclusive
    color="primary"
    value={showArchived ? ARCHIVED : ACTIVE}
    // MUI sends null when the selected segment is clicked again; keep the current view
    onChange={(_, value) => value && onChange(value === ARCHIVED)}
    sx={{ whiteSpace: "nowrap" }}
  >
    <ToggleButton value={ACTIVE}>{T.translate("general.active")}</ToggleButton>
    <ToggleButton value={ARCHIVED}>
      {T.translate("general.archived")}
    </ToggleButton>
  </ToggleButtonGroup>
);

ArchiveToggle.propTypes = {
  showArchived: PropTypes.bool,
  onChange: PropTypes.func.isRequired
};

ArchiveToggle.defaultProps = {
  showArchived: false
};

export default ArchiveToggle;
