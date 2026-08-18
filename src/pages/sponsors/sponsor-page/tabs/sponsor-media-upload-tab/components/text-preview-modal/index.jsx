import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  Typography
} from "@mui/material";
import CustomDialog from "openstack-uicore-foundation/lib/components/mui/custom-dialog";
import { MILLISECONDS_IN_SECOND } from "../../../../../../../utils/constants";

const TextPreviewModal = ({ title, open, onClose, value }) => {
  const [copyLabel, setCopyLabel] = useState(
    T.translate("general.copy_to_clipboard")
  );

  useEffect(() => {
    if (open) {
      setCopyLabel(T.translate("general.copy_to_clipboard"));
    }
  }, [open]);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopyLabel(T.translate("general.copied"));
    setTimeout(() => {
      setCopyLabel(T.translate("general.copy_to_clipboard"));
    }, MILLISECONDS_IN_SECOND);
  };

  return (
    <CustomDialog title={title} open={open} onClose={onClose}>
      <DialogContent>
        <Box
          sx={{
            minHeight: 200,
            p: 2,
            border: "1px solid",
            borderColor: "grey.300",
            borderRadius: 1
          }}
        >
          <Typography
            variant="body2"
            sx={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word"
            }}
          >
            {value}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCopy} fullWidth variant="contained">
          {copyLabel}
        </Button>
      </DialogActions>
    </CustomDialog>
  );
};

TextPreviewModal.propTypes = {
  title: PropTypes.string.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  value: PropTypes.string
};

TextPreviewModal.defaultProps = {
  value: ""
};

export default TextPreviewModal;
