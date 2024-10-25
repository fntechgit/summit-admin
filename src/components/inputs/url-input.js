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

import React, { useState, useEffect } from "react";
import T from "i18n-react/dist/i18n-react";
import { Input } from "openstack-uicore-foundation/lib/components";

const UrlInput = function ({ onChange, error, id, value: propValue, ...rest }) {
  const [stateValue, setStateValue] = useState(propValue || "");
  const [invalidUrl, setInvalidUrl] = useState("");

  useEffect(() => {
    setStateValue(propValue || "");
  }, [propValue]);

  const handleValidation = (ev) => {
    let { value, id } = ev.target;

    // Remove all whitespaces and trailing slash
    value = value.replace(/\s+|\/$/g, "");
    const urlPattern = /^(https?:\/\/)/;
    setStateValue(value);

    if (!urlPattern.test(value)) {
      setInvalidUrl(T.translate("url_input.url_error"));
      return;
    }

    setInvalidUrl("");

    onChange({
      target: {
        value,
        id
      }
    });
  };

  return (
    <Input
      id={id}
      value={stateValue}
      onChange={handleValidation}
      error={invalidUrl || error}
      {...rest}
    />
  );
};

export default UrlInput;
