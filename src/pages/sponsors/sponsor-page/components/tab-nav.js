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

  // onClick, not Tabs' onChange: MUI skips onChange on the selected tab, so purchases/:id couldn't go back
  const handleTabClick = (tab) => {
    const url = `/app/summits/${currentSummit.id}/sponsors/${sponsor.id}${tab.path}`;
    if (location.pathname !== url) history.push(url);
  };

  return (
    <Tabs value={selectedTab} sx={{ minHeight: "36px" }} variant="scrollable">
      {tabs
        .filter((t) => memberObj.hasAccess(t.accessRoute))
        .map((tab) => (
          <Tab
            key={tab.value}
            label={tab.label}
            value={tab.value}
            onClick={() => handleTabClick(tab)}
            sx={{
              fontSize: "0.875rem",
              lineHeight: "1.125rem",
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
