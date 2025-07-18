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

import React from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import Swal from "sweetalert2";
import { Modal, Pagination } from "react-bootstrap";
import {
  CompanyInput,
  DateTimePicker,
  Dropdown,
  FreeTextSearch,
  Input,
  MemberInput,
  OperatorInput,
  SpeakerInput,
  TagInput,
  UploadInput
} from "openstack-uicore-foundation/lib/components";
import { SegmentedControl } from "segmented-control";
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
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
} from "../../actions/event-actions";
import { handleDDLSortByLabel, hasErrors } from "../../utils/methods";
import "../../styles/summit-event-list-page.less";
import OrAndFilter from "../../components/filters/or-and-filter";
import MediaTypeFilter from "../../components/filters/media-type-filter";
import {
  ALL_FILTER,
  DATE_FILTER_ARRAY_SIZE,
  DEFAULT_CURRENT_PAGE,
  DEFAULT_PER_PAGE,
  DEFAULT_Z_INDEX,
  HIGH_Z_INDEX,
  INDEX_NOT_FOUND
} from "../../utils/constants";
import {
  defaultColumns,
  editableColumns,
  formatEventData
} from "../../utils/summitUtils";
import SaveFilterCriteria from "../../components/filters/save-filter-criteria";
import SelectFilterCriteria from "../../components/filters/select-filter-criteria";
import {
  deleteFilterCriteria,
  saveFilterCriteria
} from "../../actions/filter-criteria-actions";
import { CONTEXT_ACTIVITIES } from "../../utils/filter-criteria-constants";
import EditableTable from "../../components/tables/editable-table/EditableTable";
import { saveEventMaterial } from "../../actions/event-material-actions";

