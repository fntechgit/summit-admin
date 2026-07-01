import React from "react";
import { Box, Link as MuiLink, Stack, Typography } from "@mui/material";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import DownloadIcon from "@mui/icons-material/Download";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import T from "i18n-react/dist/i18n-react";
import { htmlToPlainText, isImageUrl } from "../../../utils/methods";

// Renders a collected asset row's content: image thumbnail, file download link,
// plain text (HTML flattened), or a "pending upload" placeholder when nothing is provided.
const ContentCell = ({ row }) => {
  const url =
    row.content?.preview_url || row.actions?.single_download_url || null;
  const filename = row.content?.filename || "";
  const text = htmlToPlainText(
    row.content?.value || row.content?.summary || filename
  );
  const isImage = !!url && isImageUrl(filename || url);

  if (url && isImage) {
    return (
      <Box
        component="img"
        src={url}
        alt={row.module?.title}
        sx={{
          width: "100%",
          height: 120,
          objectFit: "contain",
          borderRadius: 1,
          bgcolor: "grey.50"
        }}
      />
    );
  }
  if (url) {
    return (
      <MuiLink
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}
      >
        <InsertDriveFileOutlinedIcon
          fontSize="small"
          sx={{ flexShrink: 0, mt: 0.25 }}
        />
        <Typography
          variant="body2"
          title={filename}
          sx={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}
        >
          {filename || row.module?.title}
        </Typography>
        <DownloadIcon fontSize="small" sx={{ flexShrink: 0, mt: 0.25 }} />
      </MuiLink>
    );
  }
  if (text) {
    return (
      <Typography variant="body2" noWrap title={text}>
        {text}
      </Typography>
    );
  }
  return (
    <Stack
      alignItems="center"
      spacing={0.5}
      sx={{ color: "text.disabled", py: 2 }}
    >
      <ImageOutlinedIcon />
      <Typography variant="caption">
        {T.translate("sponsor_reports_page.pending_upload")}
      </Typography>
    </Stack>
  );
};

export default ContentCell;
