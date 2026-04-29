import React from "react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

const InfoNote = ({ message, sx }) => (
  <Box display="flex" alignItems="flex-start" gap={1} sx={sx}>
    <InfoOutlinedIcon
      sx={{ fontSize: 16, color: "text.secondary", mt: "2px" }}
    />
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

export default InfoNote;
