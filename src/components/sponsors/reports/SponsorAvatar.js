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
import { Avatar } from "@mui/material";

const MAX_INITIALS = 2;

const initialsOf = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, MAX_INITIALS)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase() || "?";

// Sponsor avatar with a logo-first, initials-fallback strategy. Container mimics
// the ReportShell title icon: a single tinted rounded square (primary.light bg /
// primary.dark foreground), so initials and logos share one consistent look and
// a no-logo (or white-logo) sponsor is never an invisible blank.
const SponsorAvatar = ({ name, logoUrl, sx, ...props }) => (
  <Avatar
    variant="rounded"
    src={logoUrl || undefined}
    alt={name}
    sx={{
      flexShrink: 0,
      fontSize: "16px",
      fontWeight: 600,
      borderRadius: 1.5,
      bgcolor: "primary.light",
      // White initials to match the (white) sponsor logos on the same tint.
      color: "common.white",
      ...sx
    }}
    {...props}
  >
    {initialsOf(name)}
  </Avatar>
);

export default SponsorAvatar;
