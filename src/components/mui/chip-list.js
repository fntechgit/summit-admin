import React from "react";
import { Box, Chip, Tooltip, Typography } from "@mui/material";

const ChipList = ({ chips, maxLength }) => {
  const shownItems = chips.slice(0, maxLength);
  const rest = chips.slice(maxLength);

  return (
    <Box>
      {shownItems.map((chip) => (
        <Chip label={chip} size="small" sx={{mr: 1}} />
      ))}
      {rest.length > 0 && (
        <Tooltip title={rest.map(r => <Typography variant="body1" component="div">{r}</Typography>)} arrow>
          <Chip label="..." size="small" sx={{cursor: "pointer"}} />
        </Tooltip>
      )}
    </Box>
  );
};

export default ChipList;
