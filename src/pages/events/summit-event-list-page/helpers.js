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
import T from "i18n-react/dist/i18n-react";
import Dropdown from "openstack-uicore-foundation/lib/components/inputs/dropdown";
import SpeakerInput from "openstack-uicore-foundation/lib/components/inputs/speaker-input";
import { escapeFilterValue } from "openstack-uicore-foundation/lib/utils/actions";
import { OPERATORS } from "openstack-uicore-foundation/lib/components/mui/grid-filter";
import {
  queryMembers,
  queryTags
} from "openstack-uicore-foundation/lib/utils/query-actions";
import {
  queryAllCompanies,
  querySpeakerCompany,
  querySubmitterCompany
} from "../../../actions/event-actions";
import { formatDate, formatDuration } from "../../../utils/methods";
import {
  DEFAULT_Z_INDEX,
  HIGH_Z_INDEX,
  SECONDS_TO_MINUTES
} from "../../../utils/constants";
import { buildNameIdDDL } from "../../../utils/events/summit-event-list-page.utils";

// The table's column keys don't always match the API's order-by keys;
// this is the single source of truth for that aliasing, used both when
// sending a sort request and when highlighting the active sort column.
const SORT_KEY_TO_API_KEY = {
  name: "last_name",
  submitter_company: "created_by_company",
  progress_flags: "actions"
};

const API_KEY_TO_SORT_KEY = Object.fromEntries(
  Object.entries(SORT_KEY_TO_API_KEY).map(([uiKey, apiKey]) => [apiKey, uiKey])
);

export const toApiSortKey = (key) => SORT_KEY_TO_API_KEY[key] ?? key;

export const toUiSortKey = (key) => API_KEY_TO_SORT_KEY[key] ?? key;

// filter-criteria-api persists `criteria` verbatim but has no column for a
// top-level join_operator yet (confirmed: it round-trips `criteria` as-is,
// join_operator is silently dropped from the response). Until the backend
// adds that column, smuggle it in as a pseudo-criteria entry so saved
// filters remember ALL vs ANY, and strip it back out on load.
const JOIN_OPERATOR_CRITERIA_KEY = "__join_operator__";

export const packJoinOperatorIntoCriteria = (filterValues, joinOperator) => [
  ...filterValues,
  { criteria: JOIN_OPERATOR_CRITERIA_KEY, operator: "==", value: joinOperator }
];

export const unpackJoinOperatorFromCriteria = (filterCriteria) => {
  const criteria = filterCriteria?.criteria ?? [];
  const joinOperatorEntry = criteria.find(
    (c) => c.criteria === JOIN_OPERATOR_CRITERIA_KEY
  );

  return {
    criteria: criteria.filter((c) => c.criteria !== JOIN_OPERATOR_CRITERIA_KEY),
    // Prefer a real join_operator column if the backend ever adds one.
    joinOperator: filterCriteria?.join_operator ?? joinOperatorEntry?.value
  };
};

