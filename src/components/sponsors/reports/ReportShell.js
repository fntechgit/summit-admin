import React from "react";
import { Box, GlobalStyles, Paper, Stack, Typography } from "@mui/material";

// Whole-page print isolation: hide everything, then reveal only the report body.
// MUI GlobalStyles replaces a standalone .css file (legacy in summit-admin).
const printStyles = (
  <GlobalStyles
    styles={{
      "@media print": {
        "body *": { visibility: "hidden" },
        ".report-body, .report-body *": { visibility: "visible" },
        ".report-body": { position: "absolute", left: 0, top: 0, width: "100%" }
      }
    }}
  />
);

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
    {printStyles}
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
                // White glyph to match the sponsor avatars on the same tint.
                color: "common.white"
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
