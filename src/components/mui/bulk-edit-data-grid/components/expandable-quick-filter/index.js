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

import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { Box, Button, Tooltip } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";
import { ICON_ONLY_BUTTON_SX } from "../../constants";

const SEARCH_WIDTH = 330;

// search icon that expands into uicore's SearchInput
const ExpandableQuickFilter = ({ placeholder, term, onSearch }) => {
  const [expanded, setExpanded] = useState(!!term);
  const searchRef = useRef(null);
  const focusOnOpenRef = useRef(false);

  // SearchInput takes no autoFocus, so focus its input once opened from the
  // icon (but not when it starts open with a term)
  useEffect(() => {
    if (expanded && focusOnOpenRef.current) {
      searchRef.current.querySelector("input").focus();
      focusOnOpenRef.current = false;
    }
  }, [expanded]);

  if (!expanded) {
    return (
      <Tooltip title={T.translate("general.search")}>
        <Button
          size="small"
          startIcon={<SearchIcon />}
          onClick={() => {
            focusOnOpenRef.current = true;
            setExpanded(true);
          }}
          aria-label={T.translate("general.search")}
          sx={ICON_ONLY_BUTTON_SX}
        />
      </Tooltip>
    );
  }

  return (
    <Box
      ref={searchRef}
      sx={{ width: SEARCH_WIDTH }}
      // SearchInput takes no onBlur either; collapse once focus leaves both
      // its input and its clear button with nothing typed or applied
      onBlur={(ev) => {
        if (ev.currentTarget.contains(ev.relatedTarget)) return;
        if (!ev.currentTarget.querySelector("input").value && !term)
          setExpanded(false);
      }}
    >
      <SearchInput term={term} placeholder={placeholder} onSearch={onSearch} />
    </Box>
  );
};

ExpandableQuickFilter.propTypes = {
  placeholder: PropTypes.string,
  term: PropTypes.string,
  onSearch: PropTypes.func.isRequired
};

ExpandableQuickFilter.defaultProps = {
  placeholder: "",
  term: ""
};

export default ExpandableQuickFilter;
