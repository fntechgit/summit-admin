/**
 * Copyright 2019 OpenStack Foundation
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

import React, { useEffect, useState } from "react";
import T from "i18n-react/dist/i18n-react";
import Dropdown from "openstack-uicore-foundation/lib/components/inputs/dropdown";
import { getAllMediaUploadTypes } from "../../../actions/media-upload-actions";

const MediaTypeFilter = ({ onChange, filterInitialValue, id, summitId }) => {
  const [mediaTypes, setMediaTypes] = useState([]);

  useEffect(() => {
    getAllMediaUploadTypes(summitId).then((types) =>
      setMediaTypes(types || [])
    );
  }, [summitId]);

  const options = mediaTypes.map((mediaType) => ({
    label: mediaType.name,
    value: mediaType.id
  }));

  const value = (filterInitialValue || []).map((mediaType) => mediaType.id);

  const handleChange = (ev) => {
    const selectedIds = ev.target.value || [];
    const selectedTypes = mediaTypes.filter((mediaType) =>
      selectedIds.includes(mediaType.id)
    );

    onChange({
      target: {
        id,
        value: selectedTypes,
        type: "mediatypeinput",
        operator:
          selectedTypes.length > 0 ? "has_media_upload_with_type==" : null
      }
    });
  };

  return (
    <Dropdown
      id={id}
      value={value}
      onChange={handleChange}
      options={options}
      isClearable
      isMulti
      placeholder={T.translate("media_upload_type_filter.media_type")}
    />
  );
};

export default MediaTypeFilter;
