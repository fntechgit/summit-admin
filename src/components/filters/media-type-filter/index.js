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
import Select from "react-select";
import Dropdown from "openstack-uicore-foundation/lib/components/inputs/dropdown";

import styles from "./index.module.less";

const MediaTypeFilter = ({
  onChange,
  operatorInitialValue,
  filterInitialValue,
  id,
  summitId,
  getAllMediaUploadTypes
}) => {
  const [mediaTypes, setMediaTypes] = useState([]);

  const operatorOptions = [
    {
      label: T.translate("media_upload_type_filter.has_media_upload"),
      value: "has_media_upload_with_type=="
    },
    {
      label: T.translate("media_upload_type_filter.has_not_media_upload"),
      value: "has_not_media_upload_with_type=="
    }
  ];

  const [operatorValue, setOperatorValue] = useState(
    operatorInitialValue
      ? operatorOptions.find((o) => o.value === operatorInitialValue)
      : operatorOptions[0]
  );
  const [filterValue, setFilterValue] = useState(filterInitialValue || null);

  useEffect(() => {
    getAllMediaUploadTypes(summitId).then((types) =>
      setMediaTypes(types || [])
    );
  }, [summitId]);

  const onChangeOperator = (newOperatorValue) => {
    setOperatorValue(newOperatorValue);
    if (newOperatorValue?.value == null) return;

    const ev = {
      target: {
        id,
        value: filterValue,
        type: "mediatypeinput",
        operator: newOperatorValue?.value ?? null
      }
    };
    onChange(ev);
  };

  const onChangeFilterValue = (newFilterValue) => {
    const selectedIds = newFilterValue.target.value || [];
    const value = mediaTypes.filter((mediaType) =>
      selectedIds.includes(mediaType.id)
    );
    setFilterValue(value);
    const ev = {
      target: {
        id,
        value,
        type: "mediatypeinput",
        operator: value.length > 0 ? operatorValue?.value ?? null : null
      }
    };
    onChange(ev);
  };

  return (
    <div className={`${styles.mediaTypeFilterWrapper} row`} id={id}>
      <div className={`col-xs-5 ${styles.operatorCol}`}>
        <Select
          classNamePrefix="mediaTypeOperator"
          id={`${id}_operator`}
          value={operatorValue}
          placeholder={T.translate(
            "media_upload_type_filter.placeholders.operator"
          )}
          options={operatorOptions}
          onChange={onChangeOperator}
        />
      </div>
      <div className={`col-xs-7 ${styles.typesCol}`}>
        <Dropdown
          classNamePrefix="mediaTypeValue"
          id={`${id}_value`}
          value={(filterValue || []).map((mediaType) => mediaType.id)}
          onChange={onChangeFilterValue}
          options={mediaTypes.map((mediaType) => ({
            label: mediaType.name,
            value: mediaType.id
          }))}
          formatOptionLabel={(option) => option.label}
          isClearable
          isMulti
          placeholder={T.translate(
            `media_upload_type_filter.placeholders.${
              operatorValue?.value ?? "has_media_upload_with_type=="
            }`
          )}
        />
      </div>
    </div>
  );
};

export default MediaTypeFilter;
