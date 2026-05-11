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
import { ToggleButtonGroup, ToggleButton } from "react-bootstrap";
import PropTypes from "prop-types";

const ToggleButtons = ({ name, options, value, onChange }) => (
    <ToggleButtonGroup
      name={name}
      color="primary"
      value={value}
      exclusive
      onChange={onChange}
      aria-label="Platform"
    >
      {options.map((option) => (
        <ToggleButton key={`toggle-btn-${option}`} value={option}>
          {option}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );

ToggleButtons.propTypes = {
  name: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
}

ToggleButtons.defaultProps = {
  value: null,
}

export default ToggleButtons;