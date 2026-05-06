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

import React, { useState } from "react";
import ListItemButton from "@mui/material/ListItemButton";
import Typography from "@mui/material/Typography";
import Collapse from "@mui/material/Collapse";
import List from "@mui/material/List";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

function ExpandableItem({
  label,
  children,
  defaultOpen = true,
  isHeader = false
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <>
      <ListItemButton
        onClick={() => setOpen((prev) => !prev)}
        sx={{ py: 1, ...(isHeader ? { px: 2 } : { pl: 2 }) }}
      >
        <Typography
          variant="body1"
          sx={{
            flexGrow: 1,
            ...(isHeader && { fontWeight: 700, fontSize: "16px" })
          }}
        >
          {label}
        </Typography>
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List disablePadding>{children}</List>
      </Collapse>
    </>
  );
}

export default ExpandableItem;
