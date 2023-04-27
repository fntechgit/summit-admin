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

import React from 'react'
import {DateTimePicker} from "openstack-uicore-foundation/lib/components";

const DateIntervalInput = ({ onChange, fromDate, toDate, timezone = 'UTC'}) => {

  const handleClear = () => {
    onChange({target: {value: null, id: 'fromDate'}});
    onChange({target: {value: null, id: 'toDate'}});
  }

  return (
    <div className="inline">
      From: &nbsp;&nbsp;
      <DateTimePicker
        id="fromDate"
        onChange={console.log}
        format={{date: false, time: "HH:mm"}}
        value={fromDate}
        timezone={timezone}
      />
      &nbsp;&nbsp;To:&nbsp;&nbsp;
      <DateTimePicker
        id="toDate"
        onChange={onChange}
        validation={{ before: fromDate?.unix(), after: '>=' }}
        format={{date: false, time: "HH:mm"}}
        value={toDate}
        timezone={timezone}
      />
      &nbsp;&nbsp;
      <button className="btn btn-danger" onClick={handleClear}>Clear</button>
    </div>
  );
}

export default DateIntervalInput;
