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

export const getGlobalItems = () => [
  {
    name: "directory",
    linkUrl: "directory"
  },
  {
    name: "speakers",
    accessRoute: "speakers",
    subItems: [
      {
        name: "speaker_list",
        linkUrl: "speakers",
        accessRoute: "speaker-list"
      },
      {
        name: "merge_speakers",
        linkUrl: "speakers/merge",
        accessRoute: "speakers-merge"
      }
    ]
  },
  {
    name: "companies",
    linkUrl: "companies",
    accessRoute: "companies"
  },
  {
    name: "sponsors_inventory",
    accessRoute: "inventory",
    subItems: [
      {
        name: "inventory",
        linkUrl: "inventory"
      },
      {
        name: "form_templates",
        linkUrl: "form-templates"
      },
      {
        name: "page_templates",
        linkUrl: "page-templates"
      }
    ]
  },
  {
    name: "sponsorship_types",
    linkUrl: "sponsorship-types",
    accessRoute: "sponsorship-types"
  },
  {
    name: "tags",
    linkUrl: "tags",
    accessRoute: "tags"
  },
  {
    name: "sponsored_projects",
    linkUrl: "sponsored-projects",
    accessRoute: "sponsored-projects",
    exclusive: "sponsored-projects"
  },
  {
    name: "emails",
    accessRoute: "emails",
    subItems: [
      { name: "email_templates", linkUrl: "emails/templates" },
      { name: "email_logs", linkUrl: "emails/log" }
    ]
  },
  {
    name: "admin_access",
    linkUrl: "admin-access",
    accessRoute: "admin-access"
  },
  {
    name: "media_file_types",
    linkUrl: "media-file-types",
    accessRoute: "admin-access"
  }
];

