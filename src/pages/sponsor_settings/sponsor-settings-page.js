/**
 * Copyright 2018 OpenStack Foundation
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
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Breadcrumb } from "react-breadcrumbs";
import { Box, Tab, Tabs } from "@mui/material";
import PropTypes from "prop-types";
import SponsorSettingsForm from "../../components/forms/sponsor-settings-form";
import {
  getSponsorPurchasesMeta,
  getSponsorUsersMeta,
  saveAllSettings
} from "../../actions/sponsor-settings-actions";
import LeadReportForm from "../../components/forms/lead-report-form";

function TabPanel({ children, value, id }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== id}
      id={`tabpanel-${id}`}
      aria-labelledby={`tab-${id}`}
    >
      {value === id && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  id: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired
};

const SponsorSettingsPage = ({
  match,
  currentSummit,
  settings,
  getSponsorPurchasesMeta,
  getSponsorUsersMeta,
  saveAllSettings
}) => {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    getSponsorPurchasesMeta();
    getSponsorUsersMeta();
  }, []);

  const handleChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const onSaveSettings = (values) => {
    saveAllSettings(values);
  };

  return (
    <div className="container" style={{ backgroundColor: "transparent" }}>
      <Breadcrumb
        data={{
          title: T.translate("sponsor_settings.settings"),
          pathname: match.url
        }}
      />
      <h3>{T.translate("sponsor_settings.sponsor_settings")}</h3>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={activeTab} onChange={handleChange} aria-label="basic tabs">
          <Tab
            label={T.translate("sponsor_settings.general")}
            id="tab-0"
            aria-controls="tabpanel-0"
          />
          <Tab
            label={T.translate("sponsor_settings.badge_scans")}
            id="tab-1"
            aria-controls="tabpanel-1"
          />
        </Tabs>
      </Box>
      <Box sx={{ backgroundColor: "white" }}>
        <TabPanel value={activeTab} id={0}>
          <h4>{T.translate("sponsor_settings.registration_settings")}</h4>
          <hr />
          <SponsorSettingsForm
            onSubmit={onSaveSettings}
            settings={settings}
            summitTZ={currentSummit.time_zone_id}
          />
        </TabPanel>
        <TabPanel value={activeTab} id={1}>
          <h4>{T.translate("sponsor_settings.lead_report_settings")}</h4>
          <hr />
          <LeadReportForm />
        </TabPanel>
      </Box>
    </div>
  );
};

const mapStateToProps = ({ currentSummitState, sponsorSettingsState }) => ({
  currentSummit: currentSummitState.currentSummit,
  ...sponsorSettingsState
});

export default connect(mapStateToProps, {
  getSponsorPurchasesMeta,
  getSponsorUsersMeta,
  saveAllSettings
})(SponsorSettingsPage);
