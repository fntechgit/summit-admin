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

import React, { useEffect, useState } from "react";
import T from "i18n-react/dist/i18n-react";
import { withRouter } from "react-router-dom";
import SubMenuItem from "./sub-menu-item";
import MenuItem from "./menu-item";
import Member from "../../models/member";

import styles from "./menu.module.less";

const getGlobalItems = () => [
  {
    name: "directory",
    iconClass: "fa-fw fa-list-ul",
    linkUrl: "directory"
  },
  {
    name: "speakers",
    iconClass: "fa-users",
    accessRoute: "speakers",
    childs: [
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
    iconClass: "fa fa-copyright",
    linkUrl: "companies",
    accessRoute: "companies"
  },
  {
    name: "sponsorship_types",
    iconClass: "fa fa-handshake-o",
    linkUrl: "sponsorship-types",
    accessRoute: "sponsorship-types"
  },
  {
    name: "tags",
    iconClass: "fa fa-tag",
    linkUrl: "tags",
    accessRoute: "tags"
  },
  {
    name: "sponsored_projects",
    iconClass: "fa fa-cubes",
    linkUrl: "sponsored-projects",
    accessRoute: "sponsored-projects",
    exclusive: "sponsored-projects"
  },
  {
    name: "emails",
    iconClass: "fa-envelope-o",
    accessRoute: "emails",
    childs: [
      { name: "email_templates", linkUrl: "emails/templates" },
      { name: "email_logs", linkUrl: "emails/log" }
    ]
  },
  {
    name: "admin_access",
    iconClass: "fa-arrow-circle-o-right",
    linkUrl: "admin-access",
    accessRoute: "admin-access"
  },
  {
    name: "media_file_types",
    iconClass: "fa-file-text-o",
    linkUrl: "media-file-types",
    accessRoute: "admin-access"
  }
];

const getSummitItems = (summitId) => [
  {
    name: "audit_log",
    iconClass: "fa-tasks",
    linkUrl: `summits/${summitId}/audit-log`,
    accessRoute: "audit-log"
  },
  {
    name: "dashboard",
    iconClass: "fa-dashboard",
    linkUrl: `summits/${summitId}/dashboard`,
    accessRoute: "general"
  },
  {
    name: "events",
    iconClass: "fa-calendar",
    accessRoute: "events",
    childs: [
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
    iconClass: "fa-users",
    accessRoute: "attendees",
    childs: [
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
    iconClass: "fa-users",
    accessRoute: "events",
    childs: [
      {
        name: "submission_invitations",
        iconClass: "fa-ticket",
        linkUrl: `summits/${summitId}/submission-invitations`,
        accessRoute: "speakers"
      },
      {
        name: "speakers",
        iconClass: "fa-users",
        linkUrl: `summits/${summitId}/speakers`,
        accessRoute: "speakers"
      },
      {
        name: "speaker_attendance",
        iconClass: "fa-users",
        linkUrl: `summits/${summitId}/speaker-attendances`,
        accessRoute: "speakers"
      },
      {
        name: "featured_speakers",
        iconClass: "fa-star",
        linkUrl: `summits/${summitId}/featured-speakers`,
        accessRoute: "speakers"
      }
    ]
  },
  {
    name: "track_chairs",
    iconClass: "fa-user-circle-o",
    accessRoute: "track-chairs",
    childs: [
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
      }
    ]
  },
  {
    name: "sponsors",
    iconClass: "fa-handshake-o",
    accessRoute: "sponsors",
    childs: [
      {
        name: "sponsor_list",
        linkUrl: `summits/${summitId}/sponsors`,
        accessRoute: "sponsors"
      },
      {
        name: "sponsorship_list",
        linkUrl: `summits/${summitId}/sponsorships`,
        accessRoute: "admin-sponsors"
      },
      {
        name: "sponsors_promocodes",
        linkUrl: `summits/${summitId}/sponsors/promocodes`,
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
    iconClass: "fa-map-marker",
    linkUrl: `summits/${summitId}/locations`,
    accessRoute: "locations"
  },
  {
    name: "signage",
    iconClass: "fa-map-signs",
    linkUrl: `summits/${summitId}/signage`,
    accessRoute: "signage"
  },
  {
    name: "rsvps",
    iconClass: "fa-user-plus",
    accessRoute: "rsvp",
    childs: [
      {
        name: "rsvp_template_list",
        linkUrl: `summits/${summitId}/rsvp-templates`
      }
    ]
  },
  {
    name: "purchase_orders",
    iconClass: "fa-money",
    accessRoute: "purchase-orders",
    childs: [
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
    iconClass: "fa-ticket",
    accessRoute: "tickets",
    childs: [
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
    iconClass: "fa-id-card-o",
    accessRoute: "badges",
    childs: [
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
    iconClass: "fa-bookmark",
    linkUrl: `summits/${summitId}/room-bookings`,
    accessRoute: "room-bookings",
    exclusive: "room-bookings"
  },
  {
    name: "push_notifications",
    iconClass: "fa-paper-plane",
    linkUrl: `summits/${summitId}/push-notifications`,
    accessRoute: "push-notifications"
  },
  {
    name: "room_occupancy",
    iconClass: "fa-male",
    linkUrl: `summits/${summitId}/room-occupancy`,
    accessRoute: "room-occupancy"
  },
  {
    name: "tag_groups",
    iconClass: "fa-tags",
    linkUrl: `summits/${summitId}/tag-groups`,
    accessRoute: "tag-groups"
  },
  {
    name: "reports",
    iconClass: "fa-list-ol",
    linkUrl: `summits/${summitId}/reports`,
    accessRoute: "reports"
  },
  {
    name: "summitdocs",
    iconClass: "fa-file-text",
    linkUrl: `summits/${summitId}/summitdocs`,
    accessRoute: "summitdocs"
  },
  {
    name: "email_flow_events",
    iconClass: "fa-envelope-o",
    accessRoute: "email-flow-events",
    childs: [
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
    iconClass: "fa-cog",
    accessRoute: "settings",
    childs: [
      { name: "marketing", linkUrl: `summits/${summitId}/marketing` },
      {
        name: "schedule_settings",
        linkUrl: `summits/${summitId}/schedule-settings`
      }
    ]
  }
];

const Menu = ({ currentSummit, member, history }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [subMenuOpen, setSubMenuOpen] = useState([]);
  const memberObj = new Member(member);
  const canEditSummit = memberObj.canEditSummit();
  const globalItems = getGlobalItems();
  const summitItems = getSummitItems(currentSummit.id);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const toggleSubMenu = (ev, submenu) => {
    ev.preventDefault();
    let newSubMenuOpen = [];

    if (subMenuOpen.includes(submenu)) {
      newSubMenuOpen = subMenuOpen.filter((sm) => sm !== submenu);
    } else {
      newSubMenuOpen = [...subMenuOpen, submenu];
    }

    setSubMenuOpen(newSubMenuOpen);
    setMenuOpen(true);
  };

  const onMenuItemClick = (ev, url) => {
    ev.preventDefault();
    setMenuOpen(false);
    history.push(`/app/${url}`);
  };

  const drawMenuItem = (item) => {
    const hasAccess =
      !item.accessRoute || memberObj.hasAccess(item.accessRoute);

    if (!hasAccess) return null;

    if (item.childs) {
      return (
        <SubMenuItem
          key={item.name}
          isOpen={subMenuOpen.includes(item.name)}
          {...item}
          memberObj={memberObj}
          onClick={(e) => toggleSubMenu(e, item.name)}
          onItemClick={onMenuItemClick}
        />
      );
    }
    return (
      <MenuItem
        key={item.name}
        {...item}
        onClick={(e) => onMenuItemClick(e, item.linkUrl)}
      />
    );
  };

  useEffect(() => {
    document.getElementById("page-wrap")?.addEventListener("click", closeMenu);
    document
      .getElementById("page-header")
      ?.addEventListener("click", closeMenu);

    return () => {
      document
        .getElementById("page-wrap")
        .removeEventListener("click", closeMenu);
      document
        .getElementById("page-header")
        .removeEventListener("click", closeMenu);
    };
  }, []);

  return (
    <div
      className={`${styles.wrapper} ${styles[menuOpen ? "opened" : "closed"]}`}
    >
      <div className={styles.burgerButton}>
        <button onClick={() => setMenuOpen(true)}>
          <i className="fa fa-bars" />
        </button>
      </div>
      <div
        className={styles.menuWrapper}
        onMouseEnter={() => setMenuOpen(true)}
        onMouseLeave={() => setMenuOpen(false)}
      >
        <div className={styles.expandButton}>
          <i className="fa fa-chevron-right" />
        </div>

        <div className={styles.menuItemsWrapper}>
          <div className={styles.separator}>{T.translate("menu.general")}</div>
          {globalItems.map(drawMenuItem)}

          {currentSummit?.id && (
            <div className={styles.separator}>
              <span className="summit-name">{currentSummit.name}</span>
              {canEditSummit && (
                <button
                  type="button"
                  className={styles.editSummitBtn}
                  onClick={(e) =>
                    onMenuItemClick(e, `summits/${currentSummit.id}`)
                  }
                >
                  <i className="fa fa-pencil-square-o" />
                </button>
              )}
            </div>
          )}
          {currentSummit?.id && summitItems.map(drawMenuItem)}
        </div>
      </div>
    </div>
  );
};

export default withRouter(Menu);
