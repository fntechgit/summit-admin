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

import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import Swal from "sweetalert2";
import { Pagination } from "react-bootstrap";
import Dropdown from "openstack-uicore-foundation/lib/components/inputs/dropdown";
import FreeTextSearch from "openstack-uicore-foundation/lib/components/free-text-search";
import SpeakerInput from "openstack-uicore-foundation/lib/components/inputs/speaker-input";
import { escapeFilterValue } from "openstack-uicore-foundation/lib/utils/actions";
import {
  GridFilter,
  OPERATORS,
  useGridFilter
} from "openstack-uicore-foundation/lib/components/mui/grid-filter";
import {
  queryMembers,
  queryTags
} from "openstack-uicore-foundation/lib/utils/query-actions";
import {
  bulkUpdateEvents,
  changeEventListSearchTerm,
  deleteEvent,
  exportEvents,
  getEvents,
  importEventsCSV,
  importMP4AssetsFromMUX,
  queryAllCompanies,
  querySpeakerCompany,
  querySubmitterCompany
} from "../../../actions/event-actions";
import { getMediaUploads } from "../../../actions/media-upload-actions";
import { handleDDLSortByLabel } from "../../../utils/methods";
import {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_Z_INDEX,
  HIGH_Z_INDEX,
  MAX_PER_PAGE
} from "../../../utils/constants";
import {
  defaultColumns,
  editableColumns,
  formatEventData
} from "../../../utils/summitUtils";
import SaveFilterCriteria from "../../../components/filters/save-filter-criteria";
import SelectFilterCriteria from "../../../components/filters/select-filter-criteria";
import {
  deleteFilterCriteria,
  saveFilterCriteria
} from "../../../actions/filter-criteria-actions";
import { CONTEXT_ACTIVITIES } from "../../../utils/filter-criteria-constants";
import EditableTable from "../../../components/tables/editable-table/EditableTable";
import { buildNameIdDDL } from "../../../utils/events/summit-event-list-page.utils";
import ImportModal from "./components/ImportModal";
import ImportMUXModal from "./components/ImportMUXModal";

const FILTER_ID = "summit_activity_list";