export const getSummitItems = (summitId) => [
  {
    name: "audit_log",
    linkUrl: `summits/${summitId}/audit-log`,
    accessRoute: "audit-log"
  },
  {
    name: "dashboard",
    linkUrl: `summits/${summitId}/dashboard`,
    accessRoute: "general"
  },
  {
    name: "selection_plans",
    linkUrl: `summits/${summitId}/selection-plans`,
    accessRoute: "selection_plans"
  },
  {
    name: "events",
    accessRoute: "events",
    subItems: [
      { name: "new_event", linkUrl: `summits/${summitId}/events/new` },
      { name: "event_list", linkUrl: `summits/${summitId}/events` },
      { name: "schedule", linkUrl: `summits/${summitId}/events/schedule` },
      { name: "event_types", linkUrl: `summits/${summitId}/event-types` },
      {
        name: "event_categories",
        linkUrl: `summits/${summitId}/event-categories`
      },
      {
        name: "event_category_groups",
        linkUrl: `summits/${summitId}/event-category-groups`
      },
      {
        name: "voteable_presentations",
        linkUrl: `summits/${summitId}/voteable-presentations`
      },
      {
        name: "media_uploads",
        linkUrl: `summits/${summitId}/media-uploads`
      }
    ]
  },
  {
    name: "attendees",
    accessRoute: "attendees",
    subItems: [
      {
        name: "attendee-list",
        linkUrl: `summits/${summitId}/attendees`,
        accessRoute: "attendees"
      },
      {
        name: "badge_checkin",
        linkUrl: `summits/${summitId}/attendees/checkin`
      }
    ]
  },
  {
    name: "summit_speakers",
    accessRoute: "events",
    subItems: [
      {
        name: "submission_invitations",
        linkUrl: `summits/${summitId}/submission-invitations`,
        accessRoute: "speakers"
      },
      {
        name: "speakers",
        linkUrl: `summits/${summitId}/speakers`,
        accessRoute: "speakers"
      },
      {
        name: "speaker_attendance",
        linkUrl: `summits/${summitId}/speaker-attendances`,
        accessRoute: "speakers"
      },
      {
        name: "featured_speakers",
        linkUrl: `summits/${summitId}/featured-speakers`,
        accessRoute: "speakers"
      }
    ]
  },
  {
    name: "track_chairs",
    accessRoute: "track-chairs",
    subItems: [
      {
        name: "track_chair_list",
        linkUrl: `summits/${summitId}/track-chairs`
      },
      {
        name: "progress_flags",
        linkUrl: `summits/${summitId}/track-chairs/progress-flags`,
        accessRoute: "progress-flags"
      },
      {
        name: "track_timeframes",
        linkUrl: `summits/${summitId}/track-chairs/track-timeframes`,
        accessRoute: "track-timeframes"
      },
      {
        name: "track_chair_team_lists",
        linkUrl: `summits/${summitId}/track-chairs/team-lists`,
        accessRoute: "team-lists"
      }
    ]
  },
  {
    name: "sponsors",
    accessRoute: "sponsors",
    subItems: [
      {
        name: "sponsor_list",
        linkUrl: `summits/${summitId}/sponsors`,
        accessRoute: "sponsors"
      },
      {
        name: "sponsor_forms",
        linkUrl: `summits/${summitId}/sponsors/forms`,
        accessRoute: "admin-sponsors"
      },
      {
        name: "sponsor_pages",
        linkUrl: `summits/${summitId}/sponsors/pages`,
        accessRoute: "admin-sponsors"
      },
      {
        name: "sponsorship_list",
        linkUrl: `summits/${summitId}/sponsorships`,
        accessRoute: "admin-sponsors"
      },
      {
        name: "sponsor_users",
        linkUrl: `summits/${summitId}/sponsors/users`,
        accessRoute: "admin-sponsors"
      },
      {
        name: "sponsors_promocodes",
        linkUrl: `summits/${summitId}/sponsors/promocodes`,
        accessRoute: "admin-sponsors"
      },
      {
        name: "sponsor_settings",
        linkUrl: `summits/${summitId}/sponsors/settings`,
        accessRoute: "admin-sponsors"
      },
      {
        name: "badge_scans",
        linkUrl: `summits/${summitId}/badge-scans`,
        accessRoute: "badge-scans"
      }
    ]
  },
  {
    name: "locations",
    linkUrl: `summits/${summitId}/locations`,
    accessRoute: "locations"
  },
  {
    name: "signage",
    linkUrl: `summits/${summitId}/signage`,
    accessRoute: "signage"
  },
  {
    name: "purchase_orders",
    accessRoute: "purchase-orders",
    subItems: [
      {
        name: "purchase_order_list",
        linkUrl: `summits/${summitId}/purchase-orders`
      },
      { name: "ticket_list", linkUrl: `summits/${summitId}/tickets` },
      {
        name: "order_extra_questions",
        linkUrl: `summits/${summitId}/order-extra-questions`
      },
      {
        name: "registration_stats",
        linkUrl: `summits/${summitId}/registration-stats`
      }
    ]
  },
  {
    name: "tickets",
    accessRoute: "tickets",
    subItems: [
      {
        name: "registration_invitation_list",
        linkUrl: `summits/${summitId}/registration-invitations`
      },
      {
        name: "ticket_type_list",
        linkUrl: `summits/${summitId}/ticket-types`
      },
      {
        name: "promocode_list",
        linkUrl: `summits/${summitId}/promocodes`
      },
      { name: "tax_type_list", linkUrl: `summits/${summitId}/tax-types` },
      {
        name: "refund_policy_list",
        linkUrl: `summits/${summitId}/refund-policies`
      },
      {
        name: "payment_profiles_list",
        linkUrl: `summits/${summitId}/payment-profiles`
      },
      {
        name: "registration_companies_list",
        linkUrl: `summits/${summitId}/registration-companies`
      }
    ]
  },
  {
    name: "badges",
    accessRoute: "badges",
    subItems: [
      {
        name: "badge_feature_list",
        linkUrl: `summits/${summitId}/badge-features`
      },
      {
        name: "access_level_list",
        linkUrl: `summits/${summitId}/access-levels`
      },
      {
        name: "view_type_list",
        linkUrl: `summits/${summitId}/view-types`
      },
      {
        name: "badge_type_list",
        linkUrl: `summits/${summitId}/badge-types`
      },
      {
        name: "badge_settings",
        linkUrl: `summits/${summitId}/badge-settings`
      }
    ]
  },
  {
    name: "room_bookings",
    linkUrl: `summits/${summitId}/room-bookings`,
    accessRoute: "room-bookings",
    exclusive: "room-bookings"
  },
  {
    name: "push_notifications",
    linkUrl: `summits/${summitId}/push-notifications`,
    accessRoute: "push-notifications"
  },
  {
    name: "room_occupancy",
    linkUrl: `summits/${summitId}/room-occupancy`,
    accessRoute: "room-occupancy"
  },
  {
    name: "tag_groups",
    linkUrl: `summits/${summitId}/tag-groups`,
    accessRoute: "tag-groups"
  },
  {
    name: "reports",
    linkUrl: `summits/${summitId}/reports`,
    accessRoute: "reports"
  },
  {
    name: "summitdocs",
    linkUrl: `summits/${summitId}/summitdocs`,
    accessRoute: "summitdocs"
  },
  {
    name: "email_flow_events",
    accessRoute: "email-flow-events",
    subItems: [
      {
        name: "email_flow_overrides",
        linkUrl: `summits/${summitId}/email-flow-events`
      },
      {
        name: "email_flow_settings",
        linkUrl: `summits/${summitId}/email-flow-events-settings`
      }
    ]
  },
  {
    name: "settings",
    accessRoute: "settings",
    subItems: [
      { name: "marketing", linkUrl: `summits/${summitId}/marketing` },
      {
        name: "schedule_settings",
        linkUrl: `summits/${summitId}/schedule-settings`
      }
    ]
  }
];
