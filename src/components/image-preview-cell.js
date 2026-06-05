/**
 * Copyright 2026 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * */

import React, { useState } from "react";
import IconButton from "@mui/material/IconButton";
import ImageIcon from "@mui/icons-material/Image";
import T from "i18n-react/dist/i18n-react";
import PreviewModal from "./mui/PreviewModal";

export const ImagePreviewCell = React.memo(
  ({ imageUrl, itemName, fileName, uploadDate }) => {
    const [open, setOpen] = useState(false);

    if (!imageUrl) return null;

    const resolvedFileName =
      fileName || decodeURIComponent(imageUrl.split("/").pop().split("?")[0]);

    return (
      <>
        <IconButton
          size="small"
          aria-label={T.translate("preview_modal.title")}
          onClick={() => setOpen(true)}
        >
          <ImageIcon fontSize="small" />
        </IconButton>

        <PreviewModal
          title={itemName || T.translate("preview_modal.title")}
          open={open}
          onClose={() => setOpen(false)}
          url={imageUrl}
          filename={resolvedFileName}
          uploadDate={uploadDate}
        />
      </>
    );
  }
);

ImagePreviewCell.displayName = "ImagePreviewCell";
