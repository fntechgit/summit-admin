import React from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Tab, Tabs } from "@mui/material";
import { ACCESS_ROUTES } from "../../../../utils/constants";
import Member from "../../../../models/member";

const TabNav = ({ currentSummit, sponsor, member, history, location }) => {
  const memberObj = new Member(member);

  const tabs = [
    {
      label: T.translate("edit_sponsor.tab.general"),
      value: "general",
      accessRoute: ACCESS_ROUTES.SPONSORS
    },
    {
      label: T.translate("edit_sponsor.tab.users"),
      value: "users",
      accessRoute: ACCESS_ROUTES.ADMIN_SPONSORS
    },
    {
      label: T.translate("edit_sponsor.tab.pages"),
      value: "pages",
      accessRoute: ACCESS_ROUTES.ADMIN_SPONSORS
    },
    {
      label: T.translate("edit_sponsor.tab.media_uploads"),
      value: "media-uploads",
      accessRoute: ACCESS_ROUTES.ADMIN_SPONSORS
    },
    {
      label: T.translate("edit_sponsor.tab.forms"),
      value: "forms",
      accessRoute: ACCESS_ROUTES.ADMIN_SPONSORS
    },
    {
      label: T.translate("edit_sponsor.tab.cart"),
      value: "cart",
      accessRoute: ACCESS_ROUTES.ADMIN_SPONSORS
    },
    {
      label: T.translate("edit_sponsor.tab.purchases"),
      value: "purchases",
      accessRoute: ACCESS_ROUTES.ADMIN_SPONSORS
    },
    {
      label: T.translate("edit_sponsor.tab.badge_scans"),
      value: "badge-scans",
      accessRoute: ACCESS_ROUTES.SPONSORS
    }
  ];

  const selectedTab = location.pathname.split("/")[6] || tabs[0].value;

  const handleTabChange = (value) => {
    history.push(
      `/app/summits/${currentSummit.id}/sponsors/${sponsor.id}/${value}`
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
