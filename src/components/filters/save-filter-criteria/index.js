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

import React, { useState } from 'react'
import T from 'i18n-react/dist/i18n-react';
import { Input, RadioList } from 'openstack-uicore-foundation/lib/components'
import { hasErrors } from "../../../utils/methods";

import styles from './index.module.less'

const SaveFilterCriteria = ({ onSave }) => {

    const [customName, setCustomName] = useState('');
    const [visibility, setVisibility] = useState(null);
    const [errors, setErrors] = useState({});

    const visibility_options = [
        { value: 'Me', label: 'Me' },
        { value: 'Everyone', label: 'Everyone' }
    ]

    const handleSaveFilter = () => {
        if (!customName) {
            setErrors({ filter_name: 'Enter a name to save the filter' });
            return
        }
        if (!visibility) {
            setErrors({ visibility: 'Select an option' });
            return
        }        
        const filterToSave = { name: customName, visibility: visibility };
        onSave(filterToSave);
        setCustomName('');
        setVisibility(null);
        setErrors({})
    }

    return (
        <div className={`${styles.saveFilterWrapper} row`}>
            <div className={`${styles.saveAs} col-xs-4`}>
                {T.translate("save_filter.save_as")}
                <Input
                    id={'filter_name'}
                    value={customName}
                    placeholder={T.translate("save_filter.placeholders.custom_name")}
                    onChange={(ev) => setCustomName(ev.target.value)}
                    error={hasErrors('filter_name', errors)}
                />
            </div>
            <div className={`${styles.visibleTo} col-xs-4`}>
                {T.translate("save_filter.visible_to")}
                <RadioList
                    id='visibility'
                    value={visibility}
                    options={visibility_options}
                    onChange={(ev) => setVisibility(ev.target.value)}
                    error={hasErrors('visibility', errors)}
                    inline
                />
            </div>
            <div className={`${styles.button} col-xs-2`}>
                <button className='btn btn-default' onClick={() => handleSaveFilter()}>
                    {T.translate("save_filter.save")}
                </button>
            </div>
        </div>
    );
}

export default SaveFilterCriteria;
