import React, { useState } from "react";
import PropTypes from "prop-types";
import { Badge, Button, Menu, MenuItem } from "@mui/material";

const MenuButton = ({
  buttonId,
  menuId,
  menuItems,
  hasBadge,
  children,
  ...rest
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);

  const handleButtonClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleOptionClick = (item) => {
    if (hasBadge) {
      const newOptions = selectedItems.includes(item.label)
        ? selectedItems.filter((key) => key !== item.label)
        : [...selectedItems, item.label];
      item.onClick();
      setSelectedItems(newOptions);
    }
    item.onClick();
    handleClose();
  };

  const badgeCount = hasBadge ? selectedItems.length : undefined;

  return (
    <>
      <Button
        id={buttonId}
        aria-controls={anchorEl ? menuId : undefined}
        aria-haspopup="true"
        aria-expanded={anchorEl ? "true" : undefined}
        onClick={handleButtonClick}
        sx={{ color: anchorEl ? "--variant-textColor" : "#000" }}
        {...rest}
      >
        {hasBadge ? (
          <Badge
            badgeContent={badgeCount}
            sx={{
              "& .MuiBadge-badge": {
                backgroundColor: "black",
                color: "white",
                right: "65%"
              }
            }}
          >
            {children}
          </Badge>
        ) : (
          children
        )}
      </Button>
      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": buttonId
        }}
        slotProps={{
          paper: {
            sx: { minWidth: 220 }
          }
        }}
      >
        {menuItems.map((item) => {
          const isSelected = hasBadge && selectedItems.includes(item.label);
          return (
            <MenuItem
              key={`${item.label}`}
              onClick={() => handleOptionClick(item)}
              sx={{
                borderBottom: 1,
                borderColor: "divider",
                "&:last-of-type": { borderBottom: 0 },
                color: isSelected ? "--variant-textColor" : "#000"
              }}
            >
              {item.label}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

MenuButton.propTypes = {
  buttonId: PropTypes.string,
  menuId: PropTypes.string,
  menuItems: PropTypes.array.isRequired,
  hasBadge: PropTypes.bool
};

export default MenuButton;