// Adds display-only fields for the table to render; never overwrites a real
// event field, since the same row object is sent back as-is to bulkUpdateEvents.
export const formatEventData = (e, summit) => {
  const speakerCompanies = Array.isArray(e.speakers)
    ? [...new Set(e.speakers.map((s) => s.company).filter(Boolean))]
    : [];

  const eventTypeCapacity = [
    e.type?.allows_location && "Allows Location",
    e.type?.allows_attendee_vote && "Allows Attendee Vote",
    e.type?.allows_publishing_dates && "Allows Publishing Dates"
  ].filter(Boolean);

  const speakersCount = e.type?.use_speakers ? e.speakers?.length ?? 0 : "N/A";

  return {
    ...e,
    created_by_fullname: e.created_by
      ? `${e.created_by.first_name} ${e.created_by.last_name} (${e.created_by.email})`
      : "TBD",
    submitter_company: e.created_by ? e.created_by.company : "N/A",
    speaker_names:
      Array.isArray(e.speakers) && e.speakers.length > 0
        ? e.speakers.map((s) => `${s.first_name} ${s.last_name}`).join(", ")
        : "N/A",
    speaker_company:
      speakerCompanies.length > 0 ? speakerCompanies.join(", ") : "N/A",
    speakers_count: speakersCount,
    event_type_capacity: eventTypeCapacity.join(", "),
    track_name: e?.track?.name ? e.track.name : "TBD",
    sponsor:
      Array.isArray(e.sponsors) && e.sponsors.length > 0
        ? e.sponsors.map((s) => s.name).join(", ")
        : "N/A",
    progress_flags: e?.actions
      ?.map((a) => `${a.type.label} (${a.is_completed ? "ON" : "OFF"})`)
      .join(", "),
    published_date_display: e.is_published
      ? formatDate(
          e.published_date,
          summit.time_zone.name,
          "MMMM Do YYYY, h:mm a"
        )
      : "No",
    start_date_display: e.start_date
      ? formatDate(e.start_date, summit.time_zone.name, "MMMM Do YYYY, h:mm a")
      : "TBD",
    end_date_display: e.end_date
      ? formatDate(e.end_date, summit.time_zone.name, "MMMM Do YYYY, h:mm a")
      : "TBD",
    created_display: e.created
      ? formatDate(e.created, summit.time_zone_id, "MMMM Do YYYY, h:mm a")
      : "TBD",
    modified: e.last_edited
      ? formatDate(e.last_edited, summit.time_zone_id, "MMMM Do YYYY, h:mm a")
      : "TBD"
  };
};

