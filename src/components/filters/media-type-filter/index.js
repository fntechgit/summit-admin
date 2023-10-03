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
 **/

import React, { useEffect, useState } from 'react'
import T from 'i18n-react/dist/i18n-react';
import MediaUploadTypeInput from '../../inputs/media-upload-type-input';
import Select from 'react-select'

import styles from './index.module.less'

const MediaTypeFilter = ({ onChange, value, id, summitId }) => {

    const [hasOrNotHasValue, setHasOrNotHasValue] = useState(value.filter === 'has_media_upload_with_type' ? { label: 'Has', value: true } : { value: 'Not Has', value: false });
    const [mediaTypeValue, setMediaTypeValue] = useState(value.value);

    const handleHasOrNotHasChange = (newValue) => {
        setHasOrNotHasValue(newValue);
        let ev = {
            target: {
                id: id,
                value: mediaTypeValue,
                type: 'mediatypeinput',
                filter: newValue.value ? 'has_media_upload_with_type' : 'has_not_media_upload_with_type'
            }
        };
        onChange(ev);
    }

    const onMediaTypeChange = (newValue) => {
        const { value } = newValue.target;
        setMediaTypeValue(value);
        let ev = {
            target: {
                id: id,
                value: value,
                type: 'mediatypeinput',
                filter: hasOrNotHasValue ? 'has_media_upload_with_type' : 'has_not_media_upload_with_type'
            }
        };
        onChange(ev);
    }

    return (
        <div className={`${styles.mediaTypeFilterWrapper} row`}>
            <div className="col-xs-3">
                {T.translate("media_upload_type_filter.media_type")}
            </div>
            <div className="col-xs-3">
                <Select
                    id="has_or_no_has_media_type"
                    value={hasOrNotHasValue}
                    placeholder={T.translate("media_upload_type_filter.placeholders.media_upload_type_has_or_not_has")}
                    options={[
                        { label: 'Has', value: true },
                        { label: 'Not Has', value: false }
                    ]}
                    onChange={handleHasOrNotHasChange}
                />
            </div>
            <div className="col-xs-6">
                <MediaUploadTypeInput
                    id="media_upload_with_type"
                    value={mediaTypeValue}
                    placeholder={T.translate(`media_upload_type_filter.placeholders.${hasOrNotHasValue?.value ? 'media_upload_type_id_to_include' : 'media_upload_type_id_to_exclude'}`)}
                    summitId={summitId}
                    onChange={onMediaTypeChange}
                />
            </div>
        </div>
    );
}

export default MediaTypeFilter;
