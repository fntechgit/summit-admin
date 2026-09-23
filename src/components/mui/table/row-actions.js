import React, { useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import MoreVertIcon from "@mui/icons-material/MoreVert";

const actionShape = {
  key: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

/**
 * The action group rendered in a row's trailing cell.
 *
 * Routine actions stay inline as icon buttons; destructive ones move into the
 * overflow menu, where they get a text label and error color instead of a bare
 * glyph sitting next to Edit. Same split MUI X Data Grid expresses with
 * `showInMenu` on `GridActionsCellItem`.
 */
const RowActions = ({ rowId, inlineActions, menuActions }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const triggerId = `row-actions-trigger-${rowId}`;
  const menuId = `row-actions-menu-${rowId}`;

  const handleClose = () => setAnchorEl(null);

  const handleMenuItemClick = (action) => {
    handleClose();
    action.onClick();
  };

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 0.5
      }}
    >
      {inlineActions.map(({ key, label, icon: Icon, onClick, disabled }) => (
        <Tooltip key={key} title={label}>
          <span>
            <IconButton
              size="medium"
              onClick={onClick}
              disabled={disabled}
              aria-label={label}
              data-testid={`action-${key}`}
            >
              <Icon fontSize="medium" />
            </IconButton>
          </span>
        </Tooltip>
      ))}
      {menuActions.length > 0 && (
        <>
          <Tooltip title={T.translate("general.more_actions")}>
            <IconButton
              id={triggerId}
              size="medium"
              onClick={(ev) => setAnchorEl(ev.currentTarget)}
              aria-label={T.translate("general.more_actions")}
              aria-haspopup="true"
              aria-controls={anchorEl ? menuId : undefined}
              aria-expanded={anchorEl ? "true" : undefined}
              data-testid="row-actions-menu-trigger"
            >
              <MoreVertIcon fontSize="medium" />
            </IconButton>
          </Tooltip>
          <Menu
            id={menuId}
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            MenuListProps={{ "aria-labelledby": triggerId }}
          >
            {menuActions.map((action) => (
              <MenuItem
                key={action.key}
                onClick={() => handleMenuItemClick(action)}
                disabled={action.disabled}
                data-testid={`action-${action.key}`}
                sx={action.destructive ? { color: "error.main" } : undefined}
              >
                {action.label}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
    </Box>
  );
};

RowActions.propTypes = {
  rowId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  inlineActions: PropTypes.arrayOf(
    PropTypes.shape({ ...actionShape, icon: PropTypes.elementType.isRequired })
  ),
  menuActions: PropTypes.arrayOf(
    PropTypes.shape({ ...actionShape, destructive: PropTypes.bool })
  )
};

RowActions.defaultProps = {
  inlineActions: [],
  menuActions: []
};

export default RowActions;