export const getOptionalColumns = (
  allSelectionPlans,
  allTracks,
  eventTypes,
  currentSummitId
) => [
  {
    columnKey: "speakers",
    customStyle: { minWidth: "350px" },
    label: T.translate("event_list.speakers"),
    // BulkEditTable writes edits back onto row[columnKey], and normalizeEvent
    // expects the edited value on row.speakers — so columnKey must be the
    // real field, not the speaker_names display string. Render from
    // speaker_names (precomputed in formatEventData) instead of the default
    // row[columnKey] fallback, since row.speakers is an array of speaker
    // objects, not display-ready text.
    render: (_, row) => row.speaker_names,
    editableField: (extraProps) => {
      const useSpeakers = extraProps.row.type?.use_speakers;
      return (
        useSpeakers && (
          <SpeakerInput
            id="speakers"
            isClearable
            isMulti
            placeholder={T.translate("edit_event.search_speakers")}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              control: (base, state) => ({
                ...base,
                zIndex: state.menuIsOpen ? HIGH_Z_INDEX : DEFAULT_Z_INDEX
              })
            }}
            getOptionLabel={(speaker) =>
              `${speaker.first_name} ${speaker.last_name} (${speaker.email})`
            }
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...extraProps}
            value={extraProps.row.speakers}
          />
        )
      );
    }
  },
  {
    columnKey: "created_by_fullname",
    sortable: true,
    label: T.translate("event_list.created_by")
  },
  {
    columnKey: "published_date",
    sortable: true,
    label: T.translate("event_list.published"),
    render: (_, row) => row.published_date_display
  },
  {
    columnKey: "duration",
    sortable: true,
    label: T.translate("event_list.duration"),
    render: (duration, row) =>
      row.type?.allows_publishing_dates && duration
        ? formatDuration(duration)
        : "N/A"
  },
  {
    columnKey: "speakers_count",
    sortable: true,
    label: T.translate("event_list.speakers_count")
  },
  {
    columnKey: "speaker_company",
    sortable: true,
    label: T.translate("event_list.speaker_company")
  },
  {
    columnKey: "track",
    sortable: true,
    label: T.translate("event_list.track"),
    // BulkEditTable writes edits back onto row[columnKey], and
    // normalizeBulkEvents reads row.track for track_id — so columnKey must
    // be the real field, not the track_name display string. Render from
    // track_name (precomputed in formatEventData) instead of the default
    // row[columnKey] fallback, since row.track is an object, not
    // display-ready text.
    render: (_, row) => row.track_name,
    editableField: (extraProps) => {
      const trackOptions = buildNameIdDDL(allTracks);

      return (
        <Dropdown
          id="track"
          options={trackOptions}
          menuPortalTarget={document.body}
          menuPosition="fixed"
          styles={{
            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            control: (base, state) => ({
              ...base,
              zIndex: state.menuIsOpen ? HIGH_Z_INDEX : DEFAULT_Z_INDEX
            })
          }}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...extraProps}
          value={extraProps.row.track?.id}
        />
      );
    }
  },
  {
    columnKey: "start_date",
    sortable: true,
    label: T.translate("event_list.start_date"),
    render: (_, row) => row.start_date_display
  },
  {
    columnKey: "end_date",
    sortable: true,
    label: T.translate("event_list.end_date"),
    render: (_, row) => row.end_date_display
  },
  {
    columnKey: "submitter_company",
    sortable: true,
    label: T.translate("event_list.submitter_company")
  },
  {
    columnKey: "sponsor",
    sortable: true,
    label: T.translate("event_list.sponsor")
  },
  {
    columnKey: "event_type_capacity",
    label: T.translate("event_list.event_type_capacity")
  },
  {
    columnKey: "selection_plan",
    sortable: true,
    label: T.translate("event_list.selection_plan"),
    editableField: (extraProps) => {
      if (!extraProps.row?.type?.id) return false;
      const eventType = Array.isArray(eventTypes)
        ? eventTypes.find(
            (t) => t?.id !== undefined && t.id === extraProps.row.type?.id
          )
        : null;
      if (!eventType) return false;

      const allowSelectionPlanEdit =
        ["PresentationType"].includes(eventType.class_name) ||
        ["PresentationType"].includes(eventType.name);
      if (!allowSelectionPlanEdit) return false;

      const trackId = extraProps.row?.track?.id;
      const track =
        trackId !== undefined && trackId !== null
          ? allTracks.find((t) => t?.id !== undefined && t.id === trackId)
          : null;

      const selectionPlansPerTrack = buildNameIdDDL(
        (Array.isArray(allSelectionPlans) ? allSelectionPlans : []).filter(
          (sp) =>
            !track ||
            (Array.isArray(sp.track_groups) &&
              Array.isArray(track.track_groups) &&
              sp.track_groups.some((gr) => track.track_groups.includes(gr)))
        )
      );

      return (
        <Dropdown
          id="selection_plan"
          options={selectionPlansPerTrack}
          menuPortalTarget={document.body}
          menuPosition="fixed"
          styles={{
            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            control: (base, state) => ({
              ...base,
              width: 220,
              zIndex: state.menuIsOpen ? HIGH_Z_INDEX : DEFAULT_Z_INDEX
            })
          }}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...extraProps}
          value={extraProps.value || ""}
        />
      );
    },
    render: (e) => (e?.name ? e.name : "N/A")
  },
  {
    columnKey: "location",
    sortable: true,
    label: T.translate("event_list.location"),
    render: (location) => (location?.name ? location.name : "N/A")
  },
  {
    columnKey: "level",
    sortable: true,
    label: T.translate("event_list.level"),
    render: (level) => level || "N/A"
  },
  {
    columnKey: "tags",
    sortable: true,
    label: T.translate("event_list.tags"),
    render: (tags) =>
      Array.isArray(tags) && tags.length > 0
        ? tags.reduce(
            (accumulator, t) =>
              accumulator + (accumulator !== "" ? ", " : "") + t.tag,
            ""
          )
        : "N/A"
  },
  {
    columnKey: "streaming_url",
    sortable: true,
    title: true,
    editableField: true,
    label: T.translate("event_list.streaming_url"),
    placeholder: T.translate("bulk_actions_page.placeholders.streaming_url"),
    render: (url) => url || "N/A"
  },
  {
    columnKey: "meeting_url",
    sortable: true,
    title: true,
    editableField: true,
    label: T.translate("event_list.meeting_url"),
    placeholder: T.translate("bulk_actions_page.placeholders.meeting_url"),
    render: (url) => url || "N/A"
  },
  {
    columnKey: "etherpad_link",
    sortable: true,
    title: true,
    editableField: true,
    label: T.translate("event_list.etherpad_link"),
    placeholder: T.translate("bulk_actions_page.placeholders.etherpad_link"),
    render: (link) => link || "N/A"
  },
  {
    columnKey: "streaming_type",
    sortable: true,
    label: T.translate("event_list.streaming_type"),
    render: (type) => type || "N/A"
  },
  {
    columnKey: "review_status",
    sortable: true,
    title: true,
    label: T.translate("event_list.review_status"),
    render: (status) => status ?? "N/A"
  },
  {
    columnKey: "status",
    sortable: true,
    title: true,
    label: T.translate("event_list.submission_status"),
    render: (status) => status ?? "Not Submitted"
  },
  {
    columnKey: "progress_flags",
    sortable: true,
    title: true,
    label: T.translate("event_list.progress_flags")
  },
  {
    columnKey: "created",
    sortable: true,
    label: T.translate("event_list.created"),
    render: (_, row) => row.created_display
  },
  {
    columnKey: "modified",
    sortable: true,
    label: T.translate("event_list.modified")
  },
  {
    columnKey: "submission_source",
    sortable: true,
    label: T.translate("event_list.submission_source"),
    render: (source) => source || "N/A"
  },
  {
    columnKey: "media_uploads",
    sortable: false,
    label: T.translate("event_list.media_uploads"),
    render: (e, row) => {
      if (!e?.length) return "N/A";
      return (
        <>
          {e.map((m) => (
            <React.Fragment key={m.id}>
              <button
                type="button"
                className="text-link-button"
                onClick={(ev) => {
                  ev.preventDefault();
                  if (!row?.id || !currentSummitId) return false;
                  window.open(
                    `/app/summits/${currentSummitId}/events/${row.id}/materials/${m.id}`,
                    "_blank",
                    "noopener,noreferrer"
                  );
                  return false;
                }}
              >
                {m.media_upload_type.name} - {m.created}
              </button>
              <br />
            </React.Fragment>
          ))}
        </>
      );
    }
  },
  {
    columnKey: "media_uploads_display",
    sortable: false,
    label: T.translate("event_list.media_uploads_display"),
    render: (e, row) => {
      const mediaUploads = row?.media_uploads || [];
      if (!mediaUploads.length) return "N/A";
      return (
        <>
          {mediaUploads.map((m) => (
            <React.Fragment key={m.id}>
              {`"${m.media_upload_type.name}" : `}
              <b>{`${m.display_on_site ? "Yes" : "No"}`}</b>
              <br />
            </React.Fragment>
          ))}
        </>
      );
    }
  },
  {
    columnKey: "allow_feedback",
    sortable: false,
    label: T.translate("event_list.allow_feedback"),
    render: (field) =>
      field === undefined ? "N/A" : field === true ? "Yes" : "No",
    editableField: (extraProps) => (
      <Dropdown
        id="allow_feedback"
        value={extraProps}
        options={[
          { label: "Yes", value: true },
          { label: "No", value: false }
        ]}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        styles={{
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
          control: (base, state) => ({
            ...base,
            zIndex: state.menuIsOpen ? HIGH_Z_INDEX : DEFAULT_Z_INDEX
          })
        }}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...extraProps}
      />
    )
  },
  {
    columnKey: "to_record",
    sortable: false,
    label: T.translate("event_list.to_record"),
    render: (field) =>
      field === undefined ? "N/A" : field === true ? "Yes" : "No",
    editableField: (extraProps) => (
      <Dropdown
        id="to_record"
        value={extraProps}
        options={[
          { label: "Yes", value: true },
          { label: "No", value: false }
        ]}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        styles={{
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
          control: (base, state) => ({
            ...base,
            zIndex: state.menuIsOpen ? HIGH_Z_INDEX : DEFAULT_Z_INDEX
          })
        }}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...extraProps}
      />
    )
  }
];

