import React, { useState } from "react";
import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  Box,
  Divider
} from "@mui/material";

const CheckBoxList = ({
  items = [],
  onChange,
  loadMoreData,
  boxHeight = "400px",
  allItemsLabel = "Select All",
  noItemsLabel = "No items found"
}) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const allItemIds = items.map((item) => item.id);

  const handleScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target;
    // eslint-disable-next-line no-magic-numbers
    if (scrollTop + clientHeight >= scrollHeight - 20 && loadMoreData) {
      loadMoreData();
    }
  };

  const handleItemChange = (itemId) => {
    let selected = [];
    if (isAllSelected) {
      selected = allItemIds.filter((id) => id !== itemId);
    } else if (selectedItems.includes(itemId)) {
      selected = selectedItems.filter((id) => id !== itemId);
    } else {
      selected = [...selectedItems, itemId];
    }

    setSelectedItems(selected);
    // if user selects an item, then allSelected should be unchecked
    setIsAllSelected(false);
    onChange(selected);
  };

  const handleAllChange = () => {
    // if user selects all, we should remove all other selections
    setSelectedItems([]);
    setIsAllSelected(!isAllSelected);
    onChange([], !isAllSelected);
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: boxHeight,
        overflow: "auto",
        border: "1px solid #ccc",
        padding: 2
      }}
      onScroll={handleScroll}
    >
      {items.length === 0 ? (
        <p>{noItemsLabel}</p>
      ) : (
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox checked={isAllSelected} onChange={handleAllChange} />
            }
            label={allItemsLabel}
          />
          <Divider sx={{ mb: 2 }} />
          {items.map((item) => (
            <FormControlLabel
              key={item.id}
              control={
                <Checkbox
                  checked={selectedItems.includes(item.id) || isAllSelected}
                  onChange={() => handleItemChange(item.id)}
                />
              }
              label={item.name}
            />
          ))}
        </FormGroup>
      )}
    </Box>
  );
};

export default CheckBoxList;
