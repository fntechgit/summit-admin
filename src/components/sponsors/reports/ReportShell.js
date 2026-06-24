import React from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import "./report-print.css";

// Header card (tinted icon square + title/subtitle + action slot) / filter slot / body slot.
const ReportShell = ({
  title,
  subtitle,
  actions,
  filterBar,
  icon,
  iconTone = "primary",
  children
}) => (
  <Box sx={{ p: 3 }}>
    <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
        sx={{ flexWrap: "wrap" }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          {icon && (
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: `${iconTone}.light`,
                color: `${iconTone}.dark`
              }}
            >
              {icon}
            </Box>
          )}
          <Box>
            <Typography variant="h5">{title}</Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
        {actions && (
          <Stack direction="row" spacing={1}>
            {actions}
          </Stack>
        )}
      </Stack>
    </Paper>
    {filterBar && <Box sx={{ mb: 2 }}>{filterBar}</Box>}
    <Box className="report-body">{children}</Box>
  </Box>
);

export default ReportShell;
