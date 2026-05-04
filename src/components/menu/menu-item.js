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
import { Exclusive } from "openstack-uicore-foundation/lib/components";
import ListItemButton from "@mui/material/ListItemButton";
import Typography from "@mui/material/Typography";

const MenuItem = ({ name, onClick, exclusive, nested, selected }) => {
  const itemHtml = (
    <ListItemButton
      id={`${name}-menu`}
      onClick={onClick}
      selected={selected}
      // eslint-disable-next-line no-magic-numbers
      sx={{ pl: nested ? 4 : 2, py: 1 }}
    >
      <Typography
        variant="body1"
        sx={{ ...(selected && { color: "primary.main", fontWeight: 700 }) }}
      >
        {T.translate(`menu.${name}`)}
      </Typography>
    </ListItemButton>
  );

  if (exclusive) {
    return <Exclusive name={exclusive}>{itemHtml}</Exclusive>;
  }

  return itemHtml;
};

export default MenuItem;
