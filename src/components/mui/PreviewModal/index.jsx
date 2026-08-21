import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { Box, Typography } from "@mui/material";
import CustomDialog from "openstack-uicore-foundation/lib/components/mui/custom-dialog";
import BrokenImageOutlinedIcon from "@mui/icons-material/BrokenImageOutlined";
import { formatDate } from "../../../utils/methods";

const BrokenImage = () => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: 200
    }}
  >
    <BrokenImageOutlinedIcon sx={{ fontSize: 56, color: "grey.200" }} />
  </Box>
);

const PreviewModal = ({ title, open, onClose, url, filename, uploadDate }) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (open) setImageError(false);
  }, [open]);

  return (
    <CustomDialog title={title} open={open} onClose={onClose}>
      <Box
        sx={{
          mx: "-24px",
          mt: "-20px",
          mb: 2,
          bgcolor: "grey.400",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 200
        }}
      >
        {!url || imageError ? (
          <BrokenImage />
        ) : (
          <Box
            component="img"
            src={url}
            alt={filename}
            onError={() => setImageError(true)}
            sx={{
              maxWidth: "100%",
              maxHeight: 400,
              display: "block",
              objectFit: "contain"
            }}
          />
        )}
      </Box>
      {filename && (
        <Box sx={{ display: "flex", gap: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 80 }}>
            {T.translate("preview_modal.file_name")}
          </Typography>
          <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
            {filename}
          </Typography>
        </Box>
      )}
      {!!uploadDate && (
        <Box sx={{ display: "flex", gap: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 80 }}>
            {T.translate("preview_modal.uploaded")}
          </Typography>
          <Typography variant="body2">{formatDate(uploadDate)}</Typography>
        </Box>
      )}
    </CustomDialog>
  );
};

PreviewModal.propTypes = {
  title: PropTypes.string.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  url: PropTypes.string,
  filename: PropTypes.string,
  uploadDate: PropTypes.number
};

PreviewModal.defaultProps = {
  url: null,
  filename: "",
  uploadDate: 0
};

export default PreviewModal;
