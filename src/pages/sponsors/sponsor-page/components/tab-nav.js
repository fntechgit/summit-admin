import React from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Tab, Tabs } from "@mui/material";
import { matchPath } from "react-router-dom";
import Member from "../../../../models/member";
import { SPONSOR_PAGE_TABS } from "../tabDefs";

const TabNav = ({ currentSummit, sponsor, member, history, location }) => {
  const memberObj = new Member(member);

  const tabs = SPONSOR_PAGE_TABS.map((t) => ({
    ...t,
    label: T.translate(t.labelKey),
    value: t.path.slice(1) || "general"
  }));

  const routeMatch = matchPath(location.pathname, {
    path: "/app/summits/:summitId/sponsors/:sponsorId/:tab"
  });
  const selectedTab = routeMatch?.params?.tab || tabs[0].value;

  const handleTabChange = (value) => {
    const tab = tabs.find((t) => t.value === value);
    history.push(
      `/app/summits/${currentSummit.id}/sponsors/${sponsor.id}${tab.path}`
    );
  };

  return (
    <Tabs
      value={selectedTab}
      onChange={(ev, val) => handleTabChange(val)}
      sx={{ minHeight: "36px" }}
    >
      {tabs
        .filter((t) => memberObj.hasAccess(t.accessRoute))
        .map((tab) => (
          <Tab
            key={tab.value}
            label={tab.label}
            value={tab.value}
            sx={{
              fontSize: "1.4rem",
              lineHeight: "1.8rem",
              height: "36px",
              minHeight: "36px",
              px: 2,
              py: 1
            }}
            id={`simple-tab-${tab.value}`}
            aria-controls={`simple-tabpanel-${tab.value}`}
          />
        ))}
    </Tabs>
  );
};

const mapStateToProps = ({
  loggedUserState,
  currentSummitState,
  currentSponsorState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  member: loggedUserState.member,
  sponsor: currentSponsorState.entity
});

export default connect(mapStateToProps, {})(TabNav);
