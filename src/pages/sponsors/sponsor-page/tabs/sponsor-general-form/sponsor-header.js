/**
 * Copyright 2025 OpenStack Foundation
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

import React, { useEffect, useState } from "react";
import T from "i18n-react/dist/i18n-react";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  Grid,
  Typography
} from "@mui/material";

const SponsorHeader = ({ sponsor, onSave }) => {
  const [isPublished, setIsPublished] = useState(sponsor.is_published);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsPublished(sponsor.is_published);
  }, [sponsor.id, sponsor.is_published]);

  const handlePublishSave = () => {
    const entity = { id: sponsor.id, is_published: isPublished };
    setIsSaving(true);
    Promise.resolve(onSave(entity))
      .catch(() => {})
      .finally(() => setIsSaving(false));
  };

  return (
    <Box sx={{ px: 2, py: 0, backgroundColor: "#FFF" }}>
      <Grid container size={12} sx={{ height: "68px", alignItems: "center" }}>
        <Grid size={12}>
          <Typography variant="h6">
            {T.translate("edit_sponsor.general_information")}
          </Typography>
        </Grid>
      </Grid>
      <Divider />
      <Grid
        container
        size={12}
        sx={{ height: "75px", gap: "10px", alignItems: "center" }}
      >
        <Grid size={3}>
          <Typography variant="body2">
            {T.translate("edit_sponsor.sponsor_name")}
          </Typography>
        </Grid>
        <Grid>{sponsor.company?.name}</Grid>
      </Grid>
      <Divider />
      <Grid
        container
        size={12}
        sx={{ height: "75px", gap: "10px", alignItems: "center" }}
      >
        <Grid size={3}>
          <Typography variant="body2">
            {T.translate("edit_sponsor.sponsor_address")}
          </Typography>
        </Grid>
        <Grid>
          {[
            sponsor.company?.city,
            sponsor.company?.state,
            sponsor.company?.country
          ]
            // filter empty or undefined fields
            .filter(Boolean)
            .join(" - ")}
          {sponsor.company?.contact_email && (
            <>
              &nbsp;
              <a href={`mailto:${sponsor.company.contact_email}`}>
                {sponsor.company.contact_email}
              </a>
            </>
          )}
        </Grid>
      </Grid>
      <Divider />
      <Grid
        container
        size={12}
        sx={{ height: "75px", gap: "10px", alignItems: "center" }}
      >
        <Grid size={3}>
          <Typography id="sponsor-is-published-label" variant="body2">
            {T.translate("edit_sponsor.is_published")}
          </Typography>
        </Grid>
        <Grid
          container
          size="grow"
          sx={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <Checkbox
            sx={{ display: "inline-block" }}
            checked={isPublished}
            disabled={isSaving}
            onChange={() => setIsPublished(!isPublished)}
            inputProps={{ "aria-labelledby": "sponsor-is-published-label" }}
          />
          <Button
            variant="contained"
            onClick={handlePublishSave}
            disabled={isSaving}
          >
            {T.translate("general.save")}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SponsorHeader;