const eventTypeCapacityOptions = [
  {
    value: "allows_attendee_vote_filter",
    label: T.translate("event_list.allows_attendee_vote_filter")
  },
  {
    value: "allows_location_filter",
    label: T.translate("event_list.allows_location_filter")
  },
  {
    value: "allows_publishing_dates_filter",
    label: T.translate("event_list.allows_publishing_dates_filter")
  }
];

const levelOptions = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
  { label: "N/A", value: "na" }
];

const selectionStatusOptions = [
  { label: "Pending", value: "pending" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
  { label: "Alternate", value: "alternate" }
];

const publishedStatusOptions = [
  {
    label: "Published",
    value: "1"
  },
  {
    label: "Non Published",
    value: "0"
  }
];

const rsvpOptions = [
  {
    label: "Has RSVP",
    value: true
  },
  {
    label: "No RSVP",
    value: false
  }
];

const streamingTypeOptions = [
  { label: "LIVE", value: "LIVE" },
  { label: "VOD", value: "VOD" }
];

const submissionStatusOptions = [
  {
    label: T.translate("event_list.submission_status_accepted"),
    value: "Accepted"
  },
  {
    label: T.translate("event_list.submission_status_received"),
    value: "Received"
  },
  {
    label: T.translate("event_list.submission_status_not_submitted"),
    value: "NonReceived"
  }
];

const reviewStatusOptions = [
  {
    label: T.translate("event_list.review_status_accepted"),
    value: "Accepted"
  },
  {
    label: T.translate("event_list.review_status_in_review"),
    value: "InReview"
  },
  {
    label: T.translate("event_list.review_status_no_submitted"),
    value: "NotSubmitted"
  },
  {
    label: T.translate("event_list.review_status_published"),
    value: "Published"
  },
  {
    label: T.translate("event_list.review_status_received"),
    value: "Received"
  },
  {
    label: T.translate("event_list.review_status_rejected"),
    value: "Rejected"
  }
];

const submissionSourceOptions = [
  { label: "Admin", value: "Admin" },
  { label: "Submission", value: "Submission" }
];

// queryTags' response shape differs depending on whether it's summit-scoped
// (nested `tag.tag`) or global (flat `tag`); handle both defensively.
const tagFormatOption = (item) => ({
  value: item.id,
  label:
    typeof item.tag === "string" ? item.tag : item.tag?.tag || String(item.id)
});

export const getCriterias = (summit, mediaUploadTypes) => [
  {
    key: "event_type_capacity",
    label: T.translate("event_list.event_type_capacity"),
    operators: [OPERATORS.IS],
    values: {
      type: "select",
      props: {
        options: eventTypeCapacityOptions,
        multiple: true
      }
    },
    customParser: (f) => {
      const filter = [];

      if (f.value.includes("allows_attendee_vote_filter")) {
        filter.push("type_allows_attendee_vote==1");
      }
      if (f.value.includes("allows_location_filter")) {
        filter.push("type_allows_location==1");
      }
      if (f.value.includes("allows_publishing_dates_filter")) {
        filter.push("type_allows_publishing_dates==1");
      }

      return filter;
    }
  },
  {
    key: "selection_plan_id",
    label: T.translate("event_list.selection_plan"),
    operators: [OPERATORS.IS],
    values: {
      type: "select",
      props: {
        options: summit.selection_plans.map((sp) => ({
          label: sp.name,
          value: sp.id
        })),
        multiple: true
      }
    }
  },
  {
    key: "location_id",
    label: T.translate("event_list.location"),
    operators: [OPERATORS.IS],
    values: {
      type: "select",
      props: {
        options: summit.locations.map((sp) => ({
          label: sp.name,
          value: sp.id
        })),
        multiple: true
      }
    }
  },
  {
    key: "selection_status",
    label: "Selection Status",
    operators: [OPERATORS.IS],
    values: {
      type: "select",
      props: {
        options: selectionStatusOptions,
        multiple: true
      }
    }
  },
  {
    key: "track_id",
    label: T.translate("event_list.track"),
    operators: [OPERATORS.IS],
    values: {
      type: "select",
      props: {
        options: summit.tracks.map((t) => ({ label: t.name, value: t.id })),
        multiple: true
      }
    }
  },
  {
    key: "event_type_id",
    label: "Activity Type",
    operators: [OPERATORS.IS],
    values: {
      type: "select",
      props: {
        options: summit.event_types.map((type) => ({
          label: type.name,
          value: type.id
        })),
        multiple: true
      }
    }
  },
  {
    key: "speaker_id",
    label: T.translate("event_list.speakers"),
    operators: [OPERATORS.IS],
    values: {
      type: "speaker",
      props: {
        summitId: summit.id,
        multiple: true
      }
    },
    customParser: (f) => [
      `speaker_id==${f.value.map((s) => s.value).join("||")}`
    ]
  },
  {
    key: "speaker_company",
    label: T.translate("event_list.speaker_company"),
    operators: [OPERATORS.IS],
    values: {
      type: "company",
      props: {
        queryFunction: querySpeakerCompany,
        multiple: true
      }
    },
    customParser: (f) => [
      `speaker_company==${f.value
        .map((c) => escapeFilterValue(c.raw.name))
        .join("||")}`
    ]
  },
  {
    key: "level",
    label: T.translate("event_list.level"),
    operators: [OPERATORS.IS],
    values: {
      type: "select",
      props: {
        options: levelOptions,
        multiple: true
      }
    }
  },
  {
    key: "tags",
    label: T.translate("event_list.tags"),
    operators: [OPERATORS.IS],
    values: {
      type: "asyncSelect",
      props: {
        queryFunction: (input, callback) =>
          queryTags(summit.id, input, callback),
        formatOption: tagFormatOption,
        multiple: true
      }
    },
    customParser: (f) => [
      `tags==${f.value.map((t) => escapeFilterValue(t.label)).join("||")}`
    ]
  },
  {
    key: "published",
    label: T.translate("event_list.published"),
    operators: [OPERATORS.IS],
    values: {
      type: "select",
      props: {
        options: publishedStatusOptions
      }
    }
  },
  {
    key: "rsvp_type",
    label: "Has RSVP?",
    operators: [OPERATORS.IS],
    values: {
      type: "select",
      props: {
        options: rsvpOptions
      }
    },
    customParser: (f) => [`rsvp_type${f.value ? "<>" : "=="}None`]
  },
  {
    key: "progress_flag",
    label: T.translate("event_list.progress_flags"),
    operators: [OPERATORS.IS],
    values: {
      type: "select",
      props: {
        options: summit.presentation_action_types.map((pf) => ({
          value: pf.id,
          label: pf.label
        })),
        multiple: true
      }
    },
    customParser: (f) => [
      f.value.map((pf) => `actions==type_id==${pf}&&is_completed==1`).join(",")
    ]
  },
  {
    key: "created",
    label: T.translate("event_list.created"),
    operators: [OPERATORS.BEFORE, OPERATORS.AFTER],
    values: {
      type: "datetime",
      props: {
        mode: "datetime"
      }
    }
  },
  {
    key: "last_edited",
    label: T.translate("event_list.modified"),
    operators: [OPERATORS.BEFORE, OPERATORS.AFTER],
    values: {
      type: "datetime",
      props: {
        mode: "datetime"
      }
    }
  },
  {
    key: "start_date",
    label: T.translate("event_list.start_date"),
    operators: [OPERATORS.BEFORE, OPERATORS.AFTER],
    values: {
      type: "datetime",
      props: {
        mode: "datetime"
      }
    }
  },
  {
    key: "end_date",
    label: T.translate("event_list.end_date"),
    operators: [OPERATORS.BEFORE, OPERATORS.AFTER],
    values: {
      type: "datetime",
      props: {
        mode: "datetime"
      }
    }
  },
  {
    key: "duration",
    label: T.translate("event_list.duration"),
    operators: [OPERATORS.IS, OPERATORS.LESS, OPERATORS.GREATER],
    values: {
      type: "number",
      props: {
        min: 0,
        integer: true
      }
    },
    // The API stores duration in seconds, but the user enters minutes here.
    customParser: (f) => [
      `duration${f.operator}${f.value * SECONDS_TO_MINUTES}`
    ]
  },
  {
    key: "speakers_count",
    label: T.translate("event_list.speakers_count"),
    operators: [OPERATORS.IS, OPERATORS.LESS, OPERATORS.GREATER],
    values: {
      type: "number",
      props: {
        min: 0,
        integer: true
      }
    }
  },
  {
    key: "submitters",
    label: "Submitters",
    operators: [OPERATORS.IS],
    values: {
      type: "asyncSelect",
      props: {
        queryFunction: queryMembers,
        formatOption: (m) => ({
          value: m.id,
          label: `${m.first_name} ${m.last_name} (${m.email})`
        }),
        multiple: true
      }
    },
    customParser: (f) => [
      f.value
        .flatMap((s) => {
          const escapedFullName = escapeFilterValue(
            `${s.raw.first_name} ${s.raw.last_name}`
          );
          const escapedEmail = escapeFilterValue(s.raw.email);
          const fullNameFilter = `created_by_fullname==${escapedFullName}`;
          const emailFilter = `created_by_email==${escapedEmail}`;
          return [fullNameFilter, emailFilter];
        })
        .join(",")
    ]
  },
  {
    key: "created_by_company",
    label: T.translate("event_list.submitter_company"),
    operators: [OPERATORS.IS],
    values: {
      type: "company",
      props: {
        queryFunction: querySubmitterCompany,
        multiple: true
      }
    },
    customParser: (f) => [
      `created_by_company==${f.value
        .map((c) => escapeFilterValue(c.raw.name))
        .join("||")}`
    ]
  },
  {
    key: "streaming_url",
    label: T.translate("event_list.streaming_url"),
    operators: [OPERATORS.IS, OPERATORS.LIKE_START, OPERATORS.LIKE],
    values: {
      type: "text",
      props: {}
    }
  },
  {
    key: "meeting_url",
    label: T.translate("event_list.meeting_url"),
    operators: [OPERATORS.IS, OPERATORS.LIKE_START, OPERATORS.LIKE],
    values: {
      type: "text",
      props: {}
    }
  },
  {
    key: "etherpad_link",
    label: T.translate("event_list.etherpad_link"),
    operators: [OPERATORS.IS, OPERATORS.LIKE_START, OPERATORS.LIKE],
    values: {
      type: "text",
      props: {}
    }
  },
  {
    key: "streaming_type",
    label: T.translate("event_list.streaming_type"),
    operators: [OPERATORS.IS],
    values: {
      type: "select",
      props: {
        options: streamingTypeOptions
      }
    }
  },
  {
    key: "sponsor",
    label: T.translate("event_list.sponsor"),
    operators: [OPERATORS.IS],
    values: {
      type: "company",
      props: {
        multiple: true
      }
    },
    customParser: (f) => [
      `sponsor==${f.value.map((s) => escapeFilterValue(s.raw.name)).join("||")}`
    ]
  },
  {
    key: "all_companies",
    label: "All Companies",
    operators: [OPERATORS.IS],
    values: {
      type: "company",
      props: {
        queryFunction: queryAllCompanies,
        multiple: true
      }
    },
    customParser: (f) => {
      const companies = f.value
        .map((c) => escapeFilterValue(c.raw.name))
        .join("||");
      return [
        `speaker_company==${companies},created_by_company==${companies},sponsor==${companies}`
      ];
    }
  },
  {
    key: "submission_status",
    label: T.translate("event_list.submission_status"),
    operators: [OPERATORS.IS],
    values: {
      type: "select",
      props: {
        options: submissionStatusOptions
      }
    }
  },
  {
    key: "media_upload_with_type",
    label: "Media Upload Type",
    operators: [OPERATORS.HAS, OPERATORS.HAS_NOT],
    values: {
      type: "select",
      props: {
        options: mediaUploadTypes.map((type) => ({
          value: type.id,
          label: type.name
        })),
        multiple: true
      }
    },
    customParser: (f) => {
      const filter = [];

      if (f.operator === OPERATORS.HAS.value) {
        const value = Array.isArray(f.value) ? f.value.join("||") : f.value;
        filter.push(`has_media_upload_with_type==${value}`);
      } else {
        const value = Array.isArray(f.value) ? f.value.join("&&") : f.value;
        filter.push(`has_not_media_upload_with_type==${value}`);
      }

      return filter;
    }
  },
  {
    key: "review_status",
    label: T.translate("event_list.review_status"),
    operators: [OPERATORS.IS],
    values: {
      type: "select",
      props: {
        options: reviewStatusOptions,
        multiple: true
      }
    }
  },
  {
    key: "submission_source",
    label: T.translate("event_list.submission_source"),
    operators: [OPERATORS.IS],
    values: {
      type: "select",
      props: {
        options: submissionSourceOptions
      }
    }
  }
];