const fieldNames = (allSelectionPlans, allTracks, event_types) => [
  {
    columnKey: "speakers",
    value: "speakers",
    customStyle: { minWidth: "350px" },
    editableField: (extraProps) => {
      const useSpeakers = extraProps.row.type?.use_speakers;
      return useSpeakers ? (
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
      ) : (
        false
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
      const track_ddl = allTracks
        ?.sort((a, b) => a.order - b.order)
        .map((t) => ({ label: t.name, value: t.id }));

      return (
        <Dropdown
          id="track"
          value={extraProps.value}
          options={track_ddl}
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
      if (!extraProps.row.type?.id) return false;

      const event_type = event_types.find(
        (t) => t.id === extraProps.row.type?.id
      );

      const allowSelectionPlanEdit =
        ["PresentationType"].indexOf(event_type.class_name) !==
          INDEX_NOT_FOUND ||
        ["PresentationType"].indexOf(event_type.name) !== INDEX_NOT_FOUND;

      if (!allowSelectionPlanEdit) return false;

      const track = allTracks.find((t) => t.id === extraProps.row?.track?.id);

      const selection_plans_per_track = allSelectionPlans
        .filter(
          (sp) =>
            !track ||
            sp.track_groups.some((gr) => track.track_groups.includes(gr))
        )
        ?.sort((a, b) => a.order - b.order)
        .map((sp) => ({ label: sp.name, value: sp.id }));

      return (
        <Dropdown
          id="selection_plan"
          options={selection_plans_per_track}
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
    render: (e) => e?.name ? e.name : "N/A"
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
    render: (e) => {
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
                  window.open(
                    `/app/summits/${m.summit_id}/events/${m.event_id}/materials/${m.id}`,
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
      const media_uploads = row?.media_uploads || [];
      if (!media_uploads.length) return "N/A";
      return (
        <>
          {media_uploads.map((m) => (
            <React.Fragment key={m.id}>
              {`"${m.media_upload_type.name}" : `}
              <b>{`${m.display_on_site ? "Yes" : "No"}`}</b>
              <br />
            </React.Fragment>
          ))}
        </>
      );
    },
    editableField: (extraProps) => {
      const media_uploads = extraProps.row?.media_uploads || [];
      if (!media_uploads.length) return false;
      return (
        <>
          {media_uploads.map((m) => (
            <div key={m.id}>
              {`"${m.media_upload_type.name}": `}
              <Dropdown
                id={`media_uploads___${m.id}___display_on_site`}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...extraProps}
                value={m.display_on_site}
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
              />
            </div>
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

const defaultFilters = {
  event_type_capacity_filter: [],
  selection_plan_id_filter: [],
  location_id_filter: [],
  selection_status_filter: [],
  track_id_filter: [],
  event_type_id_filter: [],
  speaker_id_filter: [],
  speaker_company: [],
  level_filter: [],
  tags_filter: [],
  published_filter: null,
  progress_flag: [],
  created_filter: Array(DATE_FILTER_ARRAY_SIZE).fill(null),
  modified_filter: Array(DATE_FILTER_ARRAY_SIZE).fill(null),
  start_date_filter: Array(DATE_FILTER_ARRAY_SIZE).fill(null),
  end_date_filter: Array(DATE_FILTER_ARRAY_SIZE).fill(null),
  duration_filter: "",
  speakers_count_filter: "",
  submitters: [],
  submitter_company: [],
  streaming_url: "",
  meeting_url: "",
  etherpad_link: "",
  streaming_type: "",
  sponsor: [],
  all_companies: [],
  submission_status_filter: [],
  media_upload_with_type: { operator: null, value: [] },
  review_status_filter: [],
  submission_source_filter: ""
};

class SummitEventListPage extends React.Component {
  constructor(props) {
    super(props);

    this.handleEdit = this.handleEdit.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.handleSort = this.handleSort.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleNewEvent = this.handleNewEvent.bind(this);
    this.handleDeleteEvent = this.handleDeleteEvent.bind(this);
    this.handleExport = this.handleExport.bind(this);
    this.handleChangeSendSpeakerEmail =
      this.handleChangeSendSpeakerEmail.bind(this);
    this.handleImportEvents = this.handleImportEvents.bind(this);
    this.handleMUXImport = this.handleMUXImport.bind(this);
    this.handleChangeMUXModal = this.handleChangeMUXModal.bind(this);
    this.handleImportAssetsFromMUX = this.handleImportAssetsFromMUX.bind(this);
    this.handleExtraFilterChange = this.handleExtraFilterChange.bind(this);
    this.handleTagOrSpeakerFilterChange =
      this.handleTagOrSpeakerFilterChange.bind(this);
    this.handleSetPublishedFilter = this.handleSetPublishedFilter.bind(this);
    this.handleChangeDateFilter = this.handleChangeDateFilter.bind(this);
    this.handleApplyEventFilters = this.handleApplyEventFilters.bind(this);
    this.handleFiltersChange = this.handleFiltersChange.bind(this);
    this.handleColumnsChange = this.handleColumnsChange.bind(this);
    this.handleTermChange = this.handleTermChange.bind(this);
    this.handleOrAndFilter = this.handleOrAndFilter.bind(this);
    this.handleFilterCriteriaSave = this.handleFilterCriteriaSave.bind(this);
    this.handleFilterCriteriaChange =
      this.handleFilterCriteriaChange.bind(this);
    this.handleFilterCriteriaDelete =
      this.handleFilterCriteriaDelete.bind(this);

    this.state = {
      showImportModal: false,
      send_speaker_email: false,
      showImportFromMUXModal: false,
      importFile: null,
      muxModalState: {
        mux_token_id: "",
        mux_token_secret: "",
        mux_email_to: ""
      },
      enabledFilters: [],
      errors: {},
      eventFilters: {
        ...defaultFilters,
        orAndFilter: ALL_FILTER
      },
      selectedColumns: [],
      selectedFilterCriteria: null
    };

    this.extraFilters = {
      allows_attendee_vote_filter: false,
      allows_location_filter: false,
      allows_publishing_dates_filter: false
    };
  }

  componentDidMount() {
    const {
      getEvents,
      currentSummit,
      filters,
      extraColumns,
      term,
      currentPage,
      perPage,
      order,
      orderDir
    } = this.props;
    const { eventFilters } = this.state;
    const enabledFilters = Object.keys(filters).filter((e) =>
      Array.isArray(filters[e])
        ? filters[e]?.some((e) => e !== null)
        : filters[e]?.length > 0
    );

    this.setState((prevState) => ({
      ...prevState,
      selectedColumns: extraColumns,
      enabledFilters,
      eventFilters: { ...eventFilters, ...filters }
    }));

    if (currentSummit) {
      getEvents(
        term,
        currentPage,
        perPage,
        order,
        orderDir,
        filters,
        extraColumns
      );
    }
  }

  handleChangeSendSpeakerEmail(ev) {
    this.setState((prevState) => ({
      ...prevState,
      send_speaker_email: ev.target.checked
    }));
  }

  handleChangeMUXModal(ev) {
    const { errors, muxModalState } = this.state;
    const newErrors = { ...errors };
    const newMuxModalState = { ...muxModalState };
    const { value, id } = ev.target;
    newErrors[id] = "";
    newMuxModalState[id] = value;
    this.setState((prevState) => ({
      ...prevState,
      muxModalState,
      errors: newErrors
    }));
  }

  handleMUXImport(ev) {
    ev.preventDefault();
    this.setState((prevState) => ({
      ...prevState,
      showImportFromMUXModal: true
    }));
  }

  handleImportAssetsFromMUX(ev) {
    const { importMP4AssetsFromMUX } = this.props;
    const {
      muxModalState: { mux_token_id, mux_token_secret, mux_email_to }
    } = this.state;
    ev.preventDefault();
    importMP4AssetsFromMUX(mux_token_id, mux_token_secret, mux_email_to).then(
      () =>
        this.setState((prevState) => ({
          ...prevState,
          muxModalState: {
            mux_token_id: "",
            mux_token_secret: "",
            mux_email_to: ""
          }
        }))
    );
  }

  handleImportEvents() {
    const { importEventsCSV } = this.props;
    const { importFile, send_speaker_email } = this.state;
    if (importFile) {
      importEventsCSV(importFile, send_speaker_email);
    }
    this.setState((prevState) => ({
      ...prevState,
      showImportModal: false,
      send_speaker_email: false,
      importFile: null
    }));
  }

  handleEdit(event_id) {
    const { currentSummit, history } = this.props;
    history.push(`/app/summits/${currentSummit.id}/events/${event_id}`);
  }

  handleExport(ev) {
    const { order, orderDir, term, exportEvents } = this.props;
    const { eventFilters, selectedColumns } = this.state;
    ev.preventDefault();
    exportEvents(term, order, orderDir, eventFilters, selectedColumns);
  }

  handlePageChange(page) {
    const { order, orderDir, perPage, term, getEvents } = this.props;
    const { eventFilters, selectedColumns } = this.state;
    getEvents(
      term,
      page,
      perPage,
      order,
      orderDir,
      eventFilters,
      selectedColumns
    );
  }

  handleSort(index, key, dir) {
    const { term, getEvents } = this.props;
    const { eventFilters, selectedColumns } = this.state;

    switch (key) {
      case "name":
        key = "last_name";
        break;
      case "submitter_company":
        key = "created_by_company";
        break;
      case "progress_flags":
        key = "actions";
        break;
      default:
        break;
    }

    getEvents(
      term,
      DEFAULT_CURRENT_PAGE,
      DEFAULT_PER_PAGE,
      key,
      dir,
      eventFilters,
      selectedColumns
    );
  }

  handleSearch(term) {
    const { order, orderDir, getEvents } = this.props;
    const { eventFilters, selectedColumns } = this.state;
    getEvents(
      term,
      DEFAULT_CURRENT_PAGE,
      DEFAULT_PER_PAGE,
      order,
      orderDir,
      eventFilters,
      selectedColumns
    );
  }

  handleNewEvent() {
    const { currentSummit, history } = this.props;
    history.push(`/app/summits/${currentSummit.id}/events/new`);
  }

  handleDeleteEvent(eventId) {
    const { deleteEvent, events } = this.props;
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
  }

  handleTermChange(term) {
    const { changeEventListSearchTerm } = this.props;
    changeEventListSearchTerm(term);
  }

  handleApplyEventFilters() {
    const { order, orderDir, term, getEvents } = this.props;
    const { eventFilters, selectedColumns } = this.state;
    getEvents(
      term,
      DEFAULT_CURRENT_PAGE,
      DEFAULT_PER_PAGE,
      order,
      orderDir,
      eventFilters,
      selectedColumns
    );
    this.setState((prevState) => ({
      ...prevState,
      selectedFilterCriteria: null
    }));
  }

  handleExtraFilterChange(ev) {
    const { eventFilters } = this.state;
    const { type, id } = ev.target;
    let { value } = ev.target;
    if (type === "operatorinput") {
      value = Array.isArray(value)
        ? value
        : `${ev.target.operator}${ev.target.value}`;
      if (id === "duration_filter") {
        value = Array.isArray(value)
          ? value
          : `${ev.target.operator}${ev.target.value}`;
      }
    }
    if (type === "mediatypeinput") {
      value = {
        operator: ev.target.operator,
        value: ev.target.value
      };
    }
    this.setState((prevState) => ({
      ...prevState,
      eventFilters: { ...eventFilters, [id]: value },
      selectedFilterCriteria: null
    }));
  }

  handleOrAndFilter(ev) {
    const { eventFilters } = this.state;
    this.setState((prevState) => ({
      ...prevState,
      eventFilters: { ...eventFilters, orAndFilter: ev }
    }));
  }

  handleTagOrSpeakerFilterChange(ev) {
    const { value, id } = ev.target;
    const { eventFilters } = this.state;
    this.setState((prevState) => ({
      ...prevState,
      eventFilters: { ...eventFilters, [id]: value }
    }));
  }

  handleSetPublishedFilter(ev) {
    const { eventFilters } = this.state;
    this.extraFilters.published_filter = ev;
    this.setState((prevState) => ({
      ...prevState,
      eventFilters: { ...eventFilters, published_filter: ev }
    }));
  }

  handleFiltersChange(ev) {
    const { value } = ev.target;
    const { enabledFilters, eventFilters } = this.state;
    if (value.length < enabledFilters.length) {
      if (value.length === 0) {
        this.setState((prevState) => ({
          ...prevState,
          enabledFilters: value,
          eventFilters: defaultFilters,
          selectedFilterCriteria: null
        }));
      } else {
        const removedFilter = enabledFilters.filter(
          (e) => !value.includes(e)
        )[0];
        let defaultValue;
        if (removedFilter === "published_filter") {
          defaultValue = null;
        } else if (Array.isArray(eventFilters[removedFilter])) {
          defaultValue = [];
        } else {
          defaultValue = "";
        }
        const newEventFilters = {
          ...eventFilters,
          [removedFilter]: defaultValue
        };
        this.setState((prevState) => ({
          ...prevState,
          enabledFilters: value,
          eventFilters: newEventFilters,
          selectedFilterCriteria: null
        }));
      }
    } else {
      this.setState((prevState) => ({
        ...prevState,
        enabledFilters: value,
        selectedFilterCriteria: null
      }));
    }
  }

  handleChangeDateFilter(ev, lastDate) {
    const { value, id } = ev.target;
    const { eventFilters } = this.state;
    const newDateFilter = eventFilters[id];

    this.setState((prevState) => ({
      ...prevState,
      eventFilters: {
        ...eventFilters,
        [id]: lastDate
          ? [newDateFilter[0], value.unix()]
          : [value.unix(), newDateFilter[1]]
      }
    }));
  }

  handleFilterCriteriaSave(filterData) {
    const { enabledFilters, eventFilters } = this.state;
    const { currentSummit, saveFilterCriteria } = this.props;
    const filterToSave = {
      id: filterData.id,
      show_id: currentSummit.id,
      name: filterData.name,
      enabled_filters: enabledFilters,
      // only save criteria for enabled filters
      criteria: Object.fromEntries(
        Object.entries(eventFilters).filter(([key]) =>
          enabledFilters.includes(key)
        )
      ),
      context: CONTEXT_ACTIVITIES,
      visibility: filterData.visibility
    };
    saveFilterCriteria(filterToSave);
  }

  handleColumnsChange(ev) {
    const { value } = ev.target;
    const { selectedColumns } = this.state;
    let newColumns = value;
    const all_companies = ["submitter_company", "speaker_company", "sponsor"];

    const mediaUploadsSelected = newColumns.includes("media_uploads");

    // Ensure 'media_uploads_display' is included if 'media_uploads' is selected
    if (mediaUploadsSelected && !newColumns.includes("media_uploads_display")) {
      newColumns = [...newColumns, "media_uploads_display"];
    }

    // Remove 'media_uploads_display' if 'media_uploads' is deselected
    if (!mediaUploadsSelected && newColumns.includes("media_uploads_display")) {
      newColumns = newColumns.filter((col) => col !== "media_uploads_display");
    }

    if (
      selectedColumns.includes("all_companies") &&
      !newColumns.includes("all_companies")
    ) {
      newColumns = [...newColumns.filter((e) => !all_companies.includes(e))];
    }
    const selectedCompanies = selectedColumns.filter((c) =>
      all_companies.includes(c)
    ).length;
    const newCompanies = newColumns.filter((c) =>
      all_companies.includes(c)
    ).length;
    if (newColumns.includes("all_companies")) {
      if (newColumns.filter((c) => all_companies.includes(c)).length === 0) {
        newColumns = [...selectedColumns, ...all_companies, "all_companies"];
      } else if (selectedCompanies === newCompanies) {
        newColumns = [
          ...new Set([...newColumns, ...all_companies, "all_companies"])
        ];
      } else if (newCompanies < selectedCompanies) {
        newColumns = [...newColumns.filter((c) => c !== "all_companies")];
      }
    }
    this.setState((prevState) => ({
      ...prevState,
      selectedColumns: newColumns
    }));
  }

  handleFilterCriteriaChange(filterCriteria) {
    const { extraColumns, term, order, orderDir, getEvents } = this.props;
    const { eventFilters } = this.state;
    let newEventFilters = {};
    if (filterCriteria) {
      Object.entries(filterCriteria.criteria).forEach(([key, values]) => {
        newEventFilters = { ...newEventFilters, [key]: values };
      });
    }

    this.setState(
      (prevState) => ({
        ...prevState,
        eventFilters: { ...defaultFilters, ...newEventFilters },
        enabledFilters: filterCriteria ? filterCriteria.enabled_filters : [],
        selectedFilterCriteria: filterCriteria || null
      }),
      () =>
        getEvents(
          term,
          DEFAULT_CURRENT_PAGE,
          DEFAULT_PER_PAGE,
          order,
          orderDir,
          eventFilters,
          extraColumns
        )
    );
  }

  handleFilterCriteriaDelete(filterCriteriaId) {
    const {
      extraColumns,
      term,
      order,
      orderDir,
      getEvents,
      deleteFilterCriteria
    } = this.props;
    const { eventFilters } = this.state;
    deleteFilterCriteria(filterCriteriaId).then(() =>
      this.setState(
        (prevState) => ({
          ...prevState,
          eventFilters: { ...defaultFilters, orAndFilter: ALL_FILTER },
          enabledFilters: [],
          selectedFilterCriteria: null
        }),
        () =>
          getEvents(
            term,
            DEFAULT_CURRENT_PAGE,
            DEFAULT_PER_PAGE,
            order,
            orderDir,
            eventFilters,
            extraColumns
          )
      )
    );
  }

  translateSortKey = (key) => {
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

  render() {
    const {
      currentSummit,
      events,
      lastPage,
      currentPage,
      order,
      orderDir,
      totalEvents,
      term,
      bulkUpdateEvents,
      saveEventMaterial
    } = this.props;
    const {
      enabledFilters,
      eventFilters,
      selectedFilterCriteria,
      selectedColumns,
      showImportModal,
      send_speaker_email,
      importFile,
      showImportFromMUXModal,
      errors,
      muxModalState: { mux_token_id, mux_token_secret, mux_email_to }
    } = this.state;

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
            options={event_type_ddl}
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

    const table_options = {
      sortCol: this.translateSortKey(order),
      sortDir: orderDir,
      className: "summit-event-list-table",
      actions: {
        edit: { onClick: this.handleEdit },
        delete: { onClick: this.handleDeleteEvent }
      }
    };

    const selection_plans_ddl = currentSummit.selection_plans
      ?.sort((a, b) => a.order - b.order)
      .map((sp) => ({ label: sp.name, value: sp.id }));

    const location_ddl = currentSummit.locations
      ?.sort((a, b) => a.order - b.order)
      .map((l) => ({ label: l.name, value: l.id }));

    const selection_status_ddl = [
      { label: "Pending", value: "pending" },
      { label: "Accepted", value: "accepted" },
      { label: "Rejected", value: "rejected" },
      { label: "Alternate", value: "alternate" }
    ];

    const track_ddl = currentSummit.tracks
      ?.sort((a, b) => a.order - b.order)
      .map((t) => ({ label: t.name, value: t.id }));

    const event_type_ddl = currentSummit.event_types
      ?.sort((a, b) => a.order - b.order)
      .map((t) => ({ label: t.name, value: t.id }));

    const level_ddl = [
      { label: "Beginner", value: "beginner" },
      { label: "Intermediate", value: "intermediate" },
      { label: "Advanced", value: "advanced" },
      { label: "N/A", value: "na" }
    ];

    const streaming_type_ddl = [
      { label: "LIVE", value: "LIVE" },
      { label: "VOD", value: "VOD" }
    ];

    const submission_source_ddl = [
      { label: "Admin", value: "Admin" },
      { label: "Submission", value: "Submission" }
    ];

    const filters_ddl = [
      { label: "Activity Type Capacity", value: "event_type_capacity_filter" },
      { label: "Selection Plan", value: "selection_plan_id_filter" },
      { label: "Activity Type", value: "event_type_id_filter" },
      { label: "Activity Category", value: "track_id_filter" },
      { label: "Level", value: "level_filter" },
      { label: "Etherpad URL", value: "etherpad_link" },
      { label: "Location", value: "location_id_filter" },
      { label: "Meeting URL", value: "meeting_url" },
      { label: "Progress Flag", value: "progress_flag" },
      { label: "Published Status", value: "published_filter" },
      { label: "Speakers", value: "speaker_id_filter" },
      { label: "Speakers Companies", value: "speaker_company" },
      { label: "Tags", value: "tags_filter" },
      { label: "Start Date", value: "start_date_filter" },
      { label: "End Date", value: "end_date_filter" },
      { label: "Duration", value: "duration_filter" },
      { label: "Speakers Count", value: "speakers_count_filter" },
      { label: "Submitter", value: "submitters" },
      { label: "Submitter Company", value: "submitter_company" },
      { label: "Selection Status", value: "selection_status_filter" },
      { label: "Stream URL", value: "streaming_url" },
      { label: "Streaming Type", value: "streaming_type" },
      { label: "Sponsors", value: "sponsor" },
      { label: "All Companies", value: "all_companies" },
      {
        label: T.translate("event_list.submission_status"),
        value: "submission_status_filter"
      },
      {
        label: T.translate("event_list.media_upload_with_type"),
        value: "media_upload_with_type"
      },
      { label: "Review Status", value: "review_status_filter" },
      { label: "Created", value: "created_filter" },
      { label: "Modified", value: "modified_filter" },
      { label: "Submission Source", value: "submission_source_filter" }
    ];

    const ddl_columns = [
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

    const ddl_filterByEventTypeCapacity = [
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

    const submission_status_ddl = [
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

    const review_status_ddl = [
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

    const progress_flag_ddl = currentSummit.presentation_action_types.map(
      (pf) => ({ value: pf.id, label: pf.label })
    );

    const showColumns = fieldNames(
      currentSummit.selection_plans,
      currentSummit.tracks,
      currentSummit.event_types
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
        if (f2.hasOwnProperty("title")) c = { ...c, title: f2.title };

        if (f2.hasOwnProperty("render")) c = { ...c, render: f2.render };

        if (f2.hasOwnProperty("editableField"))
          c = { ...c, editableField: f2.editableField };

        return c;
      });

    columns = [...columns, ...showColumns];

    if (!currentSummit.id) return <div />;

    return (
      <div className="container summit-event-list-filters">
        <h3>
          {" "}
          {T.translate("event_list.event_list")} ({totalEvents})
        </h3>
        <div className="row">
          <div className="col-md-6">
            <FreeTextSearch
              value={term ?? ""}
              placeholder={T.translate("event_list.placeholders.search_events")}
              title={T.translate("event_list.placeholders.search_events")}
              onSearch={this.handleSearch}
              onChange={this.handleTermChange}
            />
          </div>
          <div className="col-md-6 text-right">
            <button
              className="btn btn-primary right-space"
              onClick={this.handleNewEvent}
              type="button"
            >
              {T.translate("event_list.add_event")}
            </button>
            <button
              className="btn btn-default right-space"
              onClick={this.handleExport}
              type="button"
            >
              {T.translate("general.export")}
            </button>
            <button
              className="btn btn-default right-space"
              onClick={this.handleMUXImport}
              type="button"
            >
              {T.translate("event_list.mux_import")}
            </button>
            <button
              className="btn btn-default"
              onClick={() => this.setState({ showImportModal: true })}
              type="button"
            >
              {T.translate("event_list.import")}
            </button>
          </div>
        </div>
        <hr />
        <div className="row">
          <div className="col-md-6">
            <OrAndFilter
              value={eventFilters.orAndFilter}
              entity="events"
              onChange={(filter) => this.handleOrAndFilter(filter)}
            />
          </div>
          <div className="col-md-6">
            <SelectFilterCriteria
              summitId={currentSummit.id}
              context={CONTEXT_ACTIVITIES}
              onDelete={this.handleFilterCriteriaDelete}
              selectedFilterCriteria={selectedFilterCriteria}
              onChange={this.handleFilterCriteriaChange}
            />
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <Dropdown
              id="enabled_filters"
              placeholder="Enabled Filters"
              value={enabledFilters}
              onChange={this.handleFiltersChange}
              options={handleDDLSortByLabel(filters_ddl)}
              isClearable
              isMulti
            />
          </div>
          <div className="col-md-6">
            <button
              className="btn btn-primary right-space"
              onClick={this.handleApplyEventFilters}
              type="button"
            >
              {T.translate("event_list.apply_filters")}
            </button>
          </div>
        </div>
        <SaveFilterCriteria
          onSave={this.handleFilterCriteriaSave}
          selectedFilterCriteria={selectedFilterCriteria}
        />
        <div className="filters-row">
          {enabledFilters.includes("event_type_capacity_filter") && (
            <div className="col-md-6">
              <Dropdown
                id="event_type_capacity_filter"
                placeholder={T.translate(
                  "event_list.placeholders.event_type_capacity"
                )}
                value={eventFilters.event_type_capacity_filter}
                onChange={this.handleExtraFilterChange}
                options={ddl_filterByEventTypeCapacity}
                isClearable
                isMulti
              />
            </div>
          )}
          {enabledFilters.includes("selection_plan_id_filter") && (
            <div className="col-md-6">
              <Dropdown
                id="selection_plan_id_filter"
                placeholder={T.translate(
                  "event_list.placeholders.selection_plan"
                )}
                value={eventFilters.selection_plan_id_filter}
                onChange={this.handleExtraFilterChange}
                options={selection_plans_ddl}
                isClearable
                isMulti
              />
            </div>
          )}
          {enabledFilters.includes("location_id_filter") && (
            <div className="col-md-6">
              <Dropdown
                id="location_id_filter"
                placeholder={T.translate("event_list.placeholders.location")}
                value={eventFilters.location_id_filter}
                onChange={this.handleExtraFilterChange}
                options={location_ddl}
                isClearable
                isMulti
              />
            </div>
          )}
          {enabledFilters.includes("selection_status_filter") && (
            <div className="col-md-6">
              <Dropdown
                id="selection_status_filter"
                placeholder={T.translate(
                  "event_list.placeholders.selection_status"
                )}
                value={eventFilters.selection_status_filter}
                onChange={this.handleExtraFilterChange}
                options={selection_status_ddl}
                isClearable
                isMulti
              />
            </div>
          )}
          {enabledFilters.includes("published_filter") && (
            <div className="col-md-6">
              <SegmentedControl
                name="published_filter"
                options={[
                  {
                    label: "All",
                    value: null,
                    default: eventFilters.published_filter === null
                  },
                  {
                    label: "Published",
                    value: "published",
                    default: eventFilters.published_filter === "published"
                  },
                  {
                    label: "Non Published",
                    value: "non_published",
                    default: eventFilters.published_filter === "non_published"
                  }
                ]}
                setValue={(newValue) => this.handleSetPublishedFilter(newValue)}
                style={{
                  width: "100%",
                  height: 40,
                  color: "#337ab7",
                  fontSize: "10px"
                }}
              />
            </div>
          )}
          {enabledFilters.includes("progress_flag") && (
            <div className="col-md-6">
              <Dropdown
                id="progress_flag"
                placeholder={T.translate(
                  "event_list.placeholders.progress_flag"
                )}
                value={eventFilters.progress_flag}
                onChange={this.handleExtraFilterChange}
                options={progress_flag_ddl}
                isClearable
                isMulti
              />
            </div>
          )}
          {enabledFilters.includes("track_id_filter") && (
            <div className="col-md-6">
              <Dropdown
                id="track_id_filter"
                placeholder={T.translate("event_list.placeholders.track")}
                value={eventFilters.track_id_filter}
                onChange={this.handleExtraFilterChange}
                options={track_ddl}
                isClearable
                isMulti
              />
            </div>
          )}
          {enabledFilters.includes("event_type_id_filter") && (
            <div className="col-md-6">
              <Dropdown
                id="event_type_id_filter"
                placeholder={T.translate("event_list.placeholders.event_type")}
                value={eventFilters.event_type_id_filter}
                onChange={this.handleExtraFilterChange}
                options={event_type_ddl}
                isClearable
                isMulti
              />
            </div>
          )}
          {enabledFilters.includes("speaker_id_filter") && (
            <div className="col-md-6">
              <SpeakerInput
                id="speaker_id_filter"
                placeholder={T.translate("event_list.placeholders.speaker")}
                value={eventFilters.speaker_id_filter}
                onChange={this.handleTagOrSpeakerFilterChange}
                summitId={currentSummit.id}
                isMulti
                isClearable
              />
            </div>
          )}
          {enabledFilters.includes("speaker_company") && (
            <div className="col-md-6">
              <CompanyInput
                id="speaker_company"
                value={eventFilters.speaker_company}
                placeholder={T.translate(
                  "event_list.placeholders.speaker_company"
                )}
                onChange={this.handleExtraFilterChange}
                queryFunction={querySpeakerCompany}
                multi
              />
            </div>
          )}
          {enabledFilters.includes("level_filter") && (
            <div className="col-md-6">
              <Dropdown
                id="level_filter"
                placeholder={T.translate("event_list.placeholders.level")}
                value={eventFilters.level_filter}
                onChange={this.handleExtraFilterChange}
                options={level_ddl}
                isClearable
                isMulti
              />
            </div>
          )}
          {enabledFilters.includes("tags_filter") && (
            <div className="col-md-6">
              <TagInput
                id="tags_filter"
                placeholder={T.translate("event_list.placeholders.tags")}
                value={eventFilters.tags_filter}
                onChange={this.handleTagOrSpeakerFilterChange}
                summitId={currentSummit.id}
                isMulti
                isClearable
              />
            </div>
          )}
          {enabledFilters.includes("sponsor") && (
            <div className="col-md-6">
              <CompanyInput
                id="sponsor"
                value={eventFilters.sponsor}
                placeholder={T.translate("event_list.placeholders.sponsor")}
                onChange={this.handleExtraFilterChange}
                multi
              />
            </div>
          )}
          {enabledFilters.includes("all_companies") && (
            <div className="col-md-6">
              <CompanyInput
                id="all_companies"
                value={eventFilters.all_companies}
                placeholder={T.translate(
                  "event_list.placeholders.all_companies"
                )}
                queryFunction={queryAllCompanies}
                onChange={this.handleExtraFilterChange}
                multi
                menuPortalTarget={document.body}
                menuPosition="fixed"
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  control: (base, state) => ({
                    ...base,
                    zIndex: state.menuIsOpen ? HIGH_Z_INDEX : DEFAULT_Z_INDEX
                  })
                }}
              />
            </div>
          )}
          {enabledFilters.includes("start_date_filter") && (
            <>
              <div className="col-md-3">
                <DateTimePicker
                  id="start_date_filter"
                  format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
                  inputProps={{
                    placeholder: T.translate(
                      "event_list.placeholders.start_date_from"
                    )
                  }}
                  timezone={currentSummit.time_zone.name}
                  onChange={(ev) => this.handleChangeDateFilter(ev, false)}
                  value={epochToMomentTimeZone(
                    eventFilters.start_date_filter[0],
                    currentSummit.time_zone_id
                  )}
                  className="event-list-date-picker"
                />
              </div>
              <div className="col-md-3">
                <DateTimePicker
                  id="start_date_filter"
                  format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
                  inputProps={{
                    placeholder: T.translate(
                      "event_list.placeholders.start_date_to"
                    )
                  }}
                  timezone={currentSummit.time_zone.name}
                  onChange={(ev) => this.handleChangeDateFilter(ev, true)}
                  value={epochToMomentTimeZone(
                    eventFilters.start_date_filter[1],
                    currentSummit.time_zone_id
                  )}
                  className="event-list-date-picker"
                />
              </div>
            </>
          )}
          {enabledFilters.includes("end_date_filter") && (
            <>
              <div className="col-md-3">
                <DateTimePicker
                  id="end_date_filter"
                  format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
                  inputProps={{
                    placeholder: T.translate(
                      "event_list.placeholders.end_date_from"
                    )
                  }}
                  timezone={currentSummit.time_zone.name}
                  onChange={(ev) => this.handleChangeDateFilter(ev, false)}
                  value={epochToMomentTimeZone(
                    eventFilters.end_date_filter[0],
                    currentSummit.time_zone_id
                  )}
                  className="event-list-date-picker"
                />
              </div>
              <div className="col-md-3">
                <DateTimePicker
                  id="end_date_filter"
                  format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
                  inputProps={{
                    placeholder: T.translate(
                      "event_list.placeholders.end_date_to"
                    )
                  }}
                  timezone={currentSummit.time_zone.name}
                  onChange={(ev) => this.handleChangeDateFilter(ev, true)}
                  value={epochToMomentTimeZone(
                    eventFilters.end_date_filter[1],
                    currentSummit.time_zone_id
                  )}
                  className="event-list-date-picker"
                />
              </div>
            </>
          )}
          {enabledFilters.includes("created_filter") && (
            <>
              <div className="col-md-3">
                <DateTimePicker
                  id="created_filter"
                  format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
                  inputProps={{
                    placeholder: T.translate(
                      "event_list.placeholders.created_from"
                    )
                  }}
                  timezone={currentSummit.time_zone.name}
                  onChange={(ev) => this.handleChangeDateFilter(ev, false)}
                  value={epochToMomentTimeZone(
                    eventFilters.created_filter[0],
                    currentSummit.time_zone_id
                  )}
                  className="event-list-date-picker"
                />
              </div>
              <div className="col-md-3">
                <DateTimePicker
                  id="created_filter"
                  format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
                  inputProps={{
                    placeholder: T.translate(
                      "event_list.placeholders.created_to"
                    )
                  }}
                  timezone={currentSummit.time_zone.name}
                  onChange={(ev) => this.handleChangeDateFilter(ev, true)}
                  value={epochToMomentTimeZone(
                    eventFilters.created_filter[1],
                    currentSummit.time_zone_id
                  )}
                  className="event-list-date-picker"
                />
              </div>
            </>
          )}
          {enabledFilters.includes("modified_filter") && (
            <>
              <div className="col-md-3">
                <DateTimePicker
                  id="modified_filter"
                  format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
                  inputProps={{
                    placeholder: T.translate(
                      "event_list.placeholders.modified_from"
                    )
                  }}
                  timezone={currentSummit.time_zone.name}
                  onChange={(ev) => this.handleChangeDateFilter(ev, false)}
                  value={epochToMomentTimeZone(
                    eventFilters.modified_filter[0],
                    currentSummit.time_zone_id
                  )}
                  className="event-list-date-picker"
                />
              </div>
              <div className="col-md-3">
                <DateTimePicker
                  id="modified_filter"
                  format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
                  inputProps={{
                    placeholder: T.translate(
                      "event_list.placeholders.modified_to"
                    )
                  }}
                  timezone={currentSummit.time_zone.name}
                  onChange={(ev) => this.handleChangeDateFilter(ev, true)}
                  value={epochToMomentTimeZone(
                    eventFilters.modified_filter[1],
                    currentSummit.time_zone_id
                  )}
                  className="event-list-date-picker"
                />
              </div>
            </>
          )}
          {enabledFilters.includes("submitters") && (
            <div className="col-md-6">
              <MemberInput
                id="submitters"
                value={eventFilters.submitters}
                onChange={this.handleExtraFilterChange}
                multi
                placeholder={T.translate("event_list.placeholders.submitters")}
                getOptionLabel={(member) =>
                  member.hasOwnProperty("email")
                    ? `${member.first_name} ${member.last_name} (${member.email})`
                    : `${member.first_name} ${member.last_name} (${member.id})`
                }
              />
            </div>
          )}
          {enabledFilters.includes("submitter_company") && (
            <div className="col-md-6">
              <CompanyInput
                id="submitter_company"
                value={eventFilters.submitter_company}
                placeholder={T.translate(
                  "event_list.placeholders.submitter_company"
                )}
                onChange={this.handleExtraFilterChange}
                queryFunction={querySubmitterCompany}
                multi
              />
            </div>
          )}
          {enabledFilters.includes("streaming_url") && (
            <div className="col-md-6">
              <Input
                id="streaming_url"
                value={eventFilters.streaming_url}
                placeholder={T.translate(
                  "event_list.placeholders.streaming_url"
                )}
                onChange={this.handleExtraFilterChange}
              />
            </div>
          )}
          {enabledFilters.includes("meeting_url") && (
            <div className="col-md-6">
              <Input
                id="meeting_url"
                value={eventFilters.meeting_url}
                placeholder={T.translate("event_list.placeholders.meeting_url")}
                onChange={this.handleExtraFilterChange}
              />
            </div>
          )}
          {enabledFilters.includes("etherpad_link") && (
            <div className="col-md-6">
              <Input
                id="etherpad_link"
                value={eventFilters.etherpad_link}
                placeholder={T.translate(
                  "event_list.placeholders.etherpad_link"
                )}
                onChange={this.handleExtraFilterChange}
              />
            </div>
          )}
          {enabledFilters.includes("streaming_type") && (
            <div className="col-md-6">
              <Dropdown
                id="streaming_type"
                value={eventFilters.streaming_type}
                onChange={this.handleExtraFilterChange}
                placeholder={T.translate(
                  "event_list.placeholders.streaming_type"
                )}
                options={streaming_type_ddl}
              />
            </div>
          )}
          {enabledFilters.includes("submission_source_filter") && (
            <div className="col-md-6">
              <Dropdown
                id="submission_source_filter"
                value={eventFilters.submission_source_filter}
                onChange={this.handleExtraFilterChange}
                placeholder={T.translate(
                  "event_list.placeholders.submission_source"
                )}
                options={submission_source_ddl}
              />
            </div>
          )}
          {enabledFilters.includes("duration_filter") && (
            <div className="col-md-10 col-md-offset-1">
              <OperatorInput
                id="duration_filter"
                label={T.translate("event_list.duration")}
                value={eventFilters.duration_filter}
                onChange={this.handleExtraFilterChange}
              />
            </div>
          )}
          {enabledFilters.includes("speakers_count_filter") && (
            <div className="col-md-10 col-md-offset-1">
              <OperatorInput
                id="speakers_count_filter"
                label={T.translate("event_list.speakers_count")}
                value={eventFilters.speakers_count_filter}
                onChange={this.handleExtraFilterChange}
              />
            </div>
          )}
          {enabledFilters.includes("submission_status_filter") && (
            <div className="col-md-6">
              <Dropdown
                id="submission_status_filter"
                placeholder={T.translate(
                  "event_list.placeholders.submission_status"
                )}
                value={eventFilters.submission_status_filter}
                onChange={this.handleExtraFilterChange}
                options={submission_status_ddl}
                isClearable
                isMulti
              />
            </div>
          )}
          {enabledFilters.includes("review_status_filter") && (
            <div className="col-md-6">
              <Dropdown
                id="review_status_filter"
                placeholder={T.translate(
                  "event_list.placeholders.review_status"
                )}
                value={eventFilters.review_status_filter}
                onChange={this.handleExtraFilterChange}
                options={review_status_ddl}
                isClearable
                isMulti
              />
            </div>
          )}
          {enabledFilters.includes("media_upload_with_type") && (
            <div className="col-md-12">
              <MediaTypeFilter
                id="media_upload_with_type"
                operatorInitialValue={
                  eventFilters.media_upload_with_type.operator
                }
                filterInitialValue={eventFilters.media_upload_with_type.value}
                summitId={currentSummit.id}
                onChange={this.handleExtraFilterChange}
              />
            </div>
          )}
        </div>

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
              onChange={this.handleColumnsChange}
              options={handleDDLSortByLabel(ddl_columns)}
              isClearable
              isMulti
            />
          </div>
        </div>

        {events.length === 0 && (
          <div>{T.translate("event_list.no_events")}</div>
        )}

        {events.length > 0 && (
          <div>
            <div className="summit-event-list-table-wrapper">
              <EditableTable
                currentSummit={currentSummit}
                page={currentPage}
                options={table_options}
                data={events}
                columns={columns}
                handleSort={this.handleSort}
                updateData={bulkUpdateEvents}
                afterUpdate={[
                  {
                    action: (data) => saveEventMaterial(data),
                    propertyName: "media_uploads"
                  }
                ]}
                handleDeleteRow={this.handleDeleteEvent}
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
              onSelect={this.handlePageChange}
            />
          </div>
        )}

        <Modal
          show={showImportModal}
          onHide={() => this.setState({ showImportModal: false })}
        >
          <Modal.Header closeButton>
            <Modal.Title>{T.translate("event_list.import_events")}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="row">
              <div className="col-md-12">
                Format must be the following:
                <br />
                (Minimal data required)
                <br />
                * title ( text )<br />
                * description (text )<br />
                * type_id (int) or type (string type name)
                <br />
                * track_id (int) or track ( string track name)
                <br />
                * speaker_emails ( list of email | delimited) [optional]
                <br />
                * speaker_fullnames ( list of full names | delimited) [optional]
                <br />
                * speaker_companies ( list of companies | delimited) [optional]
                <br />
                * speaker_titles ( list of titles | delimited) [optional]
                <br />
                <br />
              </div>
              <div className="col-md-12 ticket-import-upload-wrapper">
                <UploadInput
                  value={importFile && importFile?.name}
                  handleUpload={(file) => this.setState({ importFile: file })}
                  handleRemove={() => this.setState({ importFile: null })}
                  className="dropzone col-md-6"
                  multiple={false}
                  accept=".csv"
                />
              </div>
              <div className="col-md-12 checkboxes-div">
                <div className="form-check abc-checkbox">
                  <input
                    type="checkbox"
                    id="send_speaker_email"
                    checked={send_speaker_email}
                    onChange={this.handleChangeSendSpeakerEmail}
                    className="form-check-input"
                  />
                  <label
                    className="form-check-label"
                    htmlFor="send_speaker_email"
                  >
                    {T.translate("event_list.send_speaker_email")}
                  </label>
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button
              disabled={!importFile}
              className="btn btn-primary"
              onClick={this.handleImportEvents}
              type="button"
            >
              {T.translate("event_list.ingest")}
            </button>
          </Modal.Footer>
        </Modal>

        <Modal
          show={showImportFromMUXModal}
          onHide={() => this.setState({ showImportFromMUXModal: false })}
        >
          <Modal.Header closeButton>
            <Modal.Title>{T.translate("event_list.mux_import")}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="row">
              <div className="col-md-4">
                <label htmlFor="mux_token_id">
                  {" "}
                  {T.translate("event_list.mux_token_id")}
                </label>
                &nbsp;
                <i
                  className="fa fa-info-circle"
                  aria-hidden="true"
                  title={T.translate("event_list.mux_token_id_info")}
                />
                <Input
                  id="mux_token_id"
                  value={mux_token_id}
                  onChange={this.handleChangeMUXModal}
                  className="form-control"
                  error={hasErrors("mux_token_id", errors)}
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="mux_token_secret">
                  {" "}
                  {T.translate("event_list.mux_token_secret")}
                </label>
                &nbsp;
                <i
                  className="fa fa-info-circle"
                  aria-hidden="true"
                  title={T.translate("event_list.mux_token_secret_info")}
                />
                <Input
                  id="mux_token_secret"
                  value={mux_token_secret}
                  onChange={this.handleChangeMUXModal}
                  className="form-control"
                  error={hasErrors("mux_token_secret", errors)}
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="mux_email_to">
                  {" "}
                  {T.translate("event_list.mux_email_to")}
                </label>
                &nbsp;
                <i
                  className="fa fa-info-circle"
                  aria-hidden="true"
                  title={T.translate("event_list.mux_email_to_info")}
                />
                <Input
                  id="mux_email_to"
                  type="email"
                  value={mux_email_to}
                  onChange={this.handleChangeMUXModal}
                  className="form-control"
                  error={hasErrors("mux_email_to", errors)}
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button
              className="btn btn-primary"
              onClick={this.handleImportAssetsFromMUX}
              type="button"
            >
              {T.translate("event_list.import")}
            </button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}

const mapStateToProps = ({ currentSummitState, currentEventListState }) => ({
  currentSummit: currentSummitState.currentSummit,
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
  saveEventMaterial
})(SummitEventListPage);
