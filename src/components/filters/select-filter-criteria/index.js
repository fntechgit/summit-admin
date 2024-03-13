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
import Swal from "sweetalert2";
import AsyncSelect from 'react-select/lib/Async';

import styles from './index.module.less'
import { queryFilterCriterias } from '../../../actions/filter-criteria-actions';

const SelectFilterCriteria = ({ summitId, onDelete, filterCriterias, selectedFilterCriteria, onChange, ...rest }) => {

    const [selectedFilter, setSelectedFilter] = useState(null);

    useEffect(() => {
        if(!selectedFilterCriteria) setSelectedFilter(null);
    }, [selectedFilterCriteria])

    const handleFilterChange = (filter) => {
        setSelectedFilter(filter);
        onChange(filter.value);
    }

    const handleFilterDelete = () => {        
        Swal.fire({
            title: T.translate("general.are_you_sure"),
            text: T.translate("select_filter_criteria.remove_filter_criteria_warning") + `"${selectedFilter.label}"`,
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: T.translate("general.yes")
        }).then((result) => {
            if (result.value) {
                onDelete(selectedFilter.value)
            }
        });
    }

    const getCriterias = (input, callback) => {

        if (!input) {
            return Promise.resolve({ options: [] });
        }

        // we need to map into value/label because of a bug in react-select 2
        // https://github.com/JedWatson/react-select/issues/2998

        const translateOptions = (options) => {
            const newOptions = options.map(c => ({ id: c.id, name: c.name, value: c.id, label: c.name }));
            callback(newOptions);
        };

        queryFilterCriterias(summitId, input, translateOptions);
    }


    return (
        <div className={`${styles.selectFilterWrapper} row`}>
            <div className="col-md-10">
                <AsyncSelect
                    id={'filter_criteria_select'}
                    value={selectedFilter}
                    placeholder={T.translate("select_filter_criteria.placeholder")}
                    defaultOptions={filterCriterias}
                    onChange={handleFilterChange}
                    loadOptions={getCriterias}
                    {...rest}
                />
            </div>
            <div className="col-md-2">
                {selectedFilter &&
                    <button className='btn btn-default' onClick={() => handleFilterDelete()}>
                        {T.translate("general.delete")}
                    </button>
                }
            </div>
        </div>
    );
}

export default SelectFilterCriteria;
