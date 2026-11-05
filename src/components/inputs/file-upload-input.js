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

import React from "react";
import PropTypes from "prop-types";
import UploadInputV3 from "openstack-uicore-foundation/lib/components/inputs/upload-input-v3";
import UploadInputV4 from "openstack-uicore-foundation/lib/components/inputs/upload-input-v4";

// FILE_UPLOAD_USE_V4 selects direct-to-storage uploads. It is baked in at
// build time: set it to anything but "true" and rebuild to roll back to the
// chunked pipeline.
const FileUploadInput = ({ parallelChunkUploads, ...rest }) => {
  if (window.FILE_UPLOAD_USE_V4 === "true") {
    return (
      <UploadInputV4
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...rest}
        postUrl={`${window.FILE_UPLOAD_API_BASE_URL}/api/v1/files`}
      />
    );
  }

  return (
    <UploadInputV3
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...rest}
      postUrl={`${window.FILE_UPLOAD_API_BASE_URL}/api/v1/files/upload`}
      djsConfig={{ withCredentials: true }}
      parallelChunkUploads={parallelChunkUploads}
    />
  );
};

FileUploadInput.propTypes = {
  parallelChunkUploads: PropTypes.bool
};

FileUploadInput.defaultProps = {
  parallelChunkUploads: false
};

export default FileUploadInput;
