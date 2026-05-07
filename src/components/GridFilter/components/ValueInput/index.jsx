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
import TextField from "@mui/material/TextField";
import PropTypes from "prop-types";
import Dropdown from "../Dropdown";

const INPUT_TYPE_MAP = { text: TextField, select: Dropdown };

const ValueInput = ({type, ...rest}) => {
  const Component = INPUT_TYPE_MAP[type];
  // eslint-disable-next-line react/jsx-props-no-spreading
  return Component ? <Component {...rest} /> : null;
}

ValueInput.propTypes = {
  id: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.array]),
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string.isRequired,
  })),
  label: PropTypes.string,
  placeholder: PropTypes.string,
  onChange: PropTypes.func.isRequired,
}

ValueInput.defaultProps = {
  value: null,
  label: "",
  placeholder: "",
  options: null
}

export default ValueInput;