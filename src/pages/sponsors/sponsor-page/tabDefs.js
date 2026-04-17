import React from "react";
import { Route, Switch } from "react-router-dom";
import { Breadcrumb } from "react-breadcrumbs";
import { ACCESS_ROUTES } from "../../../utils/constants";
import Restrict from "../../../routes/restrict";
import SponsorGeneralForm from "./tabs/sponsor-general-form";
import SponsorUsersListPerSponsorPage from "./tabs/sponsor-users-list-per-sponsor";
import SponsorPagesTab from "./tabs/sponsor-pages-tab";
import SponsorMediaUploadTab from "./tabs/sponsor-media-upload-tab";
import SponsorFormsTab from "./tabs/sponsor-forms-tab";
import SponsorFormsManageItems from "./tabs/sponsor-forms-tab/components/manage-items/sponsor-forms-manage-items";
import SponsorCartTab from "./tabs/sponsor-cart-tab";
import SponsorPurchasesTab from "./tabs/sponsor-purchases-tab";
import SponsorBadgeScans from "./tabs/sponsor-badge-scans";

const SponsorFormsRoute = ({ match }) => (
  <div>
    <Breadcrumb
      data={{
        title: "Forms",
        pathname: match.url
      }}
    />
    <Switch>
      <Route exact strict path={match.url} component={SponsorFormsTab} />
      <Route
        exact
        path={`${match.url}/:form_id/items`}
        component={SponsorFormsManageItems}
      />
    </Switch>
  </div>
);

export const SPONSOR_PAGE_TABS = [
  {
    labelKey: "edit_sponsor.tab.general",
    path: "",
    exact: true,
    strict: true,
    component: SponsorGeneralForm,
    accessRoute: ACCESS_ROUTES.SPONSORS
  },
  {
    labelKey: "edit_sponsor.tab.users",
    path: "/users",
    exact: true,
    component: SponsorUsersListPerSponsorPage,
    accessRoute: ACCESS_ROUTES.ADMIN_SPONSORS
  },
  {
    labelKey: "edit_sponsor.tab.pages",
    path: "/pages",
    exact: true,
    component: SponsorPagesTab,
    accessRoute: ACCESS_ROUTES.ADMIN_SPONSORS
  },
  {
    labelKey: "edit_sponsor.tab.media_uploads",
    path: "/media-uploads",
    exact: true,
    component: SponsorMediaUploadTab,
    accessRoute: ACCESS_ROUTES.ADMIN_SPONSORS
  },
  {
    labelKey: "edit_sponsor.tab.forms",
    path: "/forms",
    component: SponsorFormsRoute,
    accessRoute: ACCESS_ROUTES.ADMIN_SPONSORS
  },
  {
    labelKey: "edit_sponsor.tab.cart",
    path: "/cart",
    exact: true,
    component: SponsorCartTab,
    accessRoute: ACCESS_ROUTES.ADMIN_SPONSORS
  },
  {
    labelKey: "edit_sponsor.tab.purchases",
    path: "/purchases",
    exact: true,
    component: SponsorPurchasesTab,
    accessRoute: ACCESS_ROUTES.ADMIN_SPONSORS
  },
  {
    labelKey: "edit_sponsor.tab.badge_scans",
    path: "/badge-scans",
    exact: true,
    component: SponsorBadgeScans,
    accessRoute: ACCESS_ROUTES.SPONSORS
  }
].map((tab) => ({
  ...tab,
  component: Restrict(tab.component, tab.accessRoute)
}));
