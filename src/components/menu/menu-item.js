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
import T from "i18n-react/dist/i18n-react";
import Exclusive from "openstack-uicore-foundation/lib/components/exclusive-wrapper";
import ListItemButton from "@mui/material/ListItemButton";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const NESTED_PL = 4;
const TOP_LEVEL_PL = 2;
const INFO_ICON_ML = 0.5;

const MenuItem = ({
  name,
  onClick,
  exclusive,
  nested,
  selected,
  pl,
  infoKey
}) => {
  const itemHtml = (
    <ListItemButton
      id={`${name}-menu`}
      onClick={onClick}
      selected={selected}
      sx={{ pl: pl ?? (nested ? NESTED_PL : TOP_LEVEL_PL), py: 1 }}
    >
      <Typography
        variant="body1"
        sx={{ ...(selected && { color: "primary.main", fontWeight: 700 }) }}
      >
        {T.translate(`menu.${name}`)}
      </Typography>
      {infoKey && (
        <Tooltip title={T.translate(`menu.${infoKey}`)}>
          <InfoOutlinedIcon
            fontSize="small"
            sx={{ ml: INFO_ICON_ML, color: "text.secondary" }}
            onClick={(ev) => ev.stopPropagation()}
          />
        </Tooltip>
      )}
    </ListItemButton>
  );

  if (exclusive) {
    return <Exclusive name={exclusive}>{itemHtml}</Exclusive>;
  }

  return itemHtml;
};

export default MenuItem;