const fieldNames = (
  allSelectionPlans,
  allTracks,
  eventTypes,
  currentSummitId
) => [
  {
    columnKey: "speakers",
    value: "speakers",
    customStyle: { minWidth: "350px" },
    editableField: (extraProps) => {
      const useSpeakers = extraProps.row.type?.use_speakers;
      return (
        useSpeakers && (
          <SpeakerInput
            id="speakers"
            value={extraProps.rowData}
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
          />
        )
      );
    }
  },
  { columnKey: "created_by_fullname", value: "created_by", sortable: true },
  { columnKey: "published_date", value: "published", sortable: true },
  { columnKey: "duration", value: "duration", sortable: true },
  { columnKey: "speakers_count", value: "speakers_count", sortable: true },
  { columnKey: "speaker_company", value: "speaker_company", sortable: true },
  {
    columnKey: "track",
    value: "track",
    sortable: true,
    editableField: (extraProps) => {
      const trackOptions = buildNameIdDDL(allTracks);

      return (
        <Dropdown
          id="track"
          value={extraProps.value}
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
        />
      );
    }
  },
  { columnKey: "start_date", value: "start_date", sortable: true },
  { columnKey: "end_date", value: "end_date", sortable: true },
  { columnKey: "submitters", value: "submitters" },
  {
    columnKey: "submitter_company",
    value: "submitter_company",
    sortable: true
  },
  { columnKey: "sponsor", value: "sponsor", sortable: true },
  { columnKey: "event_type_capacity", value: "event_type_capacity" },
  {
    columnKey: "selection_plan",
    value: "selection_plan",
    sortable: true,
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
          value={extraProps.value || ""}
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
        />
      );
    },
    render: (e) => (e?.name ? e.name : "N/A")
  },
  { columnKey: "location", value: "location", sortable: true },
  { columnKey: "level", value: "level", sortable: true },
  { columnKey: "tags", value: "tags", sortable: true },
  {
    columnKey: "streaming_url",
    value: "streaming_url",
    sortable: true,
    title: true,
    editableField: true
  },
  {
    columnKey: "meeting_url",
    value: "meeting_url",
    sortable: true,
    title: true,
    editableField: true
  },
  {
    columnKey: "etherpad_link",
    value: "etherpad_link",
    sortable: true,
    title: true,
    editableField: true
  },
  { columnKey: "streaming_type", value: "streaming_type", sortable: true },
  {
    columnKey: "review_status",
    value: "review_status",
    sortable: true,
    title: true
  },
  {
    columnKey: "status",
    value: "submission_status",
    sortable: true,
    title: true
  },
  {
    columnKey: "progress_flags",
    value: "progress_flags",
    sortable: true,
    title: true
  },
  { columnKey: "created", value: "created", sortable: true },
  { columnKey: "modified", value: "modified", sortable: true },
  {
    columnKey: "submission_source",
    value: "submission_source",
    sortable: true
  },
  {
    columnKey: "media_uploads",
    value: "media_uploads",
    sortable: false,
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
                    "_blank"
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
    value: "media_uploads_display",
    sortable: false,
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
    value: "allow_feedback",
    sortable: false,
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
    value: "to_record",
    sortable: false,
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

const getCriterias = (summit, mediaUploadTypes) => [
  {
    key: "event_type_capacity",
    label: "Activity Type Capacity",
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
    label: "Selection Plan",
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
    label: "Location",
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
    label: "Activity Category",
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
    label: "Speakers",
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
    label: "Speaker Company",
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
    label: "Activity Level",
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
    label: "Tags",
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
    label: "Published",
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
    label: "Progress Flag",
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
    label: "Created",
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
    label: "Modified",
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
    label: "Start Date",
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
    label: "End Date",
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
    label: "Duration",
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
    key: "speakers_count",
    label: "Speaker Count",
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
    label: "Submitter Company",
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
    label: "Streaming URL",
    operators: [OPERATORS.IS, OPERATORS.LIKE_START, OPERATORS.LIKE],
    values: {
      type: "text",
      props: {}
    }
  },
  {
    key: "meeting_url",
    label: "Meeting URL",
    operators: [OPERATORS.IS, OPERATORS.LIKE_START, OPERATORS.LIKE],
    values: {
      type: "text",
      props: {}
    }
  },
  {
    key: "etherpad_link",
    label: "Etherpad Link",
    operators: [OPERATORS.IS, OPERATORS.LIKE_START, OPERATORS.LIKE],
    values: {
      type: "text",
      props: {}
    }
  },
  {
    key: "streaming_type",
    label: "Streaming Type",
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
    label: "Sponsor",
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
    label: "Submitter Company",
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
    label: "Review Status",
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
    label: "Submitter Status",
    operators: [OPERATORS.IS],
    values: {
      type: "select",
      props: {
        options: submissionSourceOptions
      }
    }
  }
];

const SummitEventListPage = ({
  events,
  currentSummit,
  extraColumns,
  term,
  currentPage,
  perPage,
  lastPage,
  order,
  orderDir,
  totalEvents,
  history,
  mediaUploadTypes,
  getEvents,
  deleteEvent,
  getMediaUploads,
  exportEvents,
  importEventsCSV,
  importMP4AssetsFromMUX,
  changeEventListSearchTerm,
  saveFilterCriteria,
  deleteFilterCriteria,
  bulkUpdateEvents
}) => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [showImportFromMUXModal, setShowImportFromMUXModal] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [selectedFilterCriteria, setSelectedFilterCriteria] = useState(null);
  const { parsedFilter, resetFilters, filterValues, setFilters } =
    useGridFilter(FILTER_ID);

  // eslint-disable-next-line no-underscore-dangle
  const _getEvents = (params = {}) => {
    const mergedParams = {
      term,
      page: currentPage,
      perPage,
      order,
      orderDir,
      ...params
    };

    const {
      term: t,
      page: p,
      perPage: pp,
      order: o,
      orderDir: od
    } = mergedParams;

    getEvents(t, p, pp, o, od, parsedFilter, extraColumns);
  };

  useEffect(() => {
    if (currentSummit) {
      getMediaUploads("", 1, MAX_PER_PAGE, "name", 1);
      getEvents();
      // GridFilter persists criteria to localStorage under a summit-agnostic
      // FILTER_ID, so it survives a summit switch unless cleared explicitly here.
      setSelectedFilterCriteria(null);
      resetFilters();
    }
  }, [currentSummit?.id]);

  useEffect(() => {
    _getEvents();
  }, [parsedFilter.join(",")]);

  useEffect(() => {
    if (selectedFilterCriteria) {
      setFilters(selectedFilterCriteria.criteria);
    } else {
      resetFilters();
    }
  }, [selectedFilterCriteria]);

  useEffect(() => {
    setSelectedColumns(extraColumns);
  }, [extraColumns]);

  const handleMUXImport = (ev) => {
    ev.preventDefault();
    setShowImportFromMUXModal(true);
  };

  const handleEdit = (eventId) => {
    history.push(`/app/summits/${currentSummit.id}/events/${eventId}`);
  };

  const handleExport = (ev) => {
    ev.preventDefault();
    exportEvents(term, order, orderDir, parsedFilter, selectedColumns);
  };

  const handlePageChange = (page) => {
    _getEvents({ page });
  };

  const handleSort = (index, key, dir) => {
    let translatedKey = key;
    switch (key) {
      case "name":
        translatedKey = "last_name";
        break;
      case "submitter_company":
        translatedKey = "created_by_company";
        break;
      case "progress_flags":
        translatedKey = "actions";
        break;
      default:
        break;
    }

    _getEvents({ order: translatedKey, orderDir: dir });
  };

  const handleSearch = (newTerm) => {
    _getEvents({ term: newTerm, page: DEFAULT_CURRENT_PAGE });
  };

  const handleNewEvent = () => {
    history.push(`/app/summits/${currentSummit.id}/events/new`);
  };

  const handleDeleteEvent = (eventId) => {
    const event = events.find((e) => e.id === eventId);

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("event_list.delete_event_warning")} ${event.title}`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        deleteEvent(eventId);
      }
    });
  };

  const handleTermChange = (newTerm) => {
    changeEventListSearchTerm(newTerm);
  };

  const handleFilterCriteriaSave = ({ name, id, visibility }) => {
    const filterToSave = {
      id,
      show_id: currentSummit.id,
      name,
      enabled_filters: filterValues.map((f) => f.criteria),
      // only save criteria for enabled filters
      criteria: filterValues,
      context: CONTEXT_ACTIVITIES,
      visibility
    };

    saveFilterCriteria(filterToSave);
  };

  const handleColumnsChange = (ev) => {
    const { value } = ev.target;
    let newColumns = value;
    const allCompanies = ["submitter_company", "speaker_company", "sponsor"];
    const mediaUploadsSelected = newColumns.includes("media_uploads");

    newColumns = newColumns.filter((col) => col !== "media_uploads_display");
    if (mediaUploadsSelected) newColumns.push("media_uploads_display");

    const hasAllCompanies = newColumns.includes("all_companies");
    const selectedCompanies = selectedColumns.filter((c) =>
      allCompanies.includes(c)
    ).length;
    const newCompanies = newColumns.filter((c) =>
      allCompanies.includes(c)
    ).length;

    if (selectedColumns.includes("all_companies") && !hasAllCompanies) {
      newColumns = newColumns.filter((e) => !allCompanies.includes(e));
    } else if (hasAllCompanies) {
      if (newCompanies === 0) {
        newColumns = [...selectedColumns, ...allCompanies, "all_companies"];
      } else if (newCompanies === selectedCompanies) {
        newColumns = [
          ...new Set([...newColumns, ...allCompanies, "all_companies"])
        ];
      } else if (newCompanies < selectedCompanies) {
        newColumns = newColumns.filter((c) => c !== "all_companies");
      }
    }

    setSelectedColumns(newColumns);
  };

  const handleFilterCriteriaChange = (filterCriteria) => {
    setSelectedFilterCriteria(filterCriteria);
  };

  const handleFilterCriteriaDelete = (filterCriteriaId) => {
    deleteFilterCriteria(filterCriteriaId).then(() => {
      setSelectedFilterCriteria(null);
    });
  };

  const translateSortKey = (key) => {
    switch (key) {
      case "last_name":
        return "name";
      case "created_by_company":
        return "submitter_company";
      case "actions":
        return "progress_flags";
      default:
        break;
    }

    return key;
  };

  const eventTypeOptions = buildNameIdDDL(currentSummit.event_types);

  let columns = [
    { columnKey: "id", value: T.translate("general.id"), sortable: true },
    {
      columnKey: "type",
      value: T.translate("event_list.type"),
      sortable: true,
      // eslint-disable-next-line react/no-unstable-nested-components
      editableField: (extraProps) => (
        <Dropdown
          id="type"
          placeholder={T.translate("event_list.placeholders.event_type")}
          options={eventTypeOptions}
          value={extraProps.value}
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
      ),
      render: (e) => e.name
    },
    {
      columnKey: "title",
      value: T.translate("event_list.title"),
      sortable: true,
      editableField: true
    },
    {
      columnKey: "selection_status",
      value: T.translate("event_list.selection_status"),
      sortable: true
    }
  ];

  const tableOptions = {
    sortCol: translateSortKey(order),
    sortDir: orderDir,
    className: "summit-event-list-table",
    actions: {
      edit: { onClick: handleEdit },
      delete: { onClick: handleDeleteEvent }
    }
  };

  const columnOptions = [
    {
      value: "event_type_capacity",
      label: T.translate("event_list.event_type_capacity")
    },
    { value: "speakers", label: T.translate("event_list.speakers") },
    {
      value: "all_companies",
      label: T.translate("event_list.all_companies")
    },
    {
      value: "created_by_fullname",
      label: T.translate("event_list.created_by")
    },
    { value: "duration", label: T.translate("event_list.duration") },
    { value: "end_date", label: T.translate("event_list.end_date") },
    { value: "published_date", label: T.translate("event_list.published") },
    {
      value: "speaker_company",
      label: T.translate("event_list.speaker_company")
    },
    {
      value: "speakers_count",
      label: T.translate("event_list.speakers_count")
    },
    { value: "sponsor", label: T.translate("event_list.sponsor") },
    {
      value: "selection_plan",
      label: T.translate("event_list.selection_plan")
    },
    { value: "location", label: T.translate("event_list.location") },
    { value: "level", label: T.translate("event_list.level") },
    { value: "tags", label: T.translate("event_list.tags") },
    {
      value: "streaming_url",
      label: T.translate("event_list.streaming_url")
    },
    { value: "meeting_url", label: T.translate("event_list.meeting_url") },
    {
      value: "etherpad_link",
      label: T.translate("event_list.etherpad_link")
    },
    {
      value: "streaming_type",
      label: T.translate("event_list.streaming_type")
    },
    { value: "start_date", label: T.translate("event_list.start_date") },
    {
      value: "submitter_company",
      label: T.translate("event_list.submitter_company")
    },
    { value: "track", label: T.translate("event_list.track") },
    { value: "status", label: T.translate("event_list.submission_status") },
    {
      value: "submission_source",
      label: T.translate("event_list.submission_source")
    },
    {
      value: "progress_flags",
      label: T.translate("event_list.progress_flags")
    },
    {
      value: "media_uploads",
      label: T.translate("event_list.media_uploads")
    },
    {
      value: "review_status",
      label: T.translate("event_list.review_status")
    },
    { value: "created", label: T.translate("event_list.created") },
    { value: "modified", label: T.translate("event_list.modified") },
    {
      value: "allow_feedback",
      label: T.translate("event_list.allow_feedback")
    },
    {
      value: "to_record",
      label: T.translate("event_list.to_record")
    }
  ];

  const showColumns = fieldNames(
    currentSummit.selection_plans,
    currentSummit.tracks,
    currentSummit.event_types,
    currentSummit.id
  )
    .filter(
      (f) =>
        selectedColumns.includes(f.columnKey) &&
        !defaultColumns.includes(f.columnKey)
    )
    .map((f2) => {
      let c = {
        columnKey: f2.columnKey,
        value: T.translate(`event_list.${f2.value}`),
        sortable: f2.sortable,
        editable: !!editableColumns.includes(f2.editable),
        customStyle: f2.customStyle
      };
      // optional fields
      if (f2?.title) c = { ...c, title: f2.title };

      if (f2?.render) c = { ...c, render: f2.render };

      if (f2?.editableField) c = { ...c, editableField: f2.editableField };

      return c;
    });

  columns = [...columns, ...showColumns];

  if (!currentSummit.id) return <div />;

  return (
    <div className="container summit-event-list-filters">
      <h3>
        {T.translate("event_list.event_list")} ({totalEvents})
      </h3>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "20px"
        }}
      >
        <div style={{ flex: 1 }}>
          <FreeTextSearch
            value={term ?? ""}
            placeholder={T.translate("event_list.placeholders.search_events")}
            title={T.translate("event_list.placeholders.search_events")}
            onSearch={handleSearch}
            onChange={handleTermChange}
          />
        </div>
        <button
          className="btn btn-primary"
          onClick={handleNewEvent}
          type="button"
        >
          {T.translate("event_list.add_event")}
        </button>
        <button
          className="btn btn-default"
          onClick={handleExport}
          type="button"
        >
          {T.translate("general.export")}
        </button>
        <button
          className="btn btn-default"
          onClick={handleMUXImport}
          type="button"
        >
          {T.translate("event_list.mux_import")}
        </button>
        <button
          className="btn btn-default"
          onClick={() => setShowImportModal(true)}
          type="button"
        >
          {T.translate("event_list.import")}
        </button>
      </div>
      <hr />
      <div style={{ display: "flex", gap: "20px" }}>
        <div style={{ minWidth: "50%" }}>
          <SelectFilterCriteria
            summitId={currentSummit.id}
            context={CONTEXT_ACTIVITIES}
            onDelete={handleFilterCriteriaDelete}
            selectedFilterCriteria={selectedFilterCriteria}
            onChange={handleFilterCriteriaChange}
          />
        </div>
        <GridFilter
          id={FILTER_ID}
          criterias={getCriterias(currentSummit, mediaUploadTypes)}
        />
      </div>
      <SaveFilterCriteria
        onSave={handleFilterCriteriaSave}
        selectedFilterCriteria={selectedFilterCriteria}
      />
      <hr />
      <div className="row" style={{ marginBottom: 15 }}>
        <div className="col-md-12">
          <label htmlFor="select_fields">
            {T.translate("event_list.select_fields")}
          </label>
          <Dropdown
            id="select_fields"
            placeholder={T.translate("event_list.placeholders.select_fields")}
            value={selectedColumns}
            onChange={handleColumnsChange}
            options={handleDDLSortByLabel(columnOptions)}
            isClearable
            isMulti
          />
        </div>
      </div>

      {events.length === 0 && <div>{T.translate("event_list.no_events")}</div>}

      {events.length > 0 && (
        <div>
          <div className="summit-event-list-table-wrapper">
            <EditableTable
              currentSummit={currentSummit}
              page={currentPage}
              options={tableOptions}
              data={events}
              columns={columns}
              handleSort={handleSort}
              updateData={bulkUpdateEvents}
              handleDeleteRow={handleDeleteEvent}
              formattingFunction={formatEventData}
            />
          </div>
          <Pagination
            bsSize="medium"
            prev
            next
            first
            last
            ellipsis
            boundaryLinks
            maxButtons={10}
            items={lastPage}
            activePage={currentPage}
            onSelect={handlePageChange}
          />
        </div>
      )}

      <ImportModal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={importEventsCSV}
      />

      <ImportMUXModal
        show={showImportFromMUXModal}
        onClose={() => setShowImportFromMUXModal(false)}
        onImport={importMP4AssetsFromMUX}
      />
    </div>
  );
};

const mapStateToProps = ({
  currentSummitState,
  currentEventListState,
  mediaUploadListState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  mediaUploadTypes: mediaUploadListState.media_uploads,
  ...currentEventListState
});

export default connect(mapStateToProps, {
  getEvents,
  deleteEvent,
  exportEvents,
  importEventsCSV,
  importMP4AssetsFromMUX,
  changeEventListSearchTerm,
  saveFilterCriteria,
  deleteFilterCriteria,
  bulkUpdateEvents,
  getMediaUploads
})(SummitEventListPage);
