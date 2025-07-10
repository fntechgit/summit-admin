import React, { useState, useEffect } from "react";
import { Checkbox, FormControlLabel, FormGroup, Box, Divider } from "@mui/material";

const CheckBoxList = ({ items = [], loadMoreData, boxHeight = "400px" }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [isAllSelected, setIsAllSelected] = useState(false);

  const handleScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target;
    // eslint-disable-next-line no-magic-numbers
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      loadMoreData();
    }
  };

  useEffect(() => {
    // Update the "All Tiers" checkbox if all items are selected
    setIsAllSelected(items.length > 0 && items.every((item) => selectedItems.includes(item.id)));
  }, [selectedItems, items]);

  const handleItemChange = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter((id) => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const handleAllChange = () => {
    if (isAllSelected) {
      setSelectedItems([]); // Deselect all items
    } else {
      setSelectedItems(items.map((item) => item.id)); // Select all items
    }
    setIsAllSelected(!isAllSelected);
  };

  return (
    <Box sx={{ width: "100%", height: boxHeight, overflow: "auto", border: "1px solid #ccc", padding: 2 }} onScroll={handleScroll}>
      <FormGroup>
        <FormControlLabel
          control={<Checkbox checked={isAllSelected} onChange={handleAllChange} />}
          label="All Tiers"
        />
        <Divider />
        {items.map((item) => (
          <FormControlLabel
            key={item.id}
            control={
              <Checkbox
                checked={selectedItems.includes(item.id)}
                onChange={() => handleItemChange(item.id)}
              />
            }
            label={item.name}
          />
        ))}
      </FormGroup>
    </Box>
  );
};

export default CheckBoxList;