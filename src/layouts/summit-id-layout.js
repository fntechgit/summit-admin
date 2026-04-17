/**
 * Copyright 2017 OpenStack Foundation
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

import React, { Suspense, useEffect } from "react";
import { connect } from "react-redux";
import { Route, Switch } from "react-router-dom";
import { Breadcrumb } from "react-breadcrumbs";
import T from "i18n-react/dist/i18n-react";
import AjaxLoader from "openstack-uicore-foundation/lib/components/ajaxloader";

import { getSummitById } from "../actions/summit-actions";
import { getUserRolesBySummit } from "../actions/user-chat-roles-actions";
import {
  getMarketingSettingsForPrintApp,
  getMarketingSettingsForRegLite
} from "../actions/marketing-actions";
import { getRegFeedMetadataBySummit } from "../actions/reg-feed-metadata-actions";

const SummitDashboardPage = React.lazy(() =>
  import("../pages/summits/summit-dashboard-page")
);
const EditSummitPage = React.lazy(() =>
  import("../pages/summits/edit-summit-page")
);
const SelectionPlanLayout = React.lazy(() => import("./selection-plan-layout"));
const EventTypeLayout = React.lazy(() => import("./event-type-layout"));
const SpeakerAttendanceLayout = React.lazy(() =>
  import("./speaker-attendance-layout")
);
const EventLayout = React.lazy(() => import("./event-layout"));
const AttendeeLayout = React.lazy(() => import("./attendee-layout"));
const PromocodeLayout = React.lazy(() => import("./promocode-layout"));
const EventCategoryLayout = React.lazy(() => import("./event-category-layout"));
const EventCategoryGroupLayout = React.lazy(() =>
  import("./event-category-group-layout")
);
const LocationLayout = React.lazy(() => import("./location-layout"));
const SignagePage = React.lazy(() => import("../pages/signage"));
const RsvpTemplateLayout = React.lazy(() => import("./rsvp-template-layout"));
const TicketTypeLayout = React.lazy(() => import("./ticket-type-layout"));
const TaxTypeLayout = React.lazy(() => import("./tax-type-layout"));
const RefundPolicyListPage = React.lazy(() =>
  import("../pages/tickets/refund-policy-list-page")
);
const PushNotificationLayout = React.lazy(() =>
  import("./push-notification-layout")
);
const RoomOccupancyLayout = React.lazy(() => import("./room-occupancy-layout"));
const TagGroupLayout = React.lazy(() => import("./tag-group-layout"));
const ReportsLayout = React.lazy(() => import("./reports-layout"));
const RoomBookingsLayout = React.lazy(() => import("./room-bookings-layout"));
const RoomBookingAttributeLayout = React.lazy(() =>
  import("./room-booking-attribute-layout")
);
const BadgeFeatureLayout = React.lazy(() => import("./badge-feature-layout"));
const AccessLevelLayout = React.lazy(() => import("./access-level-layout"));
const BadgeTypeLayout = React.lazy(() => import("./badge-type-layout"));
const PurchaseOrderLayout = React.lazy(() => import("./purchase-order-layout"));
const OrderExtraQuestionLayout = React.lazy(() =>
  import("./order-extra-question-layout")
);
const SponsorLayout = React.lazy(() => import("./sponsor-layout"));
const SummitSponsorshipLayout = React.lazy(() =>
  import("./summit-sponsorship-layout")
);
const BadgeScansLayout = React.lazy(() => import("./badge-scans-layout"));
const BadgeSettingsLayout = React.lazy(() => import("./badge-settings-layout"));
const NoMatchPage = React.lazy(() => import("../pages/no-match-page"));
const TicketListPage = React.lazy(() =>
  import("../pages/tickets/ticket-list-page")
);
const MarketingLayout = React.lazy(() => import("./marketing-layout"));
const PaymentProfileLayout = React.lazy(() =>
  import("./payment-profile-layout")
);
const SummitDocsLayout = React.lazy(() => import("./summitdocs-layout"));
const EmailFlowEventLayout = React.lazy(() =>
  import("./email-flow-event-layout")
);
const EmailFlowEventSettingsLayout = React.lazy(() =>
  import("./email-flow-event-settings-layout")
);
const RegistrationInvitationLayout = React.lazy(() =>
  import("./registration-invitation-layout")
);
const MediaUploadLayout = React.lazy(() => import("./media-upload-layout"));
const ScheduleSettingsLayout = React.lazy(() =>
  import("./schedule-settings-layout")
);
const FeaturedSpeakersPage = React.lazy(() =>
  import("../pages/summit_speakers/featured-speakers-page")
);
const TrackChairsLayout = React.lazy(() => import("./track-chairs-layout"));
const SummitPresentationsVotesPage = React.lazy(() =>
  import("../pages/events/summit-presentations-votes-page")
);
const RegistrationCompaniesLayout = React.lazy(() =>
  import("./registration-companies-layout")
);
const SummitSpeakersLayout = React.lazy(() =>
  import("./summit-speakers-layout")
);
const ViewTypeLayout = React.lazy(() => import("./view-type-layout"));
const RegistrationStatsPage = React.lazy(() =>
  import("../pages/registration/registration-stats-page")
);
const AuditLogPage = React.lazy(() =>
  import("../pages/audit-log/audit-log-page")
);
const SubmissionInvitationLayout = React.lazy(() =>
  import("./submission-invitation-layout")
);
const RegFeedMetadataLayout = React.lazy(() =>
  import("./reg-feed-metadata-layout")
);

const SummitIdLayout = ({ currentSummit, loading, match, ...props }) => {
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const summitId = parseInt(match.params.summit_id);
  const breadcrumb = currentSummit?.name || T.translate("general.new_summit");

  useEffect(() => {
    props.getSummitById(summitId).then(() => setHasLoaded(true));
  }, [summitId]);

  if (
    !currentSummit.id ||
    summitId !== currentSummit.id ||
    loading ||
    !hasLoaded
  )
    return null;

  return (
    <div>
      <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
      <Suspense fallback={<AjaxLoader show relative size={120} />}>
        <Switch>
          <Route
            strict
            exact
            path={`${match.url}/dashboard`}
            component={SummitDashboardPage}
          />
          <Route
            strict
            exact
            path={match.url}
            render={(props) => (
              <EditSummitPage {...props} summitId={match.params.summit_id} />
            )}
          />
          <Route
            path={`${match.url}/room-booking-attributes`}
            component={RoomBookingAttributeLayout}
          />
          <Route path={`${match.url}/events`} component={EventLayout} />
          <Route
            path={`${match.url}/voteable-presentations`}
            component={SummitPresentationsVotesPage}
          />
          <Route
            path={`${match.url}/event-types`}
            component={EventTypeLayout}
          />
          <Route
            path={`${match.url}/event-categories`}
            component={EventCategoryLayout}
          />
          <Route
            path={`${match.url}/event-category-groups`}
            component={EventCategoryGroupLayout}
          />
          <Route path={`${match.url}/attendees`} component={AttendeeLayout} />
          <Route
            path={`${match.url}/speaker-attendances`}
            component={SpeakerAttendanceLayout}
          />
          <Route
            path={`${match.url}/speakers`}
            component={SummitSpeakersLayout}
          />
          <Route
            path={`${match.url}/featured-speakers`}
            component={FeaturedSpeakersPage}
          />
          <Route path={`${match.url}/locations`} component={LocationLayout} />
          <Route path={`${match.url}/signage`} component={SignagePage} />
          <Route
            path={`${match.url}/rsvp-templates`}
            component={RsvpTemplateLayout}
          />
          <Route path={`${match.url}/promocodes`} component={PromocodeLayout} />
          <Route
            path={`${match.url}/ticket-types`}
            component={TicketTypeLayout}
          />
          <Route path={`${match.url}/tax-types`} component={TaxTypeLayout} />
          <Route
            path={`${match.url}/refund-policies`}
            component={RefundPolicyListPage}
          />
          <Route
            path={`${match.url}/payment-profiles`}
            component={PaymentProfileLayout}
          />
          <Route
            path={`${match.url}/room-bookings`}
            component={RoomBookingsLayout}
          />
          <Route
            path={`${match.url}/push-notifications`}
            component={PushNotificationLayout}
          />
          <Route
            path={`${match.url}/room-occupancy`}
            component={RoomOccupancyLayout}
          />
          <Route path={`${match.url}/tag-groups`} component={TagGroupLayout} />
          <Route path={`${match.url}/reports`} component={ReportsLayout} />
          <Route
            path={`${match.url}/selection-plans`}
            component={SelectionPlanLayout}
          />
          <Route
            path={`${match.url}/reg-feed-metadata`}
            component={RegFeedMetadataLayout}
          />
          <Route
            path={`${match.url}/badge-features`}
            component={BadgeFeatureLayout}
          />
          <Route
            path={`${match.url}/badge-types`}
            component={BadgeTypeLayout}
          />
          <Route
            path={`${match.url}/access-levels`}
            component={AccessLevelLayout}
          />
          <Route path={`${match.url}/view-types`} component={ViewTypeLayout} />
          <Route
            path={`${match.url}/purchase-orders`}
            component={PurchaseOrderLayout}
          />
          <Route path={`${match.url}/tickets`} component={TicketListPage} />
          <Route
            path={`${match.url}/registration-invitations`}
            component={RegistrationInvitationLayout}
          />
          <Route
            path={`${match.url}/submission-invitations`}
            component={SubmissionInvitationLayout}
          />
          <Route
            path={`${match.url}/order-extra-questions`}
            component={OrderExtraQuestionLayout}
          />
          <Route path={`${match.url}/sponsors`} component={SponsorLayout} />
          <Route
            path={`${match.url}/sponsorships`}
            component={SummitSponsorshipLayout}
          />
          <Route
            path={`${match.url}/badge-scans`}
            component={BadgeScansLayout}
          />
          <Route
            path={`${match.url}/badge-settings`}
            component={BadgeSettingsLayout}
          />
          <Route path={`${match.url}/marketing`} component={MarketingLayout} />
          <Route
            path={`${match.url}/summitdocs`}
            component={SummitDocsLayout}
          />
          <Route
            path={`${match.url}/email-flow-events`}
            component={EmailFlowEventLayout}
          />
          <Route
            path={`${match.url}/email-flow-events-settings`}
            component={EmailFlowEventSettingsLayout}
          />
          <Route
            path={`${match.url}/media-uploads`}
            component={MediaUploadLayout}
          />
          <Route
            path={`${match.url}/track-chairs`}
            component={TrackChairsLayout}
          />
          <Route
            path={`${match.url}/schedule-settings`}
            component={ScheduleSettingsLayout}
          />
          <Route
            path={`${match.url}/registration-companies`}
            component={RegistrationCompaniesLayout}
          />
          <Route
            path={`${match.url}/registration-stats`}
            component={RegistrationStatsPage}
          />
          <Route path={`${match.url}/audit-log`} component={AuditLogPage} />
          <Route component={NoMatchPage} />
        </Switch>
      </Suspense>
    </div>
  );
};

const mapStateToProps = ({ currentSummitState }) => ({
  currentSummit: currentSummitState.currentSummit,
  loading: currentSummitState.loading
});

export default connect(mapStateToProps, {
  getSummitById,
  getUserRolesBySummit,
  getMarketingSettingsForRegLite,
  getMarketingSettingsForPrintApp,
  getRegFeedMetadataBySummit
})(SummitIdLayout);
